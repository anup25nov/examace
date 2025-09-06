-- URGENT Database Fixes for ExamAce Platform
-- Run this immediately to fix all critical issues

-- ==============================================
-- 1. CREATE MISSING FUNCTIONS
-- ==============================================

-- Function to update daily visit streak (common across all exams)
CREATE OR REPLACE FUNCTION public.update_daily_visit(user_uuid UUID)
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
        VALUES (user_uuid, 1, 1, 0, today_date);
        RETURN;
    END IF;

    -- Check if user already visited today
    IF last_activity_date_val = today_date THEN
        -- Already counted today, no need to update
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
        last_activity_date = today_date,
        updated_at = NOW()
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user streak
CREATE OR REPLACE FUNCTION public.get_or_create_user_streak(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_tests_taken INTEGER,
    last_activity_date DATE
) AS $$
BEGIN
    -- Try to get existing streak
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.current_streak,
        us.longest_streak,
        us.total_tests_taken,
        us.last_activity_date
    FROM public.user_streaks us
    WHERE us.user_id = user_uuid;
    
    -- If no streak found, create default one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_tests_taken, last_activity_date)
        VALUES (user_uuid, 0, 0, 0, NULL);
        
        -- Return the newly created streak
        RETURN QUERY
        SELECT 
            us.id,
            us.user_id,
            us.current_streak,
            us.longest_streak,
            us.total_tests_taken,
            us.last_activity_date
        FROM public.user_streaks us
        WHERE us.user_id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create exam stats
CREATE OR REPLACE FUNCTION public.get_or_create_exam_stats(user_uuid UUID, exam_name TEXT)
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

-- Function to update exam stats properly (Mock + PYQ only)
CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
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
    avg_score_calculation NUMERIC;
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

-- Function to calculate exam ranks properly
CREATE OR REPLACE FUNCTION public.calculate_exam_ranks(exam_name TEXT)
RETURNS VOID AS $$
BEGIN
    WITH ranked_stats AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY best_score DESC, average_score DESC, total_tests DESC) as new_rank
        FROM public.exam_stats
        WHERE exam_id = exam_name
    )
    UPDATE public.exam_stats
    SET rank = ranked_stats.new_rank
    FROM ranked_stats
    WHERE public.exam_stats.id = ranked_stats.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak when test is taken
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
-- 2. FIX RLS POLICIES FOR STREAKS
-- ==============================================

-- Drop and recreate streak policies to handle 406 errors
DROP POLICY IF EXISTS "Users can view own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON public.user_streaks;

CREATE POLICY "Users can view own streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ==============================================
-- 3. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'URGENT database fixes applied successfully!';
    RAISE NOTICE 'All missing functions created';
    RAISE NOTICE 'Streak logic fixed - common across all exams';
    RAISE NOTICE 'Exam stats calculation fixed - Mock + PYQ only';
    RAISE NOTICE 'RLS policies updated';
    RAISE NOTICE 'Ready to use!';
END $$;
