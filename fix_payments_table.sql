-- Fix payments table structure
-- Run this script in your Supabase SQL Editor

-- 1. Check current payments table structure
SELECT '=== CURRENT PAYMENTS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- 3. Update existing records with default values if needed
UPDATE payments 
SET 
  plan = COALESCE(plan, 'pro'),
  amount = COALESCE(amount, 0.00),
  status = COALESCE(status, 'pending')
WHERE plan IS NULL OR amount IS NULL OR status IS NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- 5. Check final structure
SELECT '=== FINAL PAYMENTS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Payments table structure fixed successfully!' as status;
