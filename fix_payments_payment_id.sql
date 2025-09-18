-- Quick fix for payments table payment_id constraint
-- Run this script in your Supabase SQL Editor

-- 1. Check current payments table structure
SELECT '=== CURRENT PAYMENTS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Make payment_id nullable
ALTER TABLE payments ALTER COLUMN payment_id DROP NOT NULL;

-- 3. Update existing NULL payment_id records
UPDATE payments 
SET payment_id = 'legacy_' || id::text
WHERE payment_id IS NULL;

-- 4. Add missing columns if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- 5. Make plan_id, plan_name, and payment_method nullable if they're not already
ALTER TABLE payments ALTER COLUMN plan_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN plan_name DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN payment_method DROP NOT NULL;

-- 6. Update existing records with default values
UPDATE payments 
SET 
  plan = COALESCE(plan, 'pro'),
  plan_name = COALESCE(plan_name, 'pro'),
  amount = COALESCE(amount, 0.00),
  status = COALESCE(status, 'pending'),
  plan_id = COALESCE(plan_id, '00000000-0000-0000-0000-000000000001'::UUID),
  payment_method = COALESCE(payment_method, 'razorpay')
WHERE plan IS NULL OR plan_name IS NULL OR amount IS NULL OR status IS NULL OR plan_id IS NULL OR payment_method IS NULL;

-- 7. Check final structure
SELECT '=== FINAL PAYMENTS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Test inserting a payment record
SELECT '=== TESTING PAYMENT INSERT ===' as test;

-- This will be rolled back
BEGIN;
  INSERT INTO payments (
    user_id, 
    plan, 
    plan_name,
    amount, 
    status, 
    payment_id,
    plan_id,
    payment_method,
    paid_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'pro',
    'pro',
    1.00,
    'completed',
    'test_payment_123',
    '00000000-0000-0000-0000-000000000001'::UUID,
    'razorpay',
    NOW()
  );
ROLLBACK;

SELECT 'Payments table payment_id constraint fixed successfully!' as status;
