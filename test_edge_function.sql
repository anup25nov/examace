-- Test the Edge Function directly
-- This simulates what the frontend should be doing

-- 1. Check current payment status
SELECT '=== CURRENT PAYMENT STATUS ===' as step;
SELECT 
  id,
  status,
  razorpay_payment_id,
  razorpay_order_id,
  amount,
  plan
FROM payments 
WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Test the Edge Function manually
SELECT '=== TESTING EDGE FUNCTION MANUALLY ===' as step;
SELECT 'To test the Edge Function, make a POST request to:' as instruction
UNION ALL
SELECT 'https://talvssmwnsfotoutjlhd.supabase.co/functions/v1/verify_razorpay_payment' as instruction
UNION ALL
SELECT 'With body:' as instruction
UNION ALL
SELECT '{
  "user_id": "9948aaa7-1746-465a-968a-3f8c5b3d5870",
  "plan": "pro_plus",
  "order_id": "order_RJ9TAH6SPMndhb",
  "payment_id": "pay_test_123456",
  "signature": "test_signature_123456",
  "referral_code": "FBC97816"
}' as instruction;

-- 3. Check if there are any errors in the function
SELECT '=== CHECKING FOR FUNCTION ERRORS ===' as step;
SELECT 'Check the following:' as check_item
UNION ALL
SELECT '1. Is the Edge Function deployed correctly?' as check_item
UNION ALL
SELECT '2. Are there any errors in the function logs?' as check_item
UNION ALL
SELECT '3. Is the function receiving the correct parameters?' as check_item
UNION ALL
SELECT '4. Is the referral_code being passed correctly?' as check_item;

-- 4. Manual test of the commission processing
SELECT '=== MANUAL COMMISSION TEST ===' as step;

-- First, create the referral transaction if it doesn't exist
INSERT INTO referral_transactions (
  referrer_id,
  referred_id,
  referral_code,
  amount,
  transaction_type,
  status,
  commission_amount,
  commission_status,
  membership_purchased,
  first_membership_only,
  created_at,
  updated_at
) 
SELECT 
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec',
  '9948aaa7-1746-465a-968a-3f8c5b3d5870',
  'FBC97816',
  0.00,
  'referral',
  'pending',
  0.00,
  'pending',
  false,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM referral_transactions 
  WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
  AND referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
);

-- Now test the commission processing
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,
  'pro_plus',
  2.00
);

-- 5. Check results
SELECT '=== COMMISSION PROCESSING RESULTS ===' as step;
SELECT * FROM referral_transactions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

SELECT * FROM referral_commissions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

SELECT 'Test completed! Check results above.' as status;
