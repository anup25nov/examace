-- Fix retest counting issue
-- This script prevents retests from increasing the test count

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(UUID, TEXT, INTEGER);

-- Create improved function that only counts unique test completions
CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
    user_uuid UUID,
    exam_name TEXT,
    new_score INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_stats RECORD;
    unique_test_count INTEGER;
    new_best_score INTEGER;
    new_average_score NUMERIC;
BEGIN
    -- Count unique Mock + PYQ test completions for this user and exam
    SELECT COUNT(DISTINCT CONCAT(test_type, '-', test_id)) INTO unique_test_count
    FROM test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    -- Get existing stats
    SELECT * INTO existing_stats
    FROM exam_stats
    WHERE user_id = user_uuid AND exam_id = exam_name;
    
    -- Calculate new best score
    new_best_score := GREATEST(COALESCE(existing_stats.best_score, 0), new_score);
    
    -- Calculate new average score based on all Mock + PYQ completions
    SELECT COALESCE(AVG(score), 0) INTO new_average_score
    FROM test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    -- Insert or update exam stats
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date)
    VALUES (user_uuid, exam_name, unique_test_count, new_best_score, ROUND(new_average_score), NOW())
    ON CONFLICT (user_id, exam_id) 
    DO UPDATE SET
        total_tests = unique_test_count,
        best_score = new_best_score,
        average_score = ROUND(new_average_score),
        last_test_date = NOW(),
        updated_at = NOW();
END;
$$;

-- Create function to get last 10 test scores for average calculation
CREATE OR REPLACE FUNCTION public.get_last_10_test_scores(
    user_uuid UUID,
    exam_name TEXT
)
RETURNS TABLE(score INTEGER, completed_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT tc.score, tc.completed_at
    FROM test_completions tc
    WHERE tc.user_id = user_uuid 
        AND tc.exam_id = exam_name 
        AND tc.test_type IN ('mock', 'pyq')
    ORDER BY tc.completed_at DESC
    LIMIT 10;
END;
$$;

-- Create function to get best and average scores (last 10 tests) - returns actual marks, not percentages
CREATE OR REPLACE FUNCTION public.get_user_performance_stats(
    user_uuid UUID,
    exam_name TEXT
)
RETURNS TABLE(
    best_score INTEGER,
    average_score_last_10 NUMERIC,
    total_tests INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    best_score_val INTEGER;
    avg_score_val NUMERIC;
    total_tests_val INTEGER;
    total_marks INTEGER;
    obtained_marks INTEGER;
BEGIN
    -- Calculate best score based on actual marks obtained
    -- Assuming each test has 100 questions with 2 marks each = 200 total marks
    SELECT COALESCE(MAX(
        CASE 
            WHEN total_questions > 0 THEN 
                ROUND((score::NUMERIC / 100) * (total_questions * 2))
            ELSE 0 
        END
    ), 0) INTO best_score_val
    FROM test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    -- Get average of last 10 tests (actual marks)
    SELECT COALESCE(AVG(
        CASE 
            WHEN total_questions > 0 THEN 
                ROUND((score::NUMERIC / 100) * (total_questions * 2))
            ELSE 0 
        END
    ), 0) INTO avg_score_val
    FROM (
        SELECT score, total_questions
        FROM test_completions
        WHERE user_id = user_uuid 
            AND exam_id = exam_name 
            AND test_type IN ('mock', 'pyq')
        ORDER BY completed_at DESC
        LIMIT 10
    ) last_10_tests;
    
    -- Get total unique test count
    SELECT COUNT(DISTINCT CONCAT(test_type, '-', test_id)) INTO total_tests_val
    FROM test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    RETURN QUERY SELECT best_score_val, ROUND(avg_score_val, 2), total_tests_val;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_performance_stats(UUID, TEXT) TO authenticated;
