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
