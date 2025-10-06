-- =====================================================
-- FINAL FIX FOR EXAM_STATS FOREIGN KEY CONSTRAINT ISSUE
-- =====================================================

-- Problem: exam_stats table has foreign key constraint to auth.users(id)
-- but the user_id being inserted doesn't exist in auth.users table
-- Solution: Update the constraint to reference user_profiles instead

-- 1. DROP THE PROBLEMATIC FOREIGN KEY CONSTRAINT
-- =====================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.exam_stats DROP CONSTRAINT IF EXISTS exam_stats_user_id_fkey;

-- 2. ADD FOREIGN KEY CONSTRAINT TO USER_PROFILES
-- =====================================================

-- Add foreign key constraint to user_profiles instead of auth.users
-- This is more reliable as user_profiles is our main user table
ALTER TABLE public.exam_stats 
ADD CONSTRAINT exam_stats_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- 3. CLEAN UP ORPHANED RECORDS
-- =====================================================

-- Remove any exam_stats records that reference non-existent users
DELETE FROM public.exam_stats 
WHERE user_id NOT IN (SELECT id FROM public.user_profiles);

-- 4. UPDATE FUNCTIONS TO HANDLE USER VALIDATION
-- =====================================================

-- Update initialize_user_exam_stats to check user_profiles first
CREATE OR REPLACE FUNCTION public.initialize_user_exam_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User with ID % does not exist in user_profiles', p_user_id;
    END IF;
    
    -- Insert default exam stats for common exams if they don't exist
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date, total_tests_taken, total_score, total_time_taken, average_time_per_question, accuracy_percentage, percentile)
    VALUES 
        (p_user_id, 'ssc-cgl', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-mts', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-chsl', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-cpo', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00),
        (p_user_id, 'ssc-je', 0, 0, 0, NULL, NULL, 0, 0, 0, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$$;

-- Update create_all_default_exam_stats to check user_profiles first
CREATE OR REPLACE FUNCTION public.create_all_default_exam_stats(p_user_id uuid)
RETURNS TABLE(success boolean, message text, stats_created integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    exam_id VARCHAR(50);
    stats_count INTEGER := 0;
    attempted_exams TEXT[] := ARRAY['ssc-cgl', 'ssc-mts', 'ssc-chsl', 'ssc-cpo', 'ssc-je', 'ssc-gd', 'ssc-constable', 'ssc-stenographer', 'ssc-multitasking', 'ssc-havaldar'];
BEGIN
    -- Check if user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
        RETURN QUERY SELECT false, 'User does not exist in user_profiles', 0;
        RETURN;
    END IF;
    
    -- Loop through each exam
    FOR exam_id IN 
        SELECT DISTINCT exam_id FROM unnest(attempted_exams) AS exam_id
    LOOP
        -- Insert default exam stats for this exam
        INSERT INTO exam_stats (
            user_id,
            exam_id,
            total_tests,
            best_score,
            average_score,
            rank,
            last_test_date,
            total_tests_taken,
            total_score,
            total_time_taken,
            average_time_per_question,
            accuracy_percentage,
            percentile
        )
        VALUES (
            p_user_id,
            exam_id,
            0,
            0,
            0.00,
            NULL,
            NULL,
            0,
            0,
            0,
            0.00,
            0.00,
            0.00
        )
        ON CONFLICT (user_id, exam_id) DO NOTHING;
        
        stats_count := stats_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT true, 'Default exam stats created successfully', stats_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM, 0;
END;
$$;

-- Update create_default_exam_stats to check user_profiles first
CREATE OR REPLACE FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if user exists in user_profiles
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
        RETURN QUERY SELECT false, 'User does not exist in user_profiles';
        RETURN;
    END IF;
    
    -- Insert default exam stats for the specific exam
    INSERT INTO exam_stats (
        user_id,
        exam_id,
        total_tests,
        best_score,
        average_score,
        rank,
        last_test_date,
        total_tests_taken,
        total_score,
        total_time_taken,
        average_time_per_question,
        accuracy_percentage,
        percentile
    )
    VALUES (
        p_user_id,
        p_exam_id,
        0,
        0,
        0.00,
        NULL,
        NULL,
        0,
        0,
        0,
        0.00,
        0.00,
        0.00
    )
    ON CONFLICT (user_id, exam_id) DO NOTHING;
    
    RETURN QUERY SELECT true, 'Default exam stats created for ' || p_exam_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error creating exam stats: ' || SQLERRM;
END;
$$;

-- 5. CREATE A SAFE WRAPPER FUNCTION
-- =====================================================

-- Create a function that safely initializes exam stats with proper error handling
CREATE OR REPLACE FUNCTION public.safe_initialize_user_exam_stats(p_user_id uuid)
RETURNS TABLE(success boolean, message text, stats_created integer)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_exists boolean := false;
    stats_count integer := 0;
BEGIN
    -- Check if user exists in user_profiles
    SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN QUERY SELECT false, 'User does not exist in user_profiles', 0;
        RETURN;
    END IF;
    
    -- Call the existing function
    SELECT * INTO success, message, stats_created
    FROM public.create_all_default_exam_stats(p_user_id);
    
    RETURN QUERY SELECT success, message, stats_created;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error initializing exam stats: ' || SQLERRM, 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.safe_initialize_user_exam_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.safe_initialize_user_exam_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_initialize_user_exam_stats(uuid) TO service_role;

-- 6. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to make changes visible to PostgREST
NOTIFY pgrst, 'reload schema';

-- 7. VERIFY THE FIX
-- =====================================================

-- Test that the constraint is properly set up
DO $$
DECLARE
    constraint_exists boolean;
    constraint_target text;
BEGIN
    -- Check if foreign key constraint exists and what it references
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.exam_stats'::regclass 
        AND conname = 'exam_stats_user_id_fkey'
    ) INTO constraint_exists;
    
    -- Get the referenced table
    SELECT c.confrelid::regclass::text INTO constraint_target
    FROM pg_constraint c
    WHERE c.conrelid = 'public.exam_stats'::regclass 
    AND c.conname = 'exam_stats_user_id_fkey';
    
    RAISE NOTICE 'Foreign key constraint exists: %', constraint_exists;
    RAISE NOTICE 'Constraint references table: %', constraint_target;
    
    IF constraint_exists AND constraint_target = 'user_profiles' THEN
        RAISE NOTICE 'SUCCESS: exam_stats foreign key constraint is properly configured';
    ELSE
        RAISE NOTICE 'ERROR: exam_stats foreign key constraint is not properly configured';
    END IF;
END $$;

-- =====================================================
-- FINAL FIX COMPLETED
-- =====================================================

-- Summary of what this script does:
-- 1. ✅ Drops the problematic foreign key constraint to auth.users
-- 2. ✅ Adds foreign key constraint to user_profiles (more reliable)
-- 3. ✅ Cleans up orphaned records
-- 4. ✅ Updates all functions to check user_profiles first
-- 5. ✅ Creates safe wrapper function with proper error handling
-- 6. ✅ Refreshes schema cache
-- 7. ✅ Verifies the fix

-- This should resolve the foreign key constraint violation!
