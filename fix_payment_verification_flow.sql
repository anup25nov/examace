-- Fix payment verification flow
-- Run this in your Supabase SQL Editor

-- 1. Check if the payment needs to be manually verified
SELECT '=== MANUAL PAYMENT VERIFICATION ===' as step;

-- Update the payment to completed status (simulating successful Razorpay verification)
UPDATE payments 
SET 
  status = 'completed',
  razorpay_payment_id = 'pay_test_' || extract(epoch from now())::text,
  razorpay_signature = 'test_signature_' || extract(epoch from now())::text,
  paid_at = NOW(),
  updated_at = NOW()
WHERE id = 'c6eb8982-d67c-482b-89d0-5aeb838eb022';

-- 2. Check updated payment
SELECT '=== UPDATED PAYMENT ===' as step;
SELECT 
  id,
  payment_id,
  razorpay_payment_id,
  status,
  paid_at,
  amount,
  plan
FROM payments 
WHERE id = 'c6eb8982-d67c-482b-89d0-5aeb838eb022';

-- 3. Now test the referral code application
SELECT '=== TESTING REFERRAL CODE APPLICATION ===' as step;

-- Check if U2 has referral code in localStorage (we need to simulate this)
-- For now, let's manually create the referral relationship
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
) VALUES (
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec', -- U1's ID
  '9948aaa7-1746-465a-968a-3f8c5b3d5870', -- U2's ID
  'FBC97816', -- U1's referral code
  0.00, -- Will be updated when commission is processed
  'referral',
  'pending',
  0.00,
  'pending',
  false, -- Will be updated to true when commission is processed
  true,
  NOW(),
  NOW()
);

-- 4. Check the created referral transaction
SELECT '=== CREATED REFERRAL TRANSACTION ===' as step;
SELECT * FROM referral_transactions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 5. Now test the commission processing
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'c6eb8982-d67c-482b-89d0-5aeb838eb022'::UUID,
  'pro_plus',
  2.00
);

-- 6. Check results
SELECT '=== COMMISSION PROCESSING RESULTS ===' as step;

-- Check referral transactions
SELECT * FROM referral_transactions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- Check referral commissions
SELECT * FROM referral_commissions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- Check U1's updated earnings
SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

SELECT 'Payment verification and commission processing completed!' as status;
