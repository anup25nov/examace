-- Debug payment flow issues
-- Run this in your Supabase SQL Editor

-- 1. Check what payment_id values exist in payments table
SELECT '=== PAYMENT ID VALUES ===' as step;
SELECT 
  id,
  payment_id,
  razorpay_payment_id,
  user_id,
  status,
  created_at
FROM payments 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 2. Check if the issue is with payment_id type conversion
SELECT '=== CHECKING PAYMENT ID TYPES ===' as step;
SELECT 
  'Payment ID from payments table' as source,
  payment_id as value,
  pg_typeof(payment_id) as type
FROM payments 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Test the process_referral_commission function with correct payment_id
SELECT '=== TESTING WITH CORRECT PAYMENT ID ===' as step;
-- Use the actual payment ID from the payments table
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,
  'pro_plus',
  2.00
);

-- 4. Check if the issue is in the Edge Function
SELECT '=== EDGE FUNCTION ISSUE ANALYSIS ===' as step;
SELECT 'The issue might be:' as analysis
UNION ALL
SELECT '1. body.payment_id is a string (Razorpay payment ID) not UUID' as analysis
UNION ALL
SELECT '2. Function expects UUID but receives string' as analysis
UNION ALL
SELECT '3. Need to use payments.id (UUID) instead of body.payment_id (string)' as analysis;

-- 5. Check what the Edge Function should be doing
SELECT '=== CORRECT APPROACH ===' as step;
SELECT 'The Edge Function should:' as approach
UNION ALL
SELECT '1. Get the payment record using razorpay_payment_id' as approach
UNION ALL
SELECT '2. Use the payments.id (UUID) for process_referral_commission' as approach
UNION ALL
SELECT '3. Pass the correct UUID to the function' as approach;

SELECT 'Debug analysis complete!' as status;
