-- Fix exam_stats duplicate key constraint violation
-- This ensures the unique constraint exists and handles conflicts properly

-- ==============================================
-- 1. ADD UNIQUE CONSTRAINT IF NOT EXISTS
-- ==============================================

-- Add unique constraint to prevent duplicate exam stats
DO $$
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exam_stats_user_exam_unique'
    ) THEN
        ALTER TABLE public.exam_stats 
        ADD CONSTRAINT exam_stats_user_exam_unique 
        UNIQUE (user_id, exam_id);
    END IF;
END $$;

-- ==============================================
-- 2. CREATE UPSERT FUNCTION FOR EXAM STATS
-- ==============================================

-- Create or replace function to safely upsert exam stats
CREATE OR REPLACE FUNCTION public.upsert_exam_stats(
    p_user_id UUID,
    p_exam_id TEXT,
    p_total_tests INTEGER DEFAULT 0,
    p_best_score INTEGER DEFAULT 0,
    p_average_score INTEGER DEFAULT 0,
    p_rank INTEGER DEFAULT NULL,
    p_last_test_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.exam_stats (
        user_id, 
        exam_id, 
        total_tests, 
        best_score, 
        average_score, 
        rank, 
        last_test_date
    )
    VALUES (
        p_user_id, 
        p_exam_id, 
        p_total_tests, 
        p_best_score, 
        p_average_score, 
        p_rank, 
        p_last_test_date
    )
    ON CONFLICT (user_id, exam_id)
    DO UPDATE SET
        total_tests = EXCLUDED.total_tests,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        rank = EXCLUDED.rank,
        last_test_date = EXCLUDED.last_test_date,
        updated_at = NOW();
END;
$$;

-- ==============================================
-- 3. CREATE FUNCTION TO INITIALIZE ALL EXAM STATS
-- ==============================================

-- Create or replace function to initialize all exam stats for a user
CREATE OR REPLACE FUNCTION public.initialize_user_exam_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Initialize stats for all exam types
    PERFORM public.upsert_exam_stats(p_user_id, 'ssc-cgl', 0, 0, 0, NULL, NULL);
    PERFORM public.upsert_exam_stats(p_user_id, 'ssc-mts', 0, 0, 0, NULL, NULL);
    PERFORM public.upsert_exam_stats(p_user_id, 'railway', 0, 0, 0, NULL, NULL);
    PERFORM public.upsert_exam_stats(p_user_id, 'bank-po', 0, 0, 0, NULL, NULL);
    PERFORM public.upsert_exam_stats(p_user_id, 'airforce', 0, 0, 0, NULL, NULL);
END;
$$;

-- ==============================================
-- 4. GRANT PERMISSIONS
-- ==============================================

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.upsert_exam_stats(UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_user_exam_stats(UUID) TO authenticated;

-- ==============================================
-- 5. COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Exam stats constraint fix applied successfully!';
    RAISE NOTICE 'Unique constraint: exam_stats_user_exam_unique';
    RAISE NOTICE 'Upsert function: upsert_exam_stats';
    RAISE NOTICE 'Initialize function: initialize_user_exam_stats';
END $$;
