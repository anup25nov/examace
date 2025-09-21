-- Database Setup Corrected Migration
-- This migration will create proper test data with auth users

-- 1. Insert membership plans with proper UUIDs
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

-- 2. Create a function to generate test data with proper auth users
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS VOID AS $$
DECLARE
    user1_id UUID := gen_random_uuid();
    user2_id UUID := gen_random_uuid();
    referral_code1 VARCHAR(20) := 'TEST' || substr(md5(random()::text), 1, 6);
    referral_code2 VARCHAR(20) := 'TEST' || substr(md5(random()::text), 1, 6);
BEGIN
    -- Create auth users first
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at)
    VALUES 
    (user1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testuser1@example.com', crypt('password123', gen_salt('bf')), NOW(), NULL, '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), '+919876543210', NOW(), '', '', NOW(), '', 0, NULL, '', NOW()),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'testuser2@example.com', crypt('password123', gen_salt('bf')), NOW(), NULL, '', NOW(), '', NOW(), '', '', NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, NOW(), NOW(), '+919876543211', NOW(), '', '', NOW(), '', 0, NULL, '', NOW());
    
    -- Create user profiles
    INSERT INTO user_profiles (id, phone, membership_status, membership_plan, membership_expiry, referral_code, referred_by, created_at, updated_at)
    VALUES 
    (user1_id, '+919876543210', 'free', 'free', NULL, referral_code1, NULL, NOW(), NOW()),
    (user2_id, '+919876543211', 'active', 'pro', NOW() + INTERVAL '90 days', referral_code2, referral_code1, NOW(), NOW());
    
    -- Create user streaks
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_tests_taken, created_at, updated_at)
    VALUES 
    (user1_id, 0, 0, NULL, 0, NOW(), NOW()),
    (user2_id, 5, 10, CURRENT_DATE, 15, NOW(), NOW());
    
    -- Create user memberships
    INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status, created_at, updated_at)
    VALUES 
    (user2_id, 'pro', NOW(), NOW() + INTERVAL '90 days', 'active', NOW(), NOW());
    
    -- Create exam stats for user 2
    INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank, last_test_date, created_at, updated_at)
    VALUES 
    (user2_id, 'ssc-cgl', 5, 85, 78.5, 15, NOW() - INTERVAL '1 day', NOW(), NOW());
    
    -- Create test completions for user 2
    INSERT INTO test_completions (user_id, exam_id, test_type, test_id, topic_id, score, total_questions, correct_answers, time_taken, completed_at, answers)
    VALUES 
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', NULL, 85, 100, 85, 3600, NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', NULL, 72, 100, 72, 3300, NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');
    
    -- Create individual test scores
    INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, rank, completed_at)
    VALUES 
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, 15, NOW() - INTERVAL '1 day'),
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, 25, NOW() - INTERVAL '2 days');
    
    -- Create test attempts
    INSERT INTO test_attempts (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, started_at, completed_at, answers)
    VALUES 
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-1', 85, 100, 85, 3600, NOW() - INTERVAL '1 day 1 hour', NOW() - INTERVAL '1 day', '{"answers": {"1": "A", "2": "B", "3": "C"}}'),
    (user2_id, 'ssc-cgl', 'mock', 'ssc-cgl-mock-2', 72, 100, 72, 3300, NOW() - INTERVAL '2 days 1 hour', NOW() - INTERVAL '2 days', '{"answers": {"1": "A", "2": "B", "3": "C"}}');
    
    -- Create referral codes
    INSERT INTO referral_codes (code, user_id, is_active, created_at, updated_at)
    VALUES 
    (referral_code1, user1_id, true, NOW(), NOW()),
    (referral_code2, user2_id, true, NOW(), NOW());
    
    -- Create a sample payment record
    INSERT INTO payments (payment_id, user_id, plan_id, plan_name, amount, currency, payment_method, status, razorpay_order_id, created_at, updated_at)
    VALUES 
    ('PAY_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9), user2_id, 'pro', 'Pro Plan', 99.00, 'INR', 'razorpay', 'completed', 'order_' || substr(md5(random()::text), 1, 10), NOW(), NOW());
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Execute the function to create test data
SELECT create_test_users();

-- 4. Drop the function after use
DROP FUNCTION create_test_users();

-- 5. Create a view for easy testing
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

-- 6. Grant permissions
GRANT SELECT ON test_data_summary TO authenticated;
