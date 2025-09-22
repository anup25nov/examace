-- Fix Membership Plans Conflict
-- This migration handles existing membership plans properly

-- Update existing membership plans instead of inserting duplicates
UPDATE membership_plans SET
  name = 'Pro Plan',
  description = 'Access to 11 mock tests for 3 months',
  price = 99.00,
  original_price = 199.00,
  duration_days = 90,
  duration_months = 3,
  mock_tests = 11,
  features = '["11 Mock Tests", "3 Months Access", "Detailed Solutions", "Performance Analytics"]',
  is_active = true,
  display_order = 2,
  updated_at = NOW()
WHERE id = 'pro';

-- Insert new plans only if they don't exist
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order, created_at, updated_at)
SELECT 'pro_plus', 'Pro Plus Plan', 'Unlimited access to all mock tests for 12 months', 299.00, 599.00, 365, 12, 9999, '["Unlimited Mock Tests", "12 Months Access", "Detailed Solutions", "Performance Analytics", "Priority Support"]', true, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE id = 'pro_plus');

-- Update free plan if it exists, otherwise insert
INSERT INTO membership_plans (id, name, description, price, original_price, duration_days, duration_months, mock_tests, features, is_active, display_order, created_at, updated_at)
SELECT 'free', 'Free Plan', 'Limited access to practice tests', 0.00, 0.00, 0, 0, 0, '["Limited Practice Tests", "Basic Solutions"]', true, 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE id = 'free');

-- Update free plan if it exists
UPDATE membership_plans SET
  name = 'Free Plan',
  description = 'Limited access to practice tests',
  price = 0.00,
  original_price = 0.00,
  duration_days = 0,
  duration_months = 0,
  mock_tests = 0,
  features = '["Limited Practice Tests", "Basic Solutions"]',
  is_active = true,
  display_order = 3,
  updated_at = NOW()
WHERE id = 'free';
