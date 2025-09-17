-- Fix commission for the specific user who has a referral transaction
-- This will process the commission for user b2975c5b-c04b-4929-b8ac-9f3da1b155b8

-- Step 1: Check the current state of the specific user
SELECT '=== CURRENT STATE OF SPECIFIC USER ===' as step;

-- Check referral transaction
SELECT 
  'Referral Transaction:' as info,
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
  created_at
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check payments for this user
SELECT 
  'Payments for this user:' as info,
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Check memberships for this user
SELECT 
  'Memberships for this user:' as info,
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Check if there are any commissions for this user
SELECT 
  'Commissions for this user:' as info,
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

-- Step 2: Test commission processing for this specific user
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

-- Test with the most recent payment for this user
WITH latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments 
  WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Processing Test:' as info,
  *
FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- Step 3: Check results after processing
SELECT '=== RESULTS AFTER PROCESSING ===' as step;

-- Check referral transaction after processing
SELECT 
  'Referral Transaction After Processing:' as info,
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
  created_at
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check if commission was created
SELECT 
  'Commission Created:' as info,
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

-- Check referrer's earnings
SELECT 
  'Referrer Earnings:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Check referral stats
SELECT 
  'Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
