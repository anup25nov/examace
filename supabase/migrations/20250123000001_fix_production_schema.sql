-- Production Schema Fixes Migration
-- This migration fixes all identified schema issues for production readiness

-- ==============================================
-- 1. FIX USER_PROFILES TABLE
-- ==============================================

-- Add missing columns that are referenced in code but missing from schema
DO $$ 
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
    ALTER TABLE user_profiles ADD COLUMN email VARCHAR(255);
  END IF;
  
  -- Add name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'name') THEN
    ALTER TABLE user_profiles ADD COLUMN name VARCHAR(255);
  END IF;
  
  -- Add upi_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'upi_id') THEN
    ALTER TABLE user_profiles ADD COLUMN upi_id VARCHAR(255);
  END IF;
  
  -- Add referral_earnings column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_earnings') THEN
    ALTER TABLE user_profiles ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Add total_referrals column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_referrals') THEN
    ALTER TABLE user_profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
  END IF;
  
  -- Add phone_verified column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone_verified') THEN
    ALTER TABLE user_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
  END IF;
  
  -- Add pin column if it doesn't exist (for dev auth)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'pin') THEN
    ALTER TABLE user_profiles ADD COLUMN pin VARCHAR(10);
  END IF;
  
  -- Add is_admin column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Remove unused membership_status column (redundant with membership_plan)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'membership_status') THEN
    ALTER TABLE user_profiles DROP COLUMN membership_status;
  END IF;
END $$;

-- Add constraints for new columns
ALTER TABLE user_profiles ADD CONSTRAINT valid_upi_id CHECK (
  upi_id IS NULL OR upi_id = '' OR upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$'
);

-- ==============================================
-- 2. FIX TEST_ATTEMPTS TABLE
-- ==============================================

-- Remove unused columns
DO $$ 
BEGIN
  -- Remove created_at if it exists and is unused
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'created_at') THEN
    ALTER TABLE test_attempts DROP COLUMN created_at;
  END IF;
  
  -- Remove updated_at if it exists and is unused
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'updated_at') THEN
    ALTER TABLE test_attempts DROP COLUMN updated_at;
  END IF;
END $$;

-- Ensure status column exists and has proper default
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'status') THEN
    ALTER TABLE test_attempts ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'in_progress';
  END IF;
END $$;

-- Update status column default to 'in_progress' for new attempts
ALTER TABLE test_attempts ALTER COLUMN status SET DEFAULT 'in_progress';

-- ==============================================
-- 3. ADD PERFORMANCE INDEXES
-- ==============================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_plan ON user_profiles(membership_plan);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);

-- Test attempts indexes
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_exam ON test_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_type ON test_attempts(user_id, test_type);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_status ON test_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON test_attempts(completed_at);

-- Test completions indexes
CREATE INDEX IF NOT EXISTS idx_test_completions_user_exam ON test_completions(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_test_completions_user_type ON test_completions(user_id, test_type);
CREATE INDEX IF NOT EXISTS idx_test_completions_completed_at ON test_completions(completed_at);

-- Individual test scores indexes
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_user_exam ON individual_test_scores(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_individual_test_scores_user_type ON individual_test_scores(user_id, test_type);

-- ==============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key for referred_by if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_referred_by_fkey'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_referred_by_fkey 
    FOREIGN KEY (referred_by) REFERENCES referral_codes(code);
  END IF;
END $$;

-- ==============================================
-- 5. CLEAN UP UNUSED TABLES/FUNCTIONS
-- ==============================================

-- Drop unused functions (if any)
-- Note: Only drop if confirmed unused
-- DROP FUNCTION IF EXISTS unused_function_name();

-- ==============================================
-- 6. UPDATE ROW LEVEL SECURITY
-- ==============================================

-- Ensure RLS is enabled on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_stats ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 7. ADD DATA VALIDATION CONSTRAINTS
-- ==============================================

-- Add constraints to prevent invalid data
ALTER TABLE test_attempts ADD CONSTRAINT check_score_range CHECK (score >= 0 AND score <= 100);
ALTER TABLE test_attempts ADD CONSTRAINT check_time_taken_positive CHECK (time_taken IS NULL OR time_taken >= 0);
ALTER TABLE test_attempts ADD CONSTRAINT check_correct_answers_range CHECK (correct_answers >= 0 AND correct_answers <= total_questions);

-- Add exam_id validation
ALTER TABLE test_attempts ADD CONSTRAINT check_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

ALTER TABLE test_completions ADD CONSTRAINT check_test_completions_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

ALTER TABLE individual_test_scores ADD CONSTRAINT check_individual_test_scores_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

-- ==============================================
-- 8. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to get user's test completion status
CREATE OR REPLACE FUNCTION get_user_test_completion_status(
  p_user_id UUID,
  p_exam_id VARCHAR(50),
  p_test_type VARCHAR(20),
  p_test_id VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM test_completions 
    WHERE user_id = p_user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's membership status
CREATE OR REPLACE FUNCTION get_user_membership_status(p_user_id UUID)
RETURNS TABLE(
  membership_plan VARCHAR(50),
  membership_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.membership_plan,
    up.membership_expiry,
    CASE 
      WHEN up.membership_expiry IS NULL THEN false
      WHEN up.membership_expiry > NOW() THEN true
      ELSE false
    END as is_active
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 9. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_test_completion_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_membership_status TO authenticated;

-- ==============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE user_profiles IS 'Core user profile data including membership and referral information';
COMMENT ON TABLE test_attempts IS 'Individual test attempts tracking with status and timing';
COMMENT ON TABLE test_completions IS 'Completed tests for UI state management and progress tracking';
COMMENT ON TABLE individual_test_scores IS 'Test scores and rankings for individual tests';

COMMENT ON COLUMN user_profiles.email IS 'User email address for communication';
COMMENT ON COLUMN user_profiles.name IS 'User display name';
COMMENT ON COLUMN user_profiles.upi_id IS 'UPI ID for payments';
COMMENT ON COLUMN user_profiles.referral_earnings IS 'Total earnings from referrals';
COMMENT ON COLUMN user_profiles.total_referrals IS 'Total number of successful referrals';
COMMENT ON COLUMN user_profiles.phone_verified IS 'Phone number verification status';

COMMENT ON COLUMN test_attempts.status IS 'Test attempt status: in_progress, completed, abandoned';
COMMENT ON COLUMN test_attempts.score IS 'Test score as percentage (0-100)';
COMMENT ON COLUMN test_attempts.time_taken IS 'Time taken in seconds';
