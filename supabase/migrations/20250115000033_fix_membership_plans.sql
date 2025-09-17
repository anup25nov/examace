-- Fix membership plans to include pro_plus plan
-- This migration adds the missing pro_plus plan to the membership_plans table

-- Add pro_plus plan to membership_plans table
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active) VALUES
('pro_plus', 'Pro Plus Plan', 'Complete exam preparation package with priority support', 1999, 12, 365, 5000, '["5000+ PYQ Sets", "1000+ Mock Tests", "Detailed Solutions", "Performance Analytics", "24/7 Priority Support", "Personal Mentor", "Advanced Analytics"]', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  duration_months = EXCLUDED.duration_months,
  duration_days = EXCLUDED.duration_days,
  mock_tests = EXCLUDED.mock_tests,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Update existing pro plan to match the new system
UPDATE membership_plans 
SET 
  name = 'Pro Plan',
  description = 'Complete exam preparation package',
  price = 999,
  duration_months = 12,
  duration_days = 365,
  mock_tests = 2000,
  features = '["2000+ PYQ Sets", "500+ Mock Tests", "Detailed Solutions", "Performance Analytics", "24/7 Support", "Personal Mentor"]',
  updated_at = NOW()
WHERE id = 'pro';

-- Add display_order column if it doesn't exist
ALTER TABLE membership_plans 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set display order for plans
UPDATE membership_plans SET display_order = 1 WHERE id = 'free';
UPDATE membership_plans SET display_order = 2 WHERE id = 'basic';
UPDATE membership_plans SET display_order = 3 WHERE id = 'premium';
UPDATE membership_plans SET display_order = 4 WHERE id = 'pro';
UPDATE membership_plans SET display_order = 5 WHERE id = 'pro_plus';

-- Add currency column if it doesn't exist
ALTER TABLE membership_plans 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

-- Update currency for all plans
UPDATE membership_plans SET currency = 'INR' WHERE currency IS NULL;
