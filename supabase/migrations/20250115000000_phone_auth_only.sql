-- Phone Authentication Migration
-- This migration only handles the phone auth setup without dropping tables

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS user_membership_summary CASCADE;
DROP VIEW IF EXISTS user_referral_summary CASCADE;
DROP VIEW IF EXISTS exam_stats_with_defaults CASCADE;
DROP VIEW IF EXISTS user_profile_summary CASCADE;

-- Step 2: Update trigger function for phone auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with proper error handling for phone auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user doesn't already exist in user_profiles
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 3: Recreate views that reference phone instead of email
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

-- Step 4: Create get_referral_leaderboard function
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
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

-- Step 5: Add helpful comments
COMMENT ON TABLE user_profiles IS 'User profiles with phone-based authentication';
COMMENT ON COLUMN user_profiles.phone IS 'Phone number in international format (e.g., +919876543210)';
COMMENT ON COLUMN user_profiles.referral_code IS 'Unique referral code for this user';
COMMENT ON COLUMN user_profiles.referred_by IS 'Referral code used when this user signed up';
