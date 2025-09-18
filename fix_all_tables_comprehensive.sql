-- Comprehensive fix for all table structures
-- Run this script in your Supabase SQL Editor

-- 1. Fix user_memberships table
SELECT '=== FIXING USER_MEMBERSHIPS TABLE ===' as step;

-- Add missing columns safely
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records
UPDATE user_memberships 
SET 
  plan = COALESCE(plan, 'pro'),
  status = COALESCE(status, 'active'),
  start_date = COALESCE(start_date, COALESCE(created_at, NOW())),
  end_date = COALESCE(end_date, COALESCE(created_at, NOW()) + INTERVAL '1 month'),
  updated_at = NOW()
WHERE plan IS NULL OR status IS NULL OR start_date IS NULL OR end_date IS NULL;

-- 2. Fix payments table
SELECT '=== FIXING PAYMENTS TABLE ===' as step;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- Update existing records
UPDATE payments 
SET 
  plan = COALESCE(plan, 'pro'),
  amount = COALESCE(amount, 0.00),
  status = COALESCE(status, 'pending')
WHERE plan IS NULL OR amount IS NULL OR status IS NULL;

-- 3. Create user_messages table if it doesn't exist
SELECT '=== CREATING USER_MESSAGES TABLE ===' as step;

CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create all necessary indexes
SELECT '=== CREATING INDEXES ===' as step;

-- user_memberships indexes
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan ON user_memberships(plan);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- user_messages indexes
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);

-- 5. Grant permissions
SELECT '=== GRANTING PERMISSIONS ===' as step;

GRANT SELECT, INSERT, UPDATE ON user_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_messages TO authenticated;

-- 6. Verify table structures
SELECT '=== VERIFYING TABLE STRUCTURES ===' as step;

SELECT 'user_memberships columns:' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_memberships' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'payments columns:' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'user_messages columns:' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_messages' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'All tables fixed successfully!' as status;
