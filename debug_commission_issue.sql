-- Debug script to check why commission is not being processed
-- Run this to understand the current state

-- 1. Check the referral transaction
SELECT 
  id,
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
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- 2. Check if there are any referral_commissions for this user
SELECT 
  id,
  referrer_id,
  referred_id,
  payment_id,
  commission_amount,
  commission_percentage,
  membership_plan,
  membership_amount,
  status,
  is_first_membership,
  created_at
FROM referral_commissions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- 3. Check if the user has any memberships
SELECT 
  id,
  user_id,
  plan,
  start_date,
  end_date,
  mocks_used,
  created_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- 4. Check if the user has any payments
SELECT 
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  razorpay_payment_id,
  created_at,
  paid_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- 5. Check referrer's referral code and earnings
SELECT 
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- 6. Test the process_membership_commission function manually
-- (This will help us see what's happening)
SELECT * FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM payments WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8' ORDER BY created_at DESC LIMIT 1),
  'pro',
  1.00
);
