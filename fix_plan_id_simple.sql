-- Simple fix for plan_id constraint - only work with existing columns
-- Run this script in your Supabase SQL Editor

-- 1. Check current user_memberships table structure
SELECT '=== CURRENT USER_MEMBERSHIPS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what's in the membership_plans table
SELECT '=== CHECKING MEMBERSHIP_PLANS TABLE ===' as test;

SELECT id, name, price, duration_days, created_at
FROM membership_plans
ORDER BY name;

-- 3. Check current user_memberships records with NULL plan_id
SELECT '=== CHECKING NULL PLAN_ID RECORDS ===' as test;

SELECT user_id, plan_id, created_at
FROM user_memberships
WHERE plan_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Create default membership plans if they don't exist
INSERT INTO membership_plans (id, name, price, duration_days, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::UUID, 'pro', 1.00, 30, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'pro_plus', 2.00, 365, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 5. Update all NULL plan_id records with pro plan (default)
UPDATE user_memberships 
SET 
  plan_id = (SELECT id FROM membership_plans WHERE name = 'pro' LIMIT 1),
  updated_at = NOW()
WHERE plan_id IS NULL;

-- 6. Verify all records now have plan_id
SELECT '=== VERIFYING PLAN_ID FIX ===' as test;

SELECT 
  COUNT(*) as total_records,
  COUNT(plan_id) as records_with_plan_id,
  COUNT(*) - COUNT(plan_id) as records_without_plan_id
FROM user_memberships;

-- 7. Show sample of fixed records
SELECT '=== SAMPLE FIXED RECORDS ===' as test;

SELECT user_id, plan_id, created_at
FROM user_memberships
ORDER BY created_at DESC
LIMIT 5;

-- 8. Create a simple function to safely insert user_memberships
CREATE OR REPLACE FUNCTION safe_insert_user_membership(
  p_user_id UUID,
  p_plan_name VARCHAR(50) DEFAULT 'pro'
)
RETURNS UUID AS $$
DECLARE
  plan_id_value UUID;
  membership_id UUID;
BEGIN
  -- Get plan_id for the given plan name
  SELECT id INTO plan_id_value
  FROM membership_plans
  WHERE name = p_plan_name
  LIMIT 1;
  
  -- If plan not found, use pro plan
  IF plan_id_value IS NULL THEN
    SELECT id INTO plan_id_value
    FROM membership_plans
    WHERE name = 'pro'
    LIMIT 1;
  END IF;
  
  -- Insert membership with proper plan_id (only existing columns)
  INSERT INTO user_memberships (
    user_id,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    plan_id_value,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW()
  RETURNING id INTO membership_id;
  
  RETURN membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION safe_insert_user_membership(UUID, VARCHAR) TO authenticated;

-- 10. Test the function
SELECT '=== TESTING SAFE INSERT FUNCTION ===' as test;

-- This will be rolled back
BEGIN;
  SELECT safe_insert_user_membership('00000000-0000-0000-0000-000000000000'::UUID, 'pro');
ROLLBACK;

SELECT 'Plan ID constraint fixed successfully!' as status;
