-- Setup Membership Plans
-- Run this script to set up membership plans

-- Clear existing plans
DELETE FROM membership_plans;

-- Insert membership plans
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order) VALUES
('pro', 'Pro Plan', 'Access to 11 mock tests for 3 months', 99.00, 199.00, 90, 3, 11, '["11 Mock Tests", "3 Months Access", "Detailed Solutions", "Performance Analytics"]', true, 2),
('pro_plus', 'Pro Plus Plan', 'Unlimited access to all mock tests for 12 months', 299.00, 599.00, 365, 12, 9999, '["Unlimited Mock Tests", "12 Months Access", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true, 1),
('free', 'Free Plan', 'Limited access to practice tests', 0.00, 0.00, 0, 0, 0, '["Limited Practice Tests", "Basic Solutions"]', true, 3);

-- Verify insertion
SELECT * FROM membership_plans ORDER BY display_order;
