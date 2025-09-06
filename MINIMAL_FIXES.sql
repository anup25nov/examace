-- Minimal Fixes for Critical Issues
-- Run this to fix the three major problems

-- ==============================================
-- 1. FIX DATA TYPE MISMATCH IN get_or_create_exam_stats
-- ==============================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_or_create_exam_stats(UUID, TEXT);

-- Create the function with correct return type
CREATE FUNCTION public.get_or_create_exam_stats(user_uuid UUID, exam_name TEXT)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    exam_id VARCHAR(50),
    total_tests INTEGER,
    best_score INTEGER,
    average_score INTEGER,
    rank INTEGER,
    last_test_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Try to get existing stats
    RETURN QUERY
    SELECT 
        es.id,
        es.user_id,
        es.exam_id,
        es.total_tests,
        es.best_score,
        es.average_score,
        es.rank,
        es.last_test_date
    FROM public.exam_stats es
    WHERE es.user_id = user_uuid
        AND es.exam_id = exam_name;
    
    -- If no stats found, create default ones
    IF NOT FOUND THEN
        INSERT INTO public.exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date)
        VALUES (user_uuid, exam_name, 0, 0, 0, NULL, NULL);
        
        -- Return the newly created stats
        RETURN QUERY
        SELECT 
            es.id,
            es.user_id,
            es.exam_id,
            es.total_tests,
            es.best_score,
            es.average_score,
            es.rank,
            es.last_test_date
        FROM public.exam_stats es
        WHERE es.user_id = user_uuid
            AND es.exam_id = exam_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. FIX UNIQUE CONSTRAINT VIOLATIONS
-- ==============================================

-- Drop the problematic unique constraints
ALTER TABLE public.exam_stats DROP CONSTRAINT IF EXISTS exam_stats_user_id_exam_id_key;
ALTER TABLE public.exam_stats DROP CONSTRAINT IF EXISTS exam_stats_user_exam_unique;

-- Drop the problematic unique index
DROP INDEX IF EXISTS idx_individual_test_scores_unique;

-- ==============================================
-- 3. UPDATE FUNCTIONS TO USE UPSERT INSTEAD OF INSERT
-- ==============================================

-- Update the exam stats function to use upsert
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(UUID, TEXT, INTEGER);
CREATE FUNCTION public.update_exam_stats_properly(
    user_uuid UUID,
    exam_name TEXT,
    new_score INTEGER
)
RETURNS VOID AS $$
DECLARE
    existing_stats RECORD;
    new_total_tests INTEGER;
    new_best_score INTEGER;
    new_average_score INTEGER;
    total_mock_pyq_tests INTEGER;
BEGIN
    -- Count total Mock + PYQ tests for this user and exam
    SELECT COUNT(*) INTO total_mock_pyq_tests
    FROM public.test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    -- Get existing stats
    SELECT * INTO existing_stats
    FROM public.exam_stats
    WHERE user_id = user_uuid AND exam_id = exam_name;
    
    -- Calculate new stats based on all Mock + PYQ tests
    IF existing_stats IS NULL THEN
        -- First test for this exam
        new_total_tests := total_mock_pyq_tests;
        new_best_score := new_score;
        new_average_score := new_score;
    ELSE
        -- Update existing stats based on all Mock + PYQ tests
        new_total_tests := total_mock_pyq_tests;
        
        -- Get best score from all Mock + PYQ tests
        SELECT MAX(score) INTO new_best_score
        FROM public.test_completions
        WHERE user_id = user_uuid 
            AND exam_id = exam_name 
            AND test_type IN ('mock', 'pyq');
        
        -- Get average score from all Mock + PYQ tests
        SELECT ROUND(AVG(score)) INTO new_average_score
        FROM public.test_completions
        WHERE user_id = user_uuid 
            AND exam_id = exam_name 
            AND test_type IN ('mock', 'pyq');
    END IF;
    
    -- Use UPSERT to handle duplicates gracefully
    INSERT INTO public.exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date)
    VALUES (user_uuid, exam_name, new_total_tests, new_best_score, new_average_score, NOW())
    ON CONFLICT (user_id, exam_id)
    DO UPDATE SET
        total_tests = EXCLUDED.total_tests,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        last_test_date = EXCLUDED.last_test_date,
        updated_at = NOW();
    
    -- Recalculate ranks for this exam
    PERFORM public.calculate_exam_ranks(exam_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. ADD UNIQUE CONSTRAINTS BACK (SAFELY)
-- ==============================================

-- Add unique constraint back to exam_stats (this will work now with upsert)
ALTER TABLE public.exam_stats 
ADD CONSTRAINT exam_stats_user_exam_unique 
UNIQUE (user_id, exam_id);

-- Add unique constraint back to individual_test_scores (this will work now with upsert)
ALTER TABLE public.individual_test_scores 
ADD CONSTRAINT individual_test_scores_unique 
UNIQUE (user_id, exam_id, test_type, test_id);

-- ==============================================
-- 5. UPDATE INDIVIDUAL TEST SCORES TO USE UPSERT
-- ==============================================

-- Update the individual test score function to use upsert
DROP FUNCTION IF EXISTS public.submitIndividualTestScore(UUID, TEXT, TEXT, TEXT, INTEGER);
CREATE FUNCTION public.submitIndividualTestScore(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT,
    new_score INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Use UPSERT to handle duplicates gracefully
    INSERT INTO public.individual_test_scores (user_id, exam_id, test_type, test_id, score)
    VALUES (user_uuid, exam_name, test_type_name, test_name, new_score)
    ON CONFLICT (user_id, exam_id, test_type, test_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        updated_at = NOW();
    
    -- Calculate rank for this specific test
    PERFORM public.calculate_test_rank(user_uuid, exam_name, test_type_name, test_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Minimal fixes applied successfully!';
    RAISE NOTICE 'Fixed data type mismatch in get_or_create_exam_stats';
    RAISE NOTICE 'Fixed unique constraint violations with UPSERT';
    RAISE NOTICE 'All functions now handle duplicates gracefully';
    RAISE NOTICE 'Ready to use!';
END $$;
