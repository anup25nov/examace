-- Fix referral relationship
-- Run this in your Supabase SQL Editor

-- 1. Create referral transaction for U2
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
  0.00,
  'referral',
  'pending',
  0.00,
  'pending',
  false,
  true,
  NOW(),
  NOW()
);

-- 2. Test commission processing
SELECT * FROM process_referral_commission(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'c6eb8982-d67c-482b-89d0-5aeb838eb022'::UUID,
  'pro_plus',
  2.00
);

-- 3. Check U1's earnings
SELECT total_earnings FROM referral_codes WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';