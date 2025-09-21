-- Sync Membership Plans with Centralized Configuration (UPSERT)
-- This migration ensures the database matches the centralized appConfig.ts

-- Upsert plans from centralized configuration
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order) VALUES
('free', 'Free Plan', 'Limited access to practice tests', 0.00, 0.00, 0, 0, 0, '["Limited Practice Tests", "Basic Solutions"]', true, 3),
('pro', 'Pro Plan', 'Access to 11 mock tests for 3 months', 99.00, 199.00, 90, 3, 11, '["11 Mock Tests", "3 Months Access", "Detailed Solutions", "Performance Analytics"]', true, 2),
('pro_plus', 'Pro Plus Plan', 'Unlimited access to all mock tests for 12 months', 299.00, 599.00, 365, 12, 9999, '["Unlimited Mock Tests", "12 Months Access", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true, 1)
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

-- Verify insertion
SELECT '=== MEMBERSHIP PLANS SYNCED ===' as status;
SELECT id, name, price, mock_tests, duration_days, is_active, display_order 
FROM membership_plans 
ORDER BY display_order;
