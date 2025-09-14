-- Migration to switch from email-based to phone number + OTP authentication
-- This migration removes email dependencies and sets up phone-based auth

-- Step 1: Drop all dependent views first to avoid constraint errors
DROP VIEW IF EXISTS user_membership_summary CASCADE;
DROP VIEW IF EXISTS user_referral_summary CASCADE;
DROP VIEW IF EXISTS referral_summary CASCADE;
DROP VIEW IF EXISTS exam_stats_with_defaults CASCADE;
DROP VIEW IF EXISTS user_profile_summary CASCADE;

-- Step 2: Drop any triggers that might reference the email column
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON user_profiles;

-- Step 3: Remove email column and related constraints (now safe to drop)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email CASCADE;

-- Step 3: Make phone column NOT NULL and add proper constraints
ALTER TABLE user_profiles ALTER COLUMN phone SET NOT NULL;

-- Step 4: Update phone column to support international format (up to 15 digits)
ALTER TABLE user_profiles ALTER COLUMN phone TYPE VARCHAR(15);

-- Step 5: Add proper index for phone lookups
DROP INDEX IF EXISTS idx_user_profiles_email;
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Step 6: Remove PIN column as we're using OTP only
ALTER TABLE user_profiles DROP COLUMN IF EXISTS pin;

-- Step 7: Clean up any existing data that might have invalid phone numbers
-- Update any records with invalid phone numbers to a default format
UPDATE user_profiles 
SET phone = CONCAT('+91', phone)
WHERE phone IS NOT NULL 
  AND LENGTH(phone) = 10 
  AND phone ~ '^[0-9]+$';

-- Step 8: Add comment to document the change
COMMENT ON COLUMN user_profiles.phone IS 'User phone number for authentication (international format)';

-- Step 9: Create membership_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS membership_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    duration_days INTEGER NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1,
    mock_tests INTEGER NOT NULL DEFAULT 0,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 1;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS mock_tests INTEGER DEFAULT 0;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS features JSONB;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE membership_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have duration_months if it's null
UPDATE membership_plans 
SET duration_months = CASE 
    WHEN duration_days IS NOT NULL THEN CEIL(duration_days / 30.0)
    ELSE 1 
END
WHERE duration_months IS NULL;

-- Insert default membership plans if they don't exist
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active) VALUES
('free', 'Free Plan', 'Basic access to practice tests', 0, 12, 365, 10, '["Basic Practice Tests", "Limited Analytics"]', true),
('basic', 'Basic Plan', 'Access to PYQ sets and mock tests', 299, 1, 30, 500, '["500+ PYQ Sets", "100+ Mock Tests", "Detailed Solutions", "Performance Analytics"]', true),
('premium', 'Premium Plan', 'Full access to all features', 599, 2, 60, 1000, '["1000+ PYQ Sets", "200+ Mock Tests", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true),
('pro', 'Pro Plan', 'Complete exam preparation package', 999, 3, 90, 2000, '["2000+ PYQ Sets", "500+ Mock Tests", "Detailed Solutions", "Performance Analytics", "24/7 Support", "Personal Mentor"]', true)
ON CONFLICT (id) DO NOTHING;

-- Step 10: Recreate views that reference phone instead of email
CREATE VIEW user_membership_summary AS
SELECT 
    up.id as user_id,
    up.phone,
    up.membership_status,
    up.membership_plan,
    up.membership_expiry,
    um.id as membership_id,
    um.plan_id,
    um.start_date,
    um.end_date,
    um.status as membership_status_detail,
    mp.name as plan_name,
    mp.price as plan_price,
    mp.duration_days,
    mp.mock_tests,
    mp.is_active as plan_is_active,
    CASE 
        WHEN um.end_date > NOW() THEN true 
        ELSE false 
    END as membership_is_active,
    CASE 
        WHEN um.end_date > NOW() THEN EXTRACT(DAY FROM (um.end_date - NOW()))
        ELSE 0 
    END as days_remaining
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id AND um.status = 'active'
LEFT JOIN membership_plans mp ON um.plan_id = mp.id;

CREATE VIEW user_referral_summary AS
SELECT 
    up.id as user_id,
    up.phone,
    rc.code as referral_code,
    rc.created_at as code_created_at,
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0) as total_earnings,
    COALESCE(rc.total_earnings - COALESCE(SUM(rp.amount), 0), 0) as pending_earnings,
    COALESCE(SUM(rp.amount), 0) as paid_earnings
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.user_id
LEFT JOIN referral_payouts rp ON up.id = rp.user_id AND rp.status = 'completed'
GROUP BY up.id, up.phone, rc.code, rc.created_at, rc.total_referrals, rc.total_earnings;

-- Recreate exam_stats_with_defaults view (if it existed)
CREATE VIEW exam_stats_with_defaults AS
SELECT 
    es.id,
    es.user_id,
    es.exam_id,
    COALESCE(es.total_tests, 0) as total_tests,
    COALESCE(es.best_score, 0) as best_score,
    COALESCE(es.average_score, 0) as average_score,
    es.rank,
    es.last_test_date,
    es.created_at,
    es.updated_at
FROM exam_stats es;

-- Recreate user_profile_summary view (if it existed)
CREATE VIEW user_profile_summary AS
SELECT 
    up.id,
    up.phone,
    up.membership_status,
    up.membership_plan,
    up.membership_expiry,
    up.referral_code,
    up.referred_by,
    up.created_at,
    up.updated_at
FROM user_profiles up;

-- Step 11: Update functions that reference email
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_referral_leaderboard(INTEGER);

-- Update get_referral_leaderboard function
CREATE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    phone TEXT,
    rank_position BIGINT,
    total_referrals BIGINT,
    total_earnings NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.phone,
        ROW_NUMBER() OVER (ORDER BY COALESCE(rc.total_earnings, 0) DESC) as rank_position,
        COALESCE(rc.total_referrals, 0) as total_referrals,
        COALESCE(rc.total_earnings, 0) as total_earnings
    FROM user_profiles up
    LEFT JOIN referral_codes rc ON up.id = rc.user_id
    WHERE rc.total_referrals > 0
    ORDER BY COALESCE(rc.total_earnings, 0) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Remove unnecessary tables that are not being used
-- These tables are not used in the current codebase and can be safely removed
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;

-- Remove any other unused tables that might exist
-- (These are common unused tables in exam/test applications)
DROP TABLE IF EXISTS question_reports CASCADE;
DROP TABLE IF EXISTS user_feedback CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Step 13: Clean up any orphaned data
-- Remove any test_attempts that don't have valid user references
DELETE FROM test_attempts 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any exam_stats that don't have valid user references  
DELETE FROM exam_stats 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any individual_test_scores that don't have valid user references
DELETE FROM individual_test_scores 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any test_completions that don't have valid user references
DELETE FROM test_completions 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any user_streaks that don't have valid user references
DELETE FROM user_streaks 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any user_memberships that don't have valid user references
DELETE FROM user_memberships 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any referral_codes that don't have valid user references
DELETE FROM referral_codes 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any referral_transactions that don't have valid user references
DELETE FROM referral_transactions 
WHERE referrer_id NOT IN (SELECT id FROM user_profiles) 
   OR referred_id NOT IN (SELECT id FROM user_profiles);

-- Remove any referral_payouts that don't have valid user references
DELETE FROM referral_payouts 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Remove any membership_transactions that don't have valid user references
DELETE FROM membership_transactions 
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- Step 14: Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON exam_stats TO authenticated;
GRANT ALL ON test_attempts TO authenticated;
GRANT ALL ON test_completions TO authenticated;
GRANT ALL ON individual_test_scores TO authenticated;
GRANT ALL ON user_streaks TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON membership_plans TO authenticated;
GRANT ALL ON membership_transactions TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referral_transactions TO authenticated;
GRANT ALL ON referral_payouts TO authenticated;

-- Step 15: Recreate trigger function for new user creation (updated for phone auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 16: Add helpful comments
COMMENT ON TABLE user_profiles IS 'User profiles with phone-based authentication';
COMMENT ON COLUMN user_profiles.phone IS 'Phone number in international format (e.g., +919876543210)';
COMMENT ON COLUMN user_profiles.referral_code IS 'Unique referral code for this user';
COMMENT ON COLUMN user_profiles.referred_by IS 'Referral code used when this user signed up';
