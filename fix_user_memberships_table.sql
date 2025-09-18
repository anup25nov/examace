-- Fix user_memberships table structure
-- Run this script in your Supabase SQL Editor

-- 1. Check current user_memberships table structure
SELECT '=== CURRENT USER_MEMBERSHIPS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist (safe approach)
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Update existing records with default values if needed
UPDATE user_memberships 
SET 
  plan = COALESCE(plan, 'pro'),
  status = COALESCE(status, 'active'),
  start_date = COALESCE(start_date, created_at),
  end_date = COALESCE(end_date, created_at + INTERVAL '1 month'),
  updated_at = NOW()
WHERE plan IS NULL OR status IS NULL OR start_date IS NULL OR end_date IS NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan ON user_memberships(plan);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);

-- 5. Check final structure
SELECT '=== FINAL USER_MEMBERSHIPS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test the table with sample data
SELECT '=== TESTING TABLE STRUCTURE ===' as test;

-- Check if we can insert a test record (this will be rolled back)
BEGIN;
  INSERT INTO user_memberships (user_id, plan, status, start_date, end_date)
  VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, 
    'pro', 
    'active', 
    NOW(), 
    NOW() + INTERVAL '1 month'
  );
ROLLBACK;

SELECT 'User_memberships table structure fixed successfully!' as status;
