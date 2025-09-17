-- Debug why commissions are not being processed
-- This will help us identify the exact issue

-- Step 1: Check the most recent referral transaction
SELECT '=== MOST RECENT REFERRAL TRANSACTION ===' as step;

SELECT 
  'Most Recent Referral Transaction:' as info,
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
ORDER BY created_at DESC
LIMIT 1;

-- Step 2: Check if the referred user has any payments
SELECT '=== CHECKING PAYMENTS FOR REFERRED USER ===' as step;

WITH most_recent_referral AS (
  SELECT referred_id
  FROM referral_transactions 
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Payments for Referred User:' as info,
  p.id,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.razorpay_payment_id,
  p.created_at,
  p.paid_at
FROM payments p
WHERE p.user_id = (SELECT referred_id FROM most_recent_referral)
ORDER BY p.created_at DESC;

-- Step 3: Check if the referred user has any memberships
SELECT '=== CHECKING MEMBERSHIPS FOR REFERRED USER ===' as step;

WITH most_recent_referral AS (
  SELECT referred_id
  FROM referral_transactions 
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Memberships for Referred User:' as info,
  m.id,
  m.user_id,
  m.plan,
  m.start_date,
  m.end_date,
  m.created_at
FROM memberships m
WHERE m.user_id = (SELECT referred_id FROM most_recent_referral)
ORDER BY m.created_at DESC;

-- Step 4: Check if there are any commissions for the referred user
SELECT '=== CHECKING COMMISSIONS FOR REFERRED USER ===' as step;

WITH most_recent_referral AS (
  SELECT referred_id
  FROM referral_transactions 
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Commissions for Referred User:' as info,
  rc.id,
  rc.referrer_id,
  rc.referred_id,
  rc.payment_id,
  rc.commission_amount,
  rc.commission_percentage,
  rc.membership_plan,
  rc.membership_amount,
  rc.status,
  rc.is_first_membership,
  rc.created_at
FROM referral_commissions rc
WHERE rc.referred_id = (SELECT referred_id FROM most_recent_referral);

-- Step 5: Test commission processing for the most recent referral
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

WITH most_recent_referral AS (
  SELECT 
    rt.referred_id,
    rt.referrer_id
  FROM referral_transactions rt
  ORDER BY rt.created_at DESC
  LIMIT 1
),
latest_payment AS (
  SELECT 
    p.id,
    p.plan,
    p.amount
  FROM payments p
  WHERE p.user_id = (SELECT referred_id FROM most_recent_referral)
  AND p.status IN ('verified', 'paid', 'completed')
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Processing Test:' as info,
  *
FROM process_membership_commission(
  (SELECT referred_id FROM most_recent_referral),
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- Step 6: Check all users with payments but no commissions
SELECT '=== USERS WITH PAYMENTS BUT NO COMMISSIONS ===' as step;

SELECT 
  'Users with Payments but No Commissions:' as info,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at as payment_date,
  CASE WHEN rc.id IS NULL THEN 'NO COMMISSION' ELSE 'HAS COMMISSION' END as commission_status,
  rt.referrer_id,
  rt.status as referral_status
FROM payments p
LEFT JOIN referral_commissions rc ON p.user_id = rc.referred_id
LEFT JOIN referral_transactions rt ON p.user_id = rt.referred_id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 7: Check the commission function directly
SELECT '=== TESTING COMMISSION FUNCTION DIRECTLY ===' as step;

-- Test with a specific user who has a payment
WITH user_with_payment AS (
  SELECT 
    p.user_id,
    p.id as payment_id,
    p.plan,
    p.amount
  FROM payments p
  WHERE p.status IN ('verified', 'paid', 'completed')
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  'Direct Commission Function Test:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM user_with_payment),
  (SELECT payment_id FROM user_with_payment),
  (SELECT plan FROM user_with_payment),
  (SELECT amount::DECIMAL(10,2) FROM user_with_payment)
);