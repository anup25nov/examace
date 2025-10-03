-- =====================================================
-- COMPREHENSIVE FIX FOR EXAM_STATS TABLE AND RELATED ISSUES
-- =====================================================

-- 1. CREATE THE MISSING EXAM_STATS TABLE
-- =====================================================

-- Check if exam_stats table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_stats' AND table_schema = 'public') THEN
        -- Create the exam_stats table
        CREATE TABLE public.exam_stats (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            exam_id VARCHAR(50) NOT NULL,
            total_tests INTEGER DEFAULT 0,
            best_score INTEGER DEFAULT 0,
            average_score NUMERIC(5,2) DEFAULT 0.00,
            rank INTEGER DEFAULT NULL,
            last_test_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- Additional columns that might be referenced in functions
            total_tests_taken INTEGER DEFAULT 0,
            total_score INTEGER DEFAULT 0,
            total_time_taken INTEGER DEFAULT 0,
            average_time_per_question NUMERIC(5,2) DEFAULT 0.00,
            accuracy_percentage NUMERIC(5,2) DEFAULT 0.00,
            percentile NUMERIC(5,2) DEFAULT 0.00,
            
            -- Constraints
            CONSTRAINT exam_stats_user_exam_unique UNIQUE (user_id, exam_id),
            CONSTRAINT exam_stats_total_tests_check CHECK (total_tests >= 0),
            CONSTRAINT exam_stats_best_score_check CHECK (best_score >= 0),
            CONSTRAINT exam_stats_average_score_check CHECK (average_score >= 0),
            CONSTRAINT exam_stats_rank_check CHECK (rank IS NULL OR rank > 0)
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_exam_stats_user_id ON public.exam_stats(user_id);
        CREATE INDEX idx_exam_stats_exam_id ON public.exam_stats(exam_id);
        CREATE INDEX idx_exam_stats_user_exam ON public.exam_stats(user_id, exam_id);
        CREATE INDEX idx_exam_stats_best_score ON public.exam_stats(exam_id, best_score DESC);
        CREATE INDEX idx_exam_stats_rank ON public.exam_stats(exam_id, rank ASC) WHERE rank IS NOT NULL;
        
        RAISE NOTICE 'Created exam_stats table successfully';
    ELSE
        RAISE NOTICE 'exam_stats table already exists';
    END IF;
END $$;

-- 2. GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to the table
GRANT ALL ON TABLE public.exam_stats TO anon;
GRANT ALL ON TABLE public.exam_stats TO authenticated;
GRANT ALL ON TABLE public.exam_stats TO service_role;

-- Grant permissions on sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on exam_stats table
ALTER TABLE public.exam_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own exam stats" ON public.exam_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam stats" ON public.exam_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam stats" ON public.exam_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam stats" ON public.exam_stats
    FOR DELETE USING (auth.uid() = user_id);

-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exam_stats table
DROP TRIGGER IF EXISTS update_exam_stats_updated_at ON public.exam_stats;
CREATE TRIGGER update_exam_stats_updated_at
    BEFORE UPDATE ON public.exam_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. FIX FUNCTIONS THAT REFERENCE EXAM_STATS
-- =====================================================

-- Update create_all_default_exam_stats function to handle missing columns
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

-- Update create_default_exam_stats function
CREATE OR REPLACE FUNCTION public.create_default_exam_stats(p_user_id uuid, p_exam_id character varying)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

-- Update initialize_user_exam_stats function
CREATE OR REPLACE FUNCTION public.initialize_user_exam_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

-- 6. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to make the table visible to PostgREST
NOTIFY pgrst, 'reload schema';

-- 7. VERIFY THE FIX
-- =====================================================

-- Test that the table exists and is accessible
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'exam_stats' AND table_schema = 'public'
    ) INTO table_exists;
    
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'exam_stats' AND table_schema = 'public';
    
    RAISE NOTICE 'exam_stats table exists: %', table_exists;
    RAISE NOTICE 'exam_stats column count: %', column_count;
    
    IF table_exists AND column_count > 0 THEN
        RAISE NOTICE 'SUCCESS: exam_stats table is properly created and accessible';
    ELSE
        RAISE NOTICE 'ERROR: exam_stats table creation failed';
    END IF;
END $$;

-- 8. CREATE SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Uncomment the following section if you want to create sample data for testing
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get a test user ID (replace with actual user ID for testing)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Create sample exam stats for testing
        INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date)
        VALUES 
            (test_user_id, 'ssc-cgl', 5, 85, 78.5, 1, NOW() - INTERVAL '1 day'),
            (test_user_id, 'ssc-mts', 3, 92, 88.0, 2, NOW() - INTERVAL '2 days')
        ON CONFLICT (user_id, exam_id) DO NOTHING;
        
        RAISE NOTICE 'Sample data created for user: %', test_user_id;
    END IF;
END $$;
*/

-- =====================================================
-- COMPREHENSIVE FIX COMPLETED
-- =====================================================

-- Summary of what this script does:
-- 1. ✅ Creates the missing exam_stats table with all required columns
-- 2. ✅ Sets up proper indexes for performance
-- 3. ✅ Grants all necessary permissions
-- 4. ✅ Enables Row Level Security with appropriate policies
-- 5. ✅ Creates triggers for updated_at timestamp
-- 6. ✅ Updates all functions that reference exam_stats
-- 7. ✅ Refreshes the schema cache for PostgREST
-- 8. ✅ Verifies the fix was successful

-- This should resolve all exam_stats related issues!
