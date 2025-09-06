-- Complete Database Schema for ExamAce Platform
-- Run this entire script in your Supabase SQL Editor

-- ==============================================
-- 1. USER PROFILES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    pin VARCHAR(6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_pin ON public.user_profiles(pin);

-- Add comments
COMMENT ON TABLE public.user_profiles IS 'User profiles for authentication and basic info';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address for authentication';
COMMENT ON COLUMN public.user_profiles.pin IS '6-digit PIN for quick login (optional)';

-- ==============================================
-- 2. EXAM STATS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.exam_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    total_tests INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    average_score INTEGER DEFAULT 0,
    rank INTEGER,
    last_test_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_exam_stats_user_id ON public.exam_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_stats_exam_id ON public.exam_stats(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_stats_rank ON public.exam_stats(rank);

-- Add comments
COMMENT ON TABLE public.exam_stats IS 'User statistics for each exam (Mock + PYQ only)';
COMMENT ON COLUMN public.exam_stats.exam_id IS 'Exam identifier (e.g., ssc-cgl, railway, etc.)';
COMMENT ON COLUMN public.exam_stats.total_tests IS 'Total number of Mock + PYQ tests taken';
COMMENT ON COLUMN public.exam_stats.best_score IS 'Best score achieved in Mock + PYQ tests';
COMMENT ON COLUMN public.exam_stats.average_score IS 'Average score across all Mock + PYQ tests';

-- ==============================================
-- 3. TEST ATTEMPTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam_id ON public.test_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON public.test_attempts(completed_at);

-- Add comments
COMMENT ON TABLE public.test_attempts IS 'Individual test attempts for all test types';
COMMENT ON COLUMN public.test_attempts.answers IS 'JSON object containing user answers';

-- ==============================================
-- 4. TEST COMPLETIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.test_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    test_type TEXT NOT NULL, -- 'mock', 'pyq', 'practice'
    test_id TEXT NOT NULL,
    topic_id TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_test_completions_user_id ON public.test_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_exam_id ON public.test_completions(exam_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_test_type ON public.test_completions(test_type);
CREATE INDEX IF NOT EXISTS idx_test_completions_test_id ON public.test_completions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_completed_at ON public.test_completions(completed_at);

-- Add unique constraint to prevent duplicate completions
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_completions_unique 
ON public.test_completions(user_id, exam_id, test_type, test_id, topic_id);

-- Add comments
COMMENT ON TABLE public.test_completions IS 'Test completion tracking for UI indicators';
COMMENT ON COLUMN public.test_completions.test_type IS 'Type of test: mock, pyq, or practice';
COMMENT ON COLUMN public.test_completions.test_id IS 'Specific test identifier';
COMMENT ON COLUMN public.test_completions.topic_id IS 'Topic identifier (for practice tests)';

-- ==============================================
-- 5. USER STREAKS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_tests_taken INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);

-- Add comments
COMMENT ON TABLE public.user_streaks IS 'User daily streak tracking';
COMMENT ON COLUMN public.user_streaks.current_streak IS 'Current consecutive days with test activity';
COMMENT ON COLUMN public.user_streaks.longest_streak IS 'Longest streak achieved';

-- ==============================================
-- 6. INDIVIDUAL TEST SCORES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.individual_test_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    test_type TEXT NOT NULL,
    test_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER,
    total_participants INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_user_id ON public.individual_test_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_exam_id ON public.individual_test_scores(exam_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_test_type ON public.individual_test_scores(test_type);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_test_id ON public.individual_test_scores(test_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_rank ON public.individual_test_scores(rank);

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_individual_test_scores_unique 
ON public.individual_test_scores(user_id, exam_id, test_type, test_id);

-- Add comments
COMMENT ON TABLE public.individual_test_scores IS 'Individual test scores and rankings';
COMMENT ON COLUMN public.individual_test_scores.test_type IS 'Type of test: mock, pyq, or practice';
COMMENT ON COLUMN public.individual_test_scores.test_id IS 'Specific test identifier';
COMMENT ON COLUMN public.individual_test_scores.rank IS 'User rank in this specific test';

-- ==============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_test_scores ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Exam stats policies
CREATE POLICY "Users can view own exam stats" ON public.exam_stats
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own exam stats" ON public.exam_stats
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own exam stats" ON public.exam_stats
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Test attempts policies
CREATE POLICY "Users can view own test attempts" ON public.test_attempts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own test attempts" ON public.test_attempts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Test completions policies
CREATE POLICY "Users can view own test completions" ON public.test_completions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own test completions" ON public.test_completions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own test completions" ON public.test_completions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- User streaks policies
CREATE POLICY "Users can view own streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Individual test scores policies
CREATE POLICY "Users can view own test scores" ON public.individual_test_scores
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own test scores" ON public.individual_test_scores
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own test scores" ON public.individual_test_scores
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- ==============================================
-- 8. DATABASE FUNCTIONS
-- ==============================================

-- Function to calculate exam ranks
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

-- Function to update user streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    current_streak_count INTEGER := 0;
    longest_streak_count INTEGER := 0;
    total_tests INTEGER := 0;
BEGIN
    -- Get current streak data
    SELECT current_streak, longest_streak, total_tests_taken
    INTO current_streak_count, longest_streak_count, total_tests
    FROM public.user_streaks
    WHERE user_id = user_uuid;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, total_tests_taken, last_activity_date)
        VALUES (user_uuid, 1, 1, 1, today_date);
        RETURN;
    END IF;

    -- Check if user already has activity today
    IF last_activity_date = today_date THEN
        -- Already counted today, just update total tests
        UPDATE public.user_streaks
        SET total_tests_taken = total_tests_taken + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        RETURN;
    END IF;

    -- Check if yesterday had activity (streak continues)
    IF last_activity_date = yesterday_date THEN
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

-- Function to check if test is completed
CREATE OR REPLACE FUNCTION public.is_test_completed(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT,
    topic_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    completion_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO completion_count
    FROM public.test_completions
    WHERE user_id = user_uuid
        AND exam_id = exam_name
        AND test_type = test_type_name
        AND test_id = test_name
        AND (topic_id = topic_name OR (topic_id IS NULL AND topic_name IS NULL));

    RETURN completion_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate test rank
CREATE OR REPLACE FUNCTION public.calculate_test_rank(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
    total_participants INTEGER;
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
    INTO user_rank, total_participants
    FROM ranked_scores
    WHERE user_id = user_uuid;

    -- Update the individual test score record with rank
    UPDATE public.individual_test_scores
    SET rank = user_rank,
        total_participants = total_participants,
        updated_at = NOW()
    WHERE user_id = user_uuid
        AND exam_id = exam_name
        AND test_type = test_type_name
        AND test_id = test_name;

    RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user test score
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

-- Function to update exam stats (Mock + PYQ only)
CREATE OR REPLACE FUNCTION public.update_exam_stats_mock_pyq_only(exam_name TEXT)
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    total_tests INTEGER;
    best_score INTEGER;
    average_score INTEGER;
BEGIN
    -- Loop through all users who have test completions for this exam
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM public.test_completions 
        WHERE exam_id = exam_name 
            AND test_type IN ('mock', 'pyq')
    LOOP
        -- Calculate stats for this user
        SELECT 
            COUNT(*) as total,
            MAX(score) as best,
            ROUND(AVG(score)) as avg
        INTO total_tests, best_score, average_score
        FROM public.test_completions
        WHERE user_id = user_record.user_id
            AND exam_id = exam_name
            AND test_type IN ('mock', 'pyq');

        -- Update or insert exam stats
        INSERT INTO public.exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date)
        VALUES (user_record.user_id, exam_name, total_tests, best_score, average_score, NOW())
        ON CONFLICT (user_id, exam_id)
        DO UPDATE SET
            total_tests = EXCLUDED.total_tests,
            best_score = EXCLUDED.best_score,
            average_score = EXCLUDED.average_score,
            last_test_date = EXCLUDED.last_test_date,
            updated_at = NOW();
    END LOOP;

    -- Recalculate ranks
    PERFORM public.calculate_exam_ranks(exam_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 9. TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_stats_updated_at
    BEFORE UPDATE ON public.exam_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_individual_test_scores_updated_at
    BEFORE UPDATE ON public.individual_test_scores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- ==============================================

-- Insert sample exam configurations
-- This is optional and can be removed if you don't want sample data
/*
INSERT INTO public.user_profiles (id, email, pin) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'test@examace.com', '123456')
ON CONFLICT (id) DO NOTHING;
*/

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: user_profiles, exam_stats, test_attempts, test_completions, user_streaks, individual_test_scores';
    RAISE NOTICE 'Functions created: calculate_exam_ranks, update_user_streak, is_test_completed, calculate_test_rank, get_user_test_score, update_exam_stats_mock_pyq_only';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Ready to use!';
END $$;
