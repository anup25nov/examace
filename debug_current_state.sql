-- Comprehensive debug script to understand current state
-- This will help us identify exactly what's happening

-- 1. Check the specific user's referral transaction
SELECT '=== REFERRAL TRANSACTION ===' as section;
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

-- 2. Check payments for this user
SELECT '=== PAYMENTS ===' as section;
SELECT 
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  razorpay_payment_id,
  razorpay_order_id,
  created_at,
  paid_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- 3. Check memberships for this user
SELECT '=== MEMBERSHIPS ===' as section;
SELECT 
  id,
  user_id,
  plan,
  start_date,
  end_date,
  status,
  created_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- 4. Check if any commission records exist
SELECT '=== REFERRAL COMMISSIONS ===' as section;
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
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
OR referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- 5. Check referrer's referral code and earnings
SELECT '=== REFERRER INFO ===' as section;
SELECT 
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

-- 6. Test the commission function with actual data
SELECT '=== COMMISSION FUNCTION TEST ===' as section;
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
  'Function Test Result:' as test_type,
  *
FROM process_membership_commission(
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'::UUID,
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- 7. Check what the referral stats functions return
SELECT '=== REFERRAL STATS FUNCTIONS ===' as section;

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
