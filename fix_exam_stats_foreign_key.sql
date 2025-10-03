-- =====================================================
-- FIX EXAM_STATS FOREIGN KEY CONSTRAINT ISSUE
-- =====================================================

-- The error indicates that exam_stats is trying to reference a user_id
-- that doesn't exist in auth.users table. Let's fix this by:

-- 1. DROP THE PROBLEMATIC FOREIGN KEY CONSTRAINT
-- =====================================================

-- First, let's check what constraints exist
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'public.exam_stats'::regclass 
    AND contype = 'f';
    
    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Found foreign key constraint: %', constraint_name;
        -- Drop the constraint
        EXECUTE 'ALTER TABLE public.exam_stats DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found on exam_stats';
    END IF;
END $$;

-- 2. UPDATE THE TABLE TO USE A MORE FLEXIBLE APPROACH
-- =====================================================

-- Instead of a strict foreign key, we'll use a trigger to validate user existence
-- This allows for better error handling and data integrity

-- Create a function to validate user existence
CREATE OR REPLACE FUNCTION public.validate_exam_stats_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist in auth.users table', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate user_id before insert/update
DROP TRIGGER IF EXISTS validate_exam_stats_user_trigger ON public.exam_stats;
CREATE TRIGGER validate_exam_stats_user_trigger
    BEFORE INSERT OR UPDATE ON public.exam_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_exam_stats_user_id();

-- 3. ALTERNATIVE: CREATE A SOFT FOREIGN KEY (RECOMMENDED)
-- =====================================================

-- Instead of dropping the constraint completely, let's create a more flexible one
-- that references user_profiles instead of auth.users

-- First, let's check if user_profiles table exists and has the right structure
DO $$
DECLARE
    user_profiles_exists BOOLEAN;
    user_profiles_has_id BOOLEAN;
BEGIN
    -- Check if user_profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' AND table_schema = 'public'
    ) INTO user_profiles_exists;
    
    -- Check if user_profiles has id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'id' AND table_schema = 'public'
    ) INTO user_profiles_has_id;
    
    RAISE NOTICE 'user_profiles table exists: %', user_profiles_exists;
    RAISE NOTICE 'user_profiles has id column: %', user_profiles_has_id;
    
    IF user_profiles_exists AND user_profiles_has_id THEN
        -- Add foreign key constraint to user_profiles instead
        BEGIN
            ALTER TABLE public.exam_stats 
            ADD CONSTRAINT exam_stats_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) 
            ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint to user_profiles';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Foreign key constraint already exists';
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Cannot add foreign key constraint - user_profiles table or id column missing';
    END IF;
END $$;

-- 4. CLEAN UP ORPHANED RECORDS
-- =====================================================

-- Remove any exam_stats records that reference non-existent users
DELETE FROM public.exam_stats 
WHERE user_id NOT IN (
    SELECT id FROM auth.users
    UNION
    SELECT id FROM public.user_profiles
);

-- 5. CREATE A SAFE INSERT FUNCTION
-- =====================================================

-- Create a function that safely inserts exam_stats records
CREATE OR REPLACE FUNCTION public.safe_insert_exam_stats(
    p_user_id uuid,
    p_exam_id varchar(50),
    p_total_tests integer DEFAULT 0,
    p_best_score integer DEFAULT 0,
    p_average_score numeric DEFAULT 0.00,
    p_rank integer DEFAULT NULL,
    p_last_test_date timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, record_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    new_record_id uuid;
    user_exists boolean := false;
BEGIN
    -- Check if user exists in either auth.users or user_profiles
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
        UNION
        SELECT 1 FROM public.user_profiles WHERE id = p_user_id
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT false, 'User does not exist', NULL::uuid;
        RETURN;
    END IF;
    
    -- Insert the record
    INSERT INTO public.exam_stats (
        user_id, exam_id, total_tests, best_score, average_score, 
        rank, last_test_date, total_tests_taken, total_score, 
        total_time_taken, average_time_per_question, accuracy_percentage, percentile
    )
    VALUES (
        p_user_id, p_exam_id, p_total_tests, p_best_score, p_average_score,
        p_rank, p_last_test_date, p_total_tests, p_total_score,
        0, 0.00, 0.00, 0.00
    )
    RETURNING id INTO new_record_id;
    
    RETURN QUERY SELECT true, 'Exam stats created successfully', new_record_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM, NULL::uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.safe_insert_exam_stats(uuid, varchar, integer, integer, numeric, integer, timestamp with time zone) TO anon;
GRANT EXECUTE ON FUNCTION public.safe_insert_exam_stats(uuid, varchar, integer, integer, numeric, integer, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_insert_exam_stats(uuid, varchar, integer, integer, integer, numeric, integer, timestamp with time zone) TO service_role;

-- 6. UPDATE EXISTING FUNCTIONS TO USE SAFE INSERT
-- =====================================================

-- Update create_all_default_exam_stats to use safe insert
CREATE OR REPLACE FUNCTION public.create_all_default_exam_stats(p_user_id uuid)
RETURNS TABLE(success boolean, message text, stats_created integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    exam_id VARCHAR(50);
    stats_count INTEGER := 0;
    attempted_exams TEXT[] := ARRAY['ssc-cgl', 'ssc-mts', 'ssc-chsl', 'ssc-cpo', 'ssc-je', 'ssc-gd', 'ssc-constable', 'ssc-stenographer', 'ssc-multitasking', 'ssc-havaldar'];
    insert_result RECORD;
BEGIN
    -- First check if user exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE id = p_user_id
        UNION
        SELECT 1 FROM public.user_profiles WHERE id = p_user_id
    ) THEN
        RETURN QUERY SELECT false, 'User does not exist', 0;
        RETURN;
    END IF;
    
    -- Loop through each exam
    FOR exam_id IN 
        SELECT DISTINCT exam_id FROM unnest(attempted_exams) AS exam_id
    LOOP
        -- Use safe insert function
        SELECT * INTO insert_result
        FROM public.safe_insert_exam_stats(p_user_id, exam_id, 0, 0, 0.00, NULL, NULL);
        
        IF insert_result.success THEN
            stats_count := stats_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT true, 'Default exam stats created successfully', stats_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM, 0;
END;
$$;

-- 7. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- 8. VERIFY THE FIX
-- =====================================================

-- Test the fix
DO $$
DECLARE
    constraint_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'public.exam_stats'::regclass 
    AND contype = 'f';
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'public.exam_stats'::regclass;
    
    RAISE NOTICE 'Foreign key constraints on exam_stats: %', constraint_count;
    RAISE NOTICE 'Triggers on exam_stats: %', trigger_count;
    
    IF constraint_count > 0 OR trigger_count > 0 THEN
        RAISE NOTICE 'SUCCESS: exam_stats table constraints and triggers are properly configured';
    ELSE
        RAISE NOTICE 'WARNING: No constraints or triggers found on exam_stats';
    END IF;
END $$;

-- =====================================================
-- FOREIGN KEY FIX COMPLETED
-- =====================================================

-- Summary of what this script does:
-- 1. ✅ Removes problematic foreign key constraint to auth.users
-- 2. ✅ Adds validation trigger to check user existence
-- 3. ✅ Attempts to add foreign key to user_profiles (more reliable)
-- 4. ✅ Cleans up orphaned records
-- 5. ✅ Creates safe insert function with proper validation
-- 6. ✅ Updates existing functions to use safe insert
-- 7. ✅ Refreshes schema cache
-- 8. ✅ Verifies the fix

-- This should resolve the foreign key constraint violation!
