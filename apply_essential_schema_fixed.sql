-- Apply Essential Schema Changes - FIXED VERSION
-- Run this directly in Supabase SQL Editor

-- Add missing columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pin TEXT;

-- Add missing columns to test_attempts
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'in_progress';
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to test_completions
ALTER TABLE test_completions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE test_completions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to membership_plans
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to membership_transactions
ALTER TABLE membership_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE membership_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE membership_transactions ADD COLUMN IF NOT EXISTS gateway_response JSONB;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id_test_id_type ON test_attempts(user_id, test_id, test_type);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id_status ON test_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id_exam_id ON test_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_user_id_exam_id_test_type_test_id ON test_completions(user_id, exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_user_id_exam_id ON test_completions(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_stats_user_id_exam_id ON exam_stats(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_user_id_exam_id_test_type_test_id ON individual_test_scores(user_id, exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_user_id ON membership_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_transaction_id ON membership_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Grant permissions on security audit log
GRANT INSERT ON security_audit_log TO authenticated;
GRANT SELECT ON security_audit_log TO authenticated;

-- Drop existing functions with all possible signatures
DROP FUNCTION IF EXISTS get_user_membership_status(UUID);
DROP FUNCTION IF EXISTS get_user_membership_status(uuid);
DROP FUNCTION IF EXISTS update_user_streak(UUID);
DROP FUNCTION IF EXISTS update_user_streak(uuid);
DROP FUNCTION IF EXISTS upsert_test_completion_simple(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB);
DROP FUNCTION IF EXISTS upsert_test_completion_simple(uuid, text, text, text, text, integer, integer, integer, integer, jsonb);
DROP FUNCTION IF EXISTS update_exam_stats_properly(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS update_exam_stats_properly(uuid, text, integer);

-- Create essential functions
CREATE OR REPLACE FUNCTION get_user_membership_status(user_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    membership_plan TEXT,
    membership_status TEXT,
    membership_expiry TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as user_id,
        up.membership_plan,
        up.membership_status,
        up.membership_expiry,
        CASE 
            WHEN up.membership_expiry IS NULL THEN FALSE
            WHEN up.membership_expiry > NOW() THEN TRUE
            ELSE FALSE
        END as is_active
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    current_streak INTEGER;
    longest_streak INTEGER;
    last_activity_date DATE;
    total_tests INTEGER;
BEGIN
    -- Get current streak data
    SELECT 
        COALESCE(us.current_streak, 0),
        COALESCE(us.longest_streak, 0),
        COALESCE(us.last_activity_date, CURRENT_DATE - INTERVAL '1 day'),
        COALESCE(us.total_tests_taken, 0)
    INTO current_streak, longest_streak, last_activity_date, total_tests
    FROM user_streaks us
    WHERE us.user_id = user_uuid;

    -- Check if user took a test today
    IF EXISTS (
        SELECT 1 FROM test_completions tc
        WHERE tc.user_id = user_uuid 
        AND DATE(tc.completed_at) = CURRENT_DATE
    ) THEN
        -- If last activity was yesterday, increment streak
        IF last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
            current_streak := current_streak + 1;
        -- If last activity was today, keep current streak
        ELSIF last_activity_date = CURRENT_DATE THEN
            current_streak := current_streak;
        -- If gap more than 1 day, reset streak
        ELSE
            current_streak := 1;
        END IF;
        
        -- Update longest streak if needed
        IF current_streak > longest_streak THEN
            longest_streak := current_streak;
        END IF;
        
        -- Update total tests
        total_tests := total_tests + 1;
    END IF;

    -- Upsert streak data
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken, created_at, updated_at)
    VALUES (user_uuid, current_streak, longest_streak, CURRENT_DATE, total_tests, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        last_activity_date = EXCLUDED.last_activity_date,
        total_tests_taken = EXCLUDED.total_tests_taken,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert test completion
CREATE OR REPLACE FUNCTION upsert_test_completion_simple(
    p_user_id UUID,
    p_exam_id TEXT,
    p_test_type TEXT,
    p_test_id TEXT,
    p_topic_id TEXT DEFAULT NULL,
    p_score INTEGER DEFAULT 0,
    p_total_questions INTEGER DEFAULT 0,
    p_correct_answers INTEGER DEFAULT 0,
    p_time_taken INTEGER DEFAULT 0,
    p_answers JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO test_completions (
        user_id, exam_id, test_type, test_id, topic_id, score, 
        total_questions, correct_answers, time_taken, answers, 
        completed_at, created_at, updated_at
    )
    VALUES (
        p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id, p_score,
        p_total_questions, p_correct_answers, p_time_taken, p_answers,
        NOW(), NOW(), NOW()
    )
    ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        total_questions = EXCLUDED.total_questions,
        correct_answers = EXCLUDED.correct_answers,
        time_taken = EXCLUDED.time_taken,
        answers = EXCLUDED.answers,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update exam stats
CREATE OR REPLACE FUNCTION update_exam_stats_properly(
    user_uuid UUID,
    exam_name TEXT,
    new_score INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    total_tests INTEGER;
    best_score INTEGER;
    average_score DECIMAL;
    last_test_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate stats from test_completions
    SELECT 
        COUNT(*)::INTEGER,
        COALESCE(MAX(score), 0)::INTEGER,
        COALESCE(AVG(score), 0)::DECIMAL,
        MAX(completed_at)
    INTO total_tests, best_score, average_score, last_test_date
    FROM test_completions
    WHERE user_id = user_uuid AND exam_id = exam_name;

    -- Upsert exam stats
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, last_test_date, created_at, updated_at)
    VALUES (user_uuid, exam_name, total_tests, best_score, average_score, last_test_date, NOW(), NOW())
    ON CONFLICT (user_id, exam_id)
    DO UPDATE SET
        total_tests = EXCLUDED.total_tests,
        best_score = EXCLUDED.best_score,
        average_score = EXCLUDED.average_score,
        last_test_date = EXCLUDED.last_test_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_membership_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_test_completion_simple(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_exam_stats_properly(UUID, TEXT, INTEGER) TO authenticated;
