-- Comprehensive debugging script for new user referral flow
-- This will help us identify exactly where the issue is

-- Step 1: Check all recent users and their referral relationships
SELECT '=== RECENT USERS AND REFERRALS ===' as step;

-- Get all users created in the last 24 hours
SELECT 
  'Recent Users:' as info,
  id,
  phone,
  created_at,
  membership_plan,
  membership_status
FROM user_profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get all referral transactions created in the last 24 hours
SELECT 
  'Recent Referral Transactions:' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get all payments created in the last 24 hours
SELECT 
  'Recent Payments:' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get all memberships created in the last 24 hours
SELECT 
  'Recent Memberships:' as info,
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get all referral commissions created in the last 24 hours
SELECT 
  'Recent Referral Commissions:' as info,
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
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Step 2: Check referral codes
SELECT '=== REFERRAL CODES ===' as step;

-- Get all referral codes
SELECT 
  'All Referral Codes:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
ORDER BY created_at DESC;

-- Step 3: Test commission processing for recent users
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

-- Test commission processing for each recent user with payments
WITH recent_users_with_payments AS (
  SELECT DISTINCT p.user_id
  FROM payments p
  WHERE p.created_at > NOW() - INTERVAL '24 hours'
  AND p.status IN ('verified', 'paid', 'completed')
)
SELECT 
  'Commission Status for Recent Users:' as info,
  rup.user_id,
  cs.*
FROM recent_users_with_payments rup
CROSS JOIN LATERAL check_commission_status(rup.user_id) cs;

-- Step 4: Check if there are any errors in the process
SELECT '=== ERROR CHECKING ===' as step;

-- Check for users with payments but no commissions
SELECT 
  'Users with Payments but No Commissions:' as info,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at as payment_date,
  CASE WHEN rc.id IS NULL THEN 'NO COMMISSION' ELSE 'HAS COMMISSION' END as commission_status
FROM payments p
LEFT JOIN referral_commissions rc ON p.user_id = rc.referred_id
WHERE p.created_at > NOW() - INTERVAL '24 hours'
AND p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Check for users with referral transactions but no commissions
SELECT 
  'Users with Referral Transactions but No Commissions:' as info,
  rt.referred_id,
  rt.referrer_id,
  rt.referral_code,
  rt.status as referral_status,
  rt.membership_purchased,
  CASE WHEN rc.id IS NULL THEN 'NO COMMISSION' ELSE 'HAS COMMISSION' END as commission_status
FROM referral_transactions rt
LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
WHERE rt.created_at > NOW() - INTERVAL '24 hours'
ORDER BY rt.created_at DESC;

-- Step 5: Test the commission function with recent data
SELECT '=== TESTING COMMISSION FUNCTION ===' as step;

-- Test commission processing for the most recent user with payment
WITH latest_user_with_payment AS (
  SELECT 
    p.user_id,
    p.id as payment_id,
    p.plan,
    p.amount
  FROM payments p
  WHERE p.created_at > NOW() - INTERVAL '24 hours'
  AND p.status IN ('verified', 'paid', 'completed')
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Function Test:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM latest_user_with_payment),
  (SELECT payment_id FROM latest_user_with_payment),
  (SELECT plan FROM latest_user_with_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_user_with_payment)
);

-- Step 6: Check referral stats for recent referrers
SELECT '=== REFERRAL STATS FOR RECENT REFERRERS ===' as step;

-- Get referral stats for users who have made referrals in the last 24 hours
WITH recent_referrers AS (
  SELECT DISTINCT rt.referrer_id
  FROM referral_transactions rt
  WHERE rt.created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  'Referral Stats for Recent Referrers:' as info,
  rr.referrer_id,
  gcs.*
FROM recent_referrers rr
CROSS JOIN LATERAL get_comprehensive_referral_stats(rr.referrer_id) gcs;
