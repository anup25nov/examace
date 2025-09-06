-- Urgent Final Fixes for Remaining Issues
-- Run this to fix the last two problems

-- ==============================================
-- 1. FIX AMBIGUOUS COLUMN REFERENCE IN submitindividualtestscore
-- ==============================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER);

-- Create the function with proper column qualification
CREATE FUNCTION public.submitindividualtestscore(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT,
    new_score INTEGER
)
RETURNS VOID AS $$
DECLARE
    user_score INTEGER;
    user_rank INTEGER;
    total_participants_count INTEGER;
BEGIN
    -- Use UPSERT to handle duplicates gracefully
    INSERT INTO public.individual_test_scores (user_id, exam_id, test_type, test_id, score)
    VALUES (user_uuid, exam_name, test_type_name, test_name, new_score)
    ON CONFLICT (user_id, exam_id, test_type, test_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        updated_at = NOW();
    
    -- Get user's score for this specific test
    SELECT its.score INTO user_score
    FROM public.individual_test_scores its
    WHERE its.user_id = user_uuid
        AND its.exam_id = exam_name
        AND its.test_type = test_type_name
        AND its.test_id = test_name;
    
    -- If no score found, exit
    IF user_score IS NULL THEN
        RETURN;
    END IF;
    
    -- Count total participants for this test (renamed variable to avoid conflict)
    SELECT COUNT(*) INTO total_participants_count
    FROM public.individual_test_scores its
    WHERE its.exam_id = exam_name
        AND its.test_type = test_type_name
        AND its.test_id = test_name;
    
    -- Calculate rank (how many people scored higher + 1)
    SELECT COUNT(*) + 1 INTO user_rank
    FROM public.individual_test_scores its
    WHERE its.exam_id = exam_name
        AND its.test_type = test_type_name
        AND its.test_id = test_name
        AND its.score > user_score;
    
    -- Update the individual test score with rank and total participants
    UPDATE public.individual_test_scores
    SET rank = user_rank,
        total_participants = total_participants_count,
        updated_at = NOW()
    WHERE user_id = user_uuid
        AND exam_id = exam_name
        AND test_type = test_type_name
        AND test_id = test_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. CREATE get_or_create_exam_stats FUNCTION FOR HANDLING 0 ROWS
-- ==============================================

-- Drop the existing function
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
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Urgent final fixes applied successfully!';
    RAISE NOTICE 'Fixed ambiguous column reference in submitindividualtestscore';
    RAISE NOTICE 'Fixed get_or_create_exam_stats function for 0 rows handling';
    RAISE NOTICE 'All functions now work properly';
    RAISE NOTICE 'Ready to use!';
END $$;
