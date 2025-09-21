-- Manual Database Setup Script
-- Run this script manually to set up the database with test data

-- 1. Insert membership plans
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order) VALUES
('pro', 'Pro Plan', 'Access to 11 mock tests for 3 months', 99.00, 199.00, 90, 3, 11, '["11 Mock Tests", "3 Months Access", "Detailed Solutions", "Performance Analytics"]', true, 2),
('pro_plus', 'Pro Plus Plan', 'Unlimited access to all mock tests for 12 months', 299.00, 599.00, 365, 12, 9999, '["Unlimited Mock Tests", "12 Months Access", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true, 1),
('free', 'Free Plan', 'Limited access to practice tests', 0.00, 0.00, 0, 0, 0, '["Limited Practice Tests", "Basic Solutions"]', true, 3)
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
    display_order = EXCLUDED.display_order;

-- 2. Create test users in auth.users (you need to do this manually through Supabase Auth)
-- User 1: testuser1@example.com / password123 / +919876543210
-- User 2: testuser2@example.com / password123 / +919876543211

-- 3. After creating users, get their UUIDs and run the following:
-- Replace these UUIDs with actual user IDs from auth.users

-- Example user IDs (replace with actual ones):
-- User 1 ID: [GET_FROM_AUTH_USERS]
-- User 2 ID: [GET_FROM_AUTH_USERS]

-- 4. Insert user profiles (replace UUIDs with actual ones)
-- INSERT INTO user_profiles (id, phone, membership_status, membership_plan, membership_expiry, referral_code, referred_by, created_at, updated_at)
-- VALUES 
-- ('[USER1_UUID]', '+919876543210', 'free', 'free', NULL, 'TEST123456', NULL, NOW(), NOW()),
-- ('[USER2_UUID]', '+919876543211', 'active', 'pro', NOW() + INTERVAL '90 days', 'TEST789012', 'TEST123456', NOW(), NOW());

-- 5. Insert user streaks
-- INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken, created_at, updated_at)
-- VALUES 
-- ('[USER1_UUID]', 0, 0, NULL, 0, NOW(), NOW()),
-- ('[USER2_UUID]', 5, 10, CURRENT_DATE, 15, NOW(), NOW());

-- 6. Insert user memberships
-- INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status, created_at, updated_at)
-- VALUES 
-- ('[USER2_UUID]', 'pro', NOW(), NOW() + INTERVAL '90 days', 'active', NOW(), NOW());

-- 7. Insert exam stats
-- INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date, created_at, updated_at)
-- VALUES 
-- ('[USER2_UUID]', 'ssc-cgl', 5, 85, 78.5, 15, NOW() - INTERVAL '1 day', NOW(), NOW());

-- 8. Insert test completions
-- INSERT INTO test_completions (user_id, exam_id, test_type, test_id, topic_id, score, total_questions, correct_answers, time_taken, completed_at, answers)
-- VALUES 
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', NULL, 85, 100, 85, 3600, NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', NULL, 72, 100, 72, 3300, NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');

-- 9. Insert individual test scores
-- INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, rank, completed_at)
-- VALUES 
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, 15, NOW() - INTERVAL '1 day'),
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, 25, NOW() - INTERVAL '2 days');

-- 10. Insert test attempts
-- INSERT INTO test_attempts (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, started_at, completed_at, answers)
-- VALUES 
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, NOW() - INTERVAL '1 day 1 hour', NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
-- ('[USER2_UUID]', 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, NOW() - INTERVAL '2 days 1 hour', NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');

-- 11. Insert referral codes
-- INSERT INTO referral_codes (code, user_id, is_active, created_at, updated_at)
-- VALUES 
-- ('TEST123456', '[USER1_UUID]', true, NOW(), NOW()),
-- ('TEST789012', '[USER2_UUID]', true, NOW(), NOW());

-- 12. Insert payment record
-- INSERT INTO payments (payment_id, user_id, plan_id, plan_name, amount, currency, payment_method, status, razorpay_order_id, created_at, updated_at)
-- VALUES 
-- ('PAY_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9), '[USER2_UUID]', 'pro', 'Pro Plan', 99.00, 'INR', 'razorpay', 'completed', 'order_' || substr(md5(random()::text), 1, 10), NOW(), NOW());

-- 13. Create test data summary view
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

-- Grant permissions
GRANT SELECT ON test_data_summary TO authenticated;
