-- ==============================================
-- FIX FOR DUPLICATE KEY ERROR IN submitindividualtestscore
-- ==============================================

-- Drop and recreate the function to ensure it handles duplicates properly
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.submitindividualtestscore(
    p_user_id UUID,
    p_exam_id TEXT,
    p_test_type TEXT,
    p_test_id TEXT,
    p_score INTEGER
)
RETURNS VOID AS $$
DECLARE
    user_score INTEGER;
    user_rank INTEGER;
    total_participants_count INTEGER;
BEGIN
    -- Use UPSERT to handle duplicates gracefully
    INSERT INTO public.individual_test_scores (user_id, exam_id, test_type, test_id, score)
    VALUES (p_user_id, p_exam_id, p_test_type, p_test_id, p_score)
    ON CONFLICT (user_id, exam_id, test_type, test_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        updated_at = NOW();
    
    -- Get user's score for this specific test
    SELECT its.score INTO user_score
    FROM public.individual_test_scores its
    WHERE its.user_id = p_user_id
        AND its.exam_id = p_exam_id
        AND its.test_type = p_test_type
        AND its.test_id = p_test_id;
    
    -- If no score found, exit
    IF user_score IS NULL THEN
        RETURN;
    END IF;
    
    -- Count total participants for this test (renamed variable to avoid conflict)
    SELECT COUNT(*) INTO total_participants_count
    FROM public.individual_test_scores its
    WHERE its.exam_id = p_exam_id
        AND its.test_type = p_test_type
        AND its.test_id = p_test_id;
    
    -- Calculate rank (how many people scored higher + 1)
    SELECT COUNT(*) + 1 INTO user_rank
    FROM public.individual_test_scores its
    WHERE its.exam_id = p_exam_id
        AND its.test_type = p_test_type
        AND its.test_id = p_test_id
        AND its.score > user_score;
    
    -- Update the rank and total participants for this user's record
    UPDATE public.individual_test_scores
    SET 
        rank = user_rank,
        total_participants = total_participants_count,
        updated_at = NOW()
    WHERE user_id = p_user_id
        AND exam_id = p_exam_id
        AND test_type = p_test_type
        AND test_id = p_test_id;
    
    -- Log the operation
    RAISE NOTICE 'Updated individual test score: user=%, exam=%, test_type=%, test_id=%, score=%, rank=%, total_participants=%', 
        p_user_id, p_exam_id, p_test_type, p_test_id, p_score, user_rank, total_participants_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- ALSO FIX THE update_exam_stats_properly FUNCTION
-- ==============================================

DROP FUNCTION IF EXISTS public.update_exam_stats_properly(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
    user_uuid UUID,
    exam_name TEXT,
    new_score INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_stats RECORD;
    new_total_tests INTEGER;
    new_best_score INTEGER;
    new_average_score NUMERIC;
BEGIN
    -- Get current stats
    SELECT * INTO current_stats
    FROM public.exam_stats
    WHERE user_id = user_uuid AND exam_id = exam_name;
    
    -- If no stats exist, create default ones
    IF current_stats IS NULL THEN
        INSERT INTO public.exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date)
        VALUES (user_uuid, exam_name, 1, new_score, new_score, NOW())
        ON CONFLICT (user_id, exam_id) DO NOTHING;
        
        RAISE NOTICE 'Created new exam stats: user=%, exam=%, score=%', user_uuid, exam_name, new_score;
        RETURN;
    END IF;
    
    -- Calculate new values
    new_total_tests := current_stats.total_tests + 1;
    new_best_score := GREATEST(current_stats.best_score, new_score);
    
    -- Calculate new average (only for Mock and PYQ tests)
    SELECT 
        COUNT(*) as test_count,
        AVG(score) as avg_score
    INTO 
        new_total_tests,
        new_average_score
    FROM public.test_completions
    WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type IN ('mock', 'pyq');
    
    -- Update the stats
    UPDATE public.exam_stats
    SET 
        total_tests = new_total_tests,
        best_score = new_best_score,
        average_score = COALESCE(new_average_score, 0),
        last_test_date = NOW()
    WHERE user_id = user_uuid AND exam_id = exam_name;
    
    RAISE NOTICE 'Updated exam stats: user=%, exam=%, total_tests=%, best_score=%, avg_score=%', 
        user_uuid, exam_name, new_total_tests, new_best_score, new_average_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- VERIFY THE UNIQUE CONSTRAINT EXISTS
-- ==============================================

-- Ensure the unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'individual_test_scores_unique'
    ) THEN
        ALTER TABLE public.individual_test_scores
        ADD CONSTRAINT individual_test_scores_unique 
        UNIQUE (user_id, exam_id, test_type, test_id);
        
        RAISE NOTICE 'Added individual_test_scores_unique constraint';
    ELSE
        RAISE NOTICE 'individual_test_scores_unique constraint already exists';
    END IF;
END
$$;

-- ==============================================
-- VERIFY THE EXAM_STATS UNIQUE CONSTRAINT EXISTS
-- ==============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'exam_stats_user_exam_unique'
    ) THEN
        ALTER TABLE public.exam_stats
        ADD CONSTRAINT exam_stats_user_exam_unique 
        UNIQUE (user_id, exam_id);
        
        RAISE NOTICE 'Added exam_stats_user_exam_unique constraint';
    ELSE
        RAISE NOTICE 'exam_stats_user_exam_unique constraint already exists';
    END IF;
END
$$;

-- All duplicate key fixes applied successfully!
