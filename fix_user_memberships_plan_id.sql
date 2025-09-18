-- Fix user_memberships table with plan_id constraint
-- Run this script in your Supabase SQL Editor

-- 1. Check current user_memberships table structure
SELECT '=== CURRENT USER_MEMBERSHIPS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if plan_id references membership_plans table
SELECT '=== CHECKING PLAN_ID CONSTRAINT ===' as test;

SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_memberships'
  AND kcu.column_name = 'plan_id';

-- 3. Check membership_plans table
SELECT '=== CHECKING MEMBERSHIP_PLANS TABLE ===' as test;

SELECT id, name, price, duration_days
FROM membership_plans
ORDER BY name;

-- 4. Add missing columns safely (without plan_id for now)
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Update existing records with proper plan_id
UPDATE user_memberships 
SET 
  plan = COALESCE(plan, 'pro'),
  status = COALESCE(status, 'active'),
  start_date = COALESCE(start_date, COALESCE(created_at, NOW())),
  end_date = COALESCE(end_date, COALESCE(created_at, NOW()) + INTERVAL '1 month'),
  updated_at = NOW(),
  -- Set plan_id based on plan name
  plan_id = CASE 
    WHEN COALESCE(plan, 'pro') = 'pro_plus' THEN 
      (SELECT id FROM membership_plans WHERE name = 'pro_plus' LIMIT 1)
    ELSE 
      (SELECT id FROM membership_plans WHERE name = 'pro' LIMIT 1)
  END
WHERE plan_id IS NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan ON user_memberships(plan);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan_id ON user_memberships(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);

-- 7. Check final structure
SELECT '=== FINAL USER_MEMBERSHIPS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Test the table with sample data
SELECT '=== TESTING TABLE STRUCTURE ===' as test;

-- Check if we can insert a test record (this will be rolled back)
BEGIN;
  INSERT INTO user_memberships (user_id, plan_id, plan, status, start_date, end_date)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    (SELECT id FROM membership_plans WHERE name = 'pro' LIMIT 1),
    'pro', 
    'active', 
    NOW(), 
    NOW() + INTERVAL '1 month'
  );
ROLLBACK;

SELECT 'User_memberships table with plan_id fixed successfully!' as status;
