-- Quick Fix for plan_id constraint issue
-- Run this in Supabase SQL Editor

-- 1. Make plan_id nullable in user_memberships table
ALTER TABLE user_memberships ALTER COLUMN plan_id DROP NOT NULL;

-- 2. Ensure we have a default free plan
INSERT INTO membership_plans (id, name, price, duration_months, features, is_active)
VALUES (
    'free-plan-id',
    'Free Plan',
    0,
    0,
    '["Basic access to free tests"]',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Update existing user_memberships with null plan_id to use free plan
UPDATE user_memberships 
SET plan_id = 'free-plan-id' 
WHERE plan_id IS NULL;

-- 4. Grant permissions
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON membership_plans TO authenticated;
