-- Update membership plans to match the new requirements
-- Pro: 99, 11 mock, 3 months
-- Pro+: 299, all mocks, 12 months

-- Update Pro plan
UPDATE membership_plans 
SET 
  name = 'Pro Plan',
  description = 'Access to 11 mock tests with premium features',
  price = 99,
  original_price = 199,
  duration_months = 3,
  duration_days = 90,
  mock_tests = 11,
  features = '["3 months validity", "11 mock tests", "Premium PYQs", "Detailed Solutions", "Performance Analytics"]',
  display_order = 2,
  updated_at = NOW()
WHERE id = 'pro';

-- Update Pro+ plan
UPDATE membership_plans 
SET 
  name = 'Pro+ Plan',
  description = 'Complete access to all mocks and premium features',
  price = 299,
  original_price = 599,
  duration_months = 12,
  duration_days = 365,
  mock_tests = 9999, -- Unlimited mock tests
  features = '["12 months validity", "Unlimited mock tests", "Premium PYQs", "Detailed Solutions", "Priority Support", "Advanced Analytics"]',
  display_order = 1, -- Show Pro+ first
  updated_at = NOW()
WHERE id = 'pro_plus';

-- Ensure both plans are active
UPDATE membership_plans 
SET is_active = true, updated_at = NOW()
WHERE id IN ('pro', 'pro_plus');

-- Update commission configuration to match new pricing
UPDATE commission_config 
SET value = 50.00, updated_at = NOW()
WHERE key = 'commission_percentage';

-- Add any missing commission configuration
INSERT INTO commission_config (key, value, description) VALUES
('commission_percentage', 50.00, 'Commission percentage for referrals'),
('minimum_withdrawal', 100.00, 'Minimum withdrawal amount'),
('maximum_withdrawal', 10000.00, 'Maximum withdrawal amount'),
('processing_fee', 0.00, 'Processing fee percentage'),
('tax_deduction', 0.00, 'Tax deduction percentage')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
