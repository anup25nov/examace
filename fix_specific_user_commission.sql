-- Fix commission for the specific user who purchased membership
-- This will manually process the commission and update all related records

-- Step 1: Check current state
SELECT '=== CURRENT STATE ===' as step;

-- Check referral transaction
SELECT 
  'Referral Transaction:' as table_name,
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
  first_membership_only
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check payments
SELECT 
  'Payments:' as table_name,
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Check memberships
SELECT 
  'Memberships:' as table_name,
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 2: Manually process the commission
SELECT '=== PROCESSING COMMISSION ===' as step;

-- Get the latest payment for this user
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
-- Process commission using the function
SELECT 
  'Commission Processing Result:' as result,
  *
FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- Step 3: Check state after processing
SELECT '=== STATE AFTER PROCESSING ===' as step;

-- Check referral transaction after processing
SELECT 
  'Referral Transaction After:' as table_name,
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
  first_membership_only
FROM referral_transactions 
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Check if commission was created
SELECT 
  'Referral Commissions:' as table_name,
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
  'Referrer Earnings:' as table_name,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 4: Test the referral stats functions
SELECT '=== TESTING REFERRAL STATS ===' as step;

-- Test get_comprehensive_referral_stats
SELECT 
  'Comprehensive Stats:' as function_name,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Test get_referral_network_detailed
SELECT 
  'Network Detailed:' as function_name,
  *
FROM get_referral_network_detailed('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Test get_user_referral_stats
SELECT 
  'User Referral Stats:' as function_name,
  *
FROM get_user_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
