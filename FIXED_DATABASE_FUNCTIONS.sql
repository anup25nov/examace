-- Fixed Database Functions for ExamAce Platform
-- Run this to fix the ambiguous column reference errors

-- ==============================================
-- 1. FIX UPDATE_USER_STREAK FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    total_tests INTEGER := 0;
    last_activity_date_val DATE;
BEGIN
    -- Get current streak data
    SELECT current_streak, longest_streak, total_tests_taken, last_activity_date
    INTO current_streak_count, longest_streak_count, total_tests, last_activity_date_val
    FROM public.user_streaks
    WHERE user_id = user_uuid;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_tests_taken, last_activity_date)
        VALUES (user_uuid, 1, 1, 1, today_date);
        RETURN;
    END IF;

    -- Check if user already has activity today
    IF last_activity_date_val = today_date THEN
        -- Already counted today, just update total tests
        UPDATE public.user_streaks
        SET total_tests_taken = total_tests_taken + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        RETURN;
    END IF;

    -- Check if yesterday had activity (streak continues)
    IF last_activity_date_val = yesterday_date THEN
        current_streak_count := current_streak_count + 1;
    ELSE
        -- Streak broken, reset to 1
        current_streak_count := 1;
    END IF;

    -- Update longest streak if current is higher
    IF current_streak_count > longest_streak_count THEN
        longest_streak_count := current_streak_count;
    END IF;

    -- Update the streak record
    UPDATE public.user_streaks
    SET current_streak = current_streak_count,
        longest_streak = longest_streak_count,
        total_tests_taken = total_tests_taken + 1,
        last_activity_date = today_date,
        updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. FIX CALCULATE_TEST_RANK FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.calculate_test_rank(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
    total_participants_count INTEGER;
BEGIN
    -- Calculate rank based on score
    WITH ranked_scores AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) as rank,
            COUNT(*) OVER () as total_count
        FROM public.individual_test_scores
        WHERE exam_id = exam_name
            AND test_type = test_type_name
            AND test_id = test_name
    )
    SELECT rank, total_count
    INTO user_rank, total_participants_count
    FROM ranked_scores
    WHERE user_id = user_uuid;

    -- Update the individual test score record with rank
    UPDATE public.individual_test_scores
    SET rank = user_rank,
        total_participants = total_participants_count,
        updated_at = NOW()
    WHERE user_id = user_uuid
        AND exam_id = exam_name
        AND test_type = test_type_name
        AND test_id = test_name;

    RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. FIX GET_USER_TEST_SCORE FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_user_test_score(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT
)
RETURNS TABLE(score INTEGER, rank INTEGER, total_participants INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        its.score,
        its.rank,
        its.total_participants
    FROM public.individual_test_scores its
    WHERE its.user_id = user_uuid
        AND its.exam_id = exam_name
        AND its.test_type = test_type_name
        AND its.test_id = test_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. ADD DAILY VISIT TRACKING FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_daily_visit(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    total_tests INTEGER := 0;
    last_activity_date_val DATE;
BEGIN
    -- Get current streak data
    SELECT current_streak, longest_streak, total_tests_taken, last_activity_date
    INTO current_streak_count, longest_streak_count, total_tests, last_activity_date_val
    FROM public.user_streaks
    WHERE user_id = user_uuid;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_tests_taken, last_activity_date)
        VALUES (user_uuid, 1, 1, 0, today_date);
        RETURN;
    END IF;

    -- Check if user already visited today
    IF last_activity_date_val = today_date THEN
        -- Already counted today, no need to update
        RETURN;
    END IF;

    -- Check if yesterday had activity (streak continues)
    IF last_activity_date_val = CURRENT_DATE - INTERVAL '1 day' THEN
        current_streak_count := current_streak_count + 1;
    ELSE
        -- Streak broken, reset to 1
        current_streak_count := 1;
    END IF;

    -- Update longest streak if current is higher
    IF current_streak_count > longest_streak_count THEN
        longest_streak_count := current_streak_count;
    END IF;

    -- Update the streak record
    UPDATE public.user_streaks
    SET current_streak = current_streak_count,
        longest_streak = longest_streak_count,
        last_activity_date = today_date,
        updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. FIX EXAM_STATS QUERY ISSUE
-- ==============================================
-- The 406 error is because the query expects a single object but gets 0 rows
-- This is normal behavior when no exam stats exist yet
-- We need to handle this in the application code

-- ==============================================
-- 6. ADD HELPER FUNCTION TO GET OR CREATE EXAM STATS
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_or_create_exam_stats(
    user_uuid UUID,
    exam_name TEXT
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    exam_id TEXT,
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
-- 7. ADD FUNCTION TO UPDATE EXAM STATS SAFELY
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_exam_stats_safe(
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
BEGIN
    -- Get existing stats
    SELECT * INTO existing_stats
    FROM public.exam_stats
    WHERE user_id = user_uuid AND exam_id = exam_name;
    
    -- Calculate new stats
    IF existing_stats IS NULL THEN
        -- First test for this exam
        new_total_tests := 1;
        new_best_score := new_score;
        new_average_score := new_score;
    ELSE
        -- Update existing stats
        new_total_tests := existing_stats.total_tests + 1;
        new_best_score := GREATEST(existing_stats.best_score, new_score);
        new_average_score := ROUND(
            ((existing_stats.average_score * existing_stats.total_tests) + new_score) / new_total_tests
        );
    END IF;
    
    -- Insert or update exam stats
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
-- 8. ADD UNIQUE CONSTRAINT TO EXAM_STATS
-- ==============================================
-- Add unique constraint to prevent duplicate exam stats
ALTER TABLE public.exam_stats 
ADD CONSTRAINT IF NOT EXISTS exam_stats_user_exam_unique 
UNIQUE (user_id, exam_id);

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Fixed database functions applied successfully!';
    RAISE NOTICE 'Fixed ambiguous column reference errors';
    RAISE NOTICE 'Added daily visit tracking function';
    RAISE NOTICE 'Added safe exam stats functions';
    RAISE NOTICE 'Ready to use!';
END $$;
