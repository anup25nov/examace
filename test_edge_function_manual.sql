-- Test Edge Function manually
-- This simulates what should happen when U3 pays

-- 1. Check U3's payment details
SELECT '=== U3 PAYMENT DETAILS ===' as step;
SELECT 
  id,
  status,
  razorpay_payment_id,
  razorpay_order_id,
  amount,
  plan
FROM payments 
WHERE user_id = '9044683e-a0c1-40fe-9b3a-47fea186bbd2'
ORDER BY created_at DESC;

-- 2. Manual test of commission processing
SELECT '=== MANUAL COMMISSION TEST ===' as step;
SELECT * FROM process_referral_commission(
  '9044683e-a0c1-40fe-9b3a-47fea186bbd2'::UUID,
  (SELECT id FROM payments WHERE user_id = '9044683e-a0c1-40fe-9b3a-47fea186bbd2' ORDER BY created_at DESC LIMIT 1)::UUID,
  'pro_plus',
  2.00
);

-- 3. Check results
SELECT '=== RESULTS ===' as step;
SELECT total_earnings FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
