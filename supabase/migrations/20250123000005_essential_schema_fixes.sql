-- Essential Schema Fixes
-- This migration applies only the essential schema fixes without test data

-- Add missing columns to user_profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'name') THEN
        ALTER TABLE user_profiles ADD COLUMN name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE user_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'upi_id') THEN
        ALTER TABLE user_profiles ADD COLUMN upi_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_earnings') THEN
        ALTER TABLE user_profiles ADD COLUMN referral_earnings DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_referrals') THEN
        ALTER TABLE user_profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'pin') THEN
        ALTER TABLE user_profiles ADD COLUMN pin TEXT;
    END IF;
END $$;

-- Add missing columns to test_attempts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'status') THEN
        ALTER TABLE test_attempts ADD COLUMN status VARCHAR(50) DEFAULT 'in_progress';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'created_at') THEN
        ALTER TABLE test_attempts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'updated_at') THEN
        ALTER TABLE test_attempts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to test_completions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_completions' AND column_name = 'created_at') THEN
        ALTER TABLE test_completions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_completions' AND column_name = 'updated_at') THEN
        ALTER TABLE test_completions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id_test_id_type ON test_attempts(user_id, test_id, test_type);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id_status ON test_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_completions_user_id_exam_id_test_type_test_id ON test_completions(user_id, exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_exam_stats_user_id_exam_id ON exam_stats(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_user_id_exam_id_test_type_test_id ON individual_test_scores(user_id, exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_user_id ON membership_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer_id ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_daily_visits_user_id_visit_date ON daily_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_order_id ON payment_verifications(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_user_id ON payment_verifications(user_id);
