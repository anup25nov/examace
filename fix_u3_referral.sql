-- Fix U3's referral relationship
-- Run this in your Supabase SQL Editor

-- 1. Check U3's referral transactions
SELECT '=== U3 REFERRAL TRANSACTIONS ===' as step;
SELECT * FROM referral_transactions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;

-- 2. Create referral transaction for U3 if it doesn't exist
SELECT '=== CREATING REFERRAL TRANSACTION FOR U3 ===' as step;
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
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec', -- U1's ID
  '9948aaa7-1746-465a-968a-3f8c5b3d5870', -- U3's ID
  'FBC97816', -- U1's referral code
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

-- 3. Test commission processing
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,
  'pro_plus',
  2.00
);

-- 4. Check results
SELECT '=== RESULTS ===' as step;
SELECT total_earnings FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
