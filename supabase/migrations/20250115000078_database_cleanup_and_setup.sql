-- Database Cleanup and Setup Migration
-- This migration will clean up unused tables and create proper entries

-- 1. Drop unused tables that are not needed
DROP TABLE IF EXISTS question_images CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS referral_payouts CASCADE;
DROP TABLE IF EXISTS referral_commissions CASCADE;
DROP TABLE IF EXISTS referral_transactions CASCADE;

-- 2. Drop unused views
DROP VIEW IF EXISTS user_membership_summary CASCADE;
DROP VIEW IF EXISTS user_referral_summary CASCADE;
DROP VIEW IF EXISTS exam_stats_with_defaults CASCADE;
DROP VIEW IF EXISTS user_profile_summary CASCADE;

-- 3. Clean up any remaining data from all tables
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE exam_stats CASCADE;
TRUNCATE TABLE test_completions CASCADE;
TRUNCATE TABLE test_attempts CASCADE;
TRUNCATE TABLE individual_test_scores CASCADE;
TRUNCATE TABLE user_streaks CASCADE;
TRUNCATE TABLE user_memberships CASCADE;
TRUNCATE TABLE membership_transactions CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE question_reports CASCADE;
TRUNCATE TABLE withdrawal_requests CASCADE;
TRUNCATE TABLE referral_codes CASCADE;

-- 4. Reset sequences
ALTER SEQUENCE IF EXISTS user_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS exam_stats_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS test_completions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS test_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS individual_test_scores_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_streaks_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS user_memberships_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS membership_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS question_reports_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS withdrawal_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS referral_codes_id_seq RESTART WITH 1;

-- 5. Insert membership plans with proper UUIDs (using UPSERT to handle existing data)
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order, created_at, updated_at) VALUES
('pro', 'Pro Plan', 'Access to 11 mock tests for 3 months', 99.00, 199.00, 90, 3, 11, '["11 Mock Tests", "3 Months Access", "Detailed Solutions", "Performance Analytics"]', true, 2, NOW(), NOW()),
('pro_plus', 'Pro Plus Plan', 'Unlimited access to all mock tests for 12 months', 299.00, 599.00, 365, 12, 9999, '["Unlimited Mock Tests", "12 Months Access", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true, 1, NOW(), NOW()),
('free', 'Free Plan', 'Limited access to practice tests', 0.00, 0.00, 0, 0, 0, '["Limited Practice Tests", "Basic Solutions"]', true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  duration_days = EXCLUDED.duration_days,
  duration_months = EXCLUDED.duration_months,
  mock_tests = EXCLUDED.mock_tests,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- 6. Create a function to generate test data (commented out to avoid foreign key issues)
-- CREATE OR REPLACE FUNCTION create_test_users()
-- RETURNS VOID AS $$
-- DECLARE
--     user1_id UUID := gen_random_uuid();
--     user2_id UUID := gen_random_uuid();
--     referral_code1 VARCHAR(20) := 'TEST' || substr(md5(random()::text), 1, 6);
--     referral_code2 VARCHAR(20) := 'TEST' || substr(md5(random()::text), 1, 6);
-- BEGIN
--     -- Create test user 1 (Free user)
--     INSERT INTO user_profiles (id, phone, membership_status, membership_plan, membership_expiry, referral_code, referred_by, created_at, updated_at)
--     VALUES (user1_id, '+919876543210', 'free', 'free', NULL, referral_code1, NULL, NOW(), NOW());
--     
--     -- Create test user 2 (Pro user)
--     INSERT INTO user_profiles (id, phone, membership_status, membership_plan, membership_expiry, referral_code, referred_by, created_at, updated_at)
--     VALUES (user2_id, '+919876543211', 'active', 'pro', NOW() + INTERVAL '90 days', referral_code2, referral_code1, NOW(), NOW());
--     
--     -- Create user streaks
--     INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken, created_at, updated_at)
--     VALUES 
--     (user1_id, 0, 0, NULL, 0, NOW(), NOW()),
--     (user2_id, 5, 10, CURRENT_DATE, 15, NOW(), NOW());
--     
--     -- Create user memberships
--     INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status, created_at, updated_at)
--     VALUES 
--     (user2_id, 'pro', NOW(), NOW() + INTERVAL '90 days', 'active', NOW(), NOW());
--     
--     -- Create exam stats for user 2
--     INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date, created_at, updated_at)
--     VALUES 
--     (user2_id, 'ssc-cgl', 5, 85, 78.5, 15, NOW() - INTERVAL '1 day', NOW(), NOW());
--     
--     -- Create test completions for user 2
--     INSERT INTO test_completions (user_id, exam_id, test_type, test_id, topic_id, score, total_questions, correct_answers, time_taken, completed_at, answers)
--     VALUES 
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', NULL, 85, 100, 85, 3600, NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', NULL, 72, 100, 72, 3300, NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');
--     
--     -- Create individual test scores
--     INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, rank, completed_at)
--     VALUES 
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, 15, NOW() - INTERVAL '1 day'),
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, 25, NOW() - INTERVAL '2 days');
--     
--     -- Create test attempts
--     INSERT INTO test_attempts (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, started_at, completed_at, answers)
--     VALUES 
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, NOW() - INTERVAL '1 day 1 hour', NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
--     (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, NOW() - INTERVAL '2 days 1 hour', NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');
--     
--     -- Create referral codes
--     INSERT INTO referral_codes (code, user_id, is_active, created_at, updated_at)
--     VALUES 
--     (referral_code1, user1_id, true, NOW(), NOW()),
--     (referral_code2, user2_id, true, NOW(), NOW());
--     
--     -- Create a sample payment record
--     INSERT INTO payments (payment_id, user_id, plan_id, plan_name, amount, currency, payment_method, status, razorpay_order_id, created_at, updated_at)
--     VALUES 
--     ('PAY_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9), user2_id, 'pro', 'Pro Plan', 99.00, 'INR', 'razorpay', 'completed', 'order_' || substr(md5(random()::text), 1, 10), NOW(), NOW());
--     
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Execute the function to create test data (commented out)
-- SELECT create_test_users();

-- 8. Drop the function after use (commented out)
-- DROP FUNCTION create_test_users();

-- 9. Create a view for easy testing
CREATE OR REPLACE VIEW test_data_summary AS
SELECT 
    up.id as user_id,
    up.phone,
    up.membership_status,
    up.membership_plan,
    up.referral_code,
    up.referred_by,
    us.current_streak,
    us.total_tests_taken,
    um.plan_id as actual_plan,
    um.status as membership_status_actual,
    um.end_date as membership_expiry,
    COUNT(tc.id) as test_completions_count,
    COUNT(its.id) as individual_scores_count,
    COUNT(ta.id) as test_attempts_count
FROM user_profiles up
LEFT JOIN user_streaks us ON up.id = us.user_id
LEFT JOIN user_memberships um ON up.id = um.user_id
LEFT JOIN test_completions tc ON up.id = tc.user_id
LEFT JOIN individual_test_scores its ON up.id = its.user_id
LEFT JOIN test_attempts ta ON up.id = ta.user_id
GROUP BY up.id, up.phone, up.membership_status, up.membership_plan, up.referral_code, up.referred_by, 
         us.current_streak, us.total_tests_taken, um.plan_id, um.status, um.end_date;

-- 10. Grant permissions
GRANT SELECT ON test_data_summary TO authenticated;
