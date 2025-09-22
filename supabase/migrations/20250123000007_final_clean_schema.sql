-- Final Clean Schema Migration
-- Only essential schema changes, no test data

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

-- Create indexes for security audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- Grant permissions on security audit log
GRANT INSERT ON security_audit_log TO authenticated;
GRANT SELECT ON security_audit_log TO authenticated;
