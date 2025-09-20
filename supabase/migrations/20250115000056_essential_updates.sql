-- Essential updates for Step2Sarkari
-- This migration applies only the essential changes needed

-- Update membership plans to match the new configuration
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active, display_order, currency) VALUES
('pro_plus', 'Pro Plus Plan', 'Complete access to all mocks and features', 299, 12, 365, 9999, '["12 months validity", "Unlimited mock tests", "Premium PYQs", "Detailed Solutions", "Priority Support", "Advanced Analytics"]', true, 1, 'INR')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  duration_months = EXCLUDED.duration_months, 
  duration_days = EXCLUDED.duration_days, 
  mock_tests = EXCLUDED.mock_tests, 
  features = EXCLUDED.features, 
  is_active = EXCLUDED.is_active, 
  display_order = EXCLUDED.display_order, 
  currency = EXCLUDED.currency, 
  updated_at = NOW();

INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active, display_order, currency) VALUES
('pro', 'Pro Plan', 'Access to 11 mock tests', 99, 3, 90, 11, '["3 months validity", "11 mock tests", "Premium PYQs", "Detailed Solutions", "Performance Analytics"]', true, 2, 'INR')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  duration_months = EXCLUDED.duration_months, 
  duration_days = EXCLUDED.duration_days, 
  mock_tests = EXCLUDED.mock_tests, 
  features = EXCLUDED.features, 
  is_active = EXCLUDED.is_active, 
  display_order = EXCLUDED.display_order, 
  currency = EXCLUDED.currency, 
  updated_at = NOW();

-- Update commission configuration to use constants
-- This will be handled by the application configuration instead of database table
