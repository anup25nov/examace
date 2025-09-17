-- Real-time monitoring script for referral flow
-- Run this to monitor what happens during a payment

-- Step 1: Get the most recent user data
SELECT '=== MOST RECENT USER DATA ===' as step;

-- Get the most recent user
WITH most_recent_user AS (
  SELECT 
    up.id,
    up.phone,
    up.created_at,
    up.membership_plan,
    up.membership_status
  FROM user_profiles up
  ORDER BY up.created_at DESC
  LIMIT 1
)
SELECT 
  'Most Recent User:' as info,
  *
FROM most_recent_user;

-- Step 2: Check referral relationship for the most recent user
SELECT '=== REFERRAL RELATIONSHIP ===' as step;

-- Get referral transaction for the most recent user
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'Referral Transaction:' as info,
  rt.*
FROM referral_transactions rt
WHERE rt.referred_id = (SELECT id FROM most_recent_user);

-- Step 3: Check payments for the most recent user
SELECT '=== PAYMENTS ===' as step;

-- Get payments for the most recent user
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'Payments:' as info,
  p.*
FROM payments p
WHERE p.user_id = (SELECT id FROM most_recent_user)
ORDER BY p.created_at DESC;

-- Step 4: Check memberships for the most recent user
SELECT '=== MEMBERSHIPS ===' as step;

-- Get memberships for the most recent user
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'Memberships:' as info,
  m.id,
  m.user_id,
  m.plan,
  m.start_date,
  m.end_date,
  m.created_at
FROM memberships m
WHERE m.user_id = (SELECT id FROM most_recent_user)
ORDER BY m.created_at DESC;

-- Step 5: Check commissions for the most recent user
SELECT '=== COMMISSIONS ===' as step;

-- Get commissions for the most recent user
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
)
SELECT 
  'Commissions:' as info,
  rc.*
FROM referral_commissions rc
WHERE rc.referred_id = (SELECT id FROM most_recent_user);

-- Step 6: Test commission processing for the most recent user
SELECT '=== TESTING COMMISSION PROCESSING ===' as step;

-- Test commission processing for the most recent user
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
),
latest_payment AS (
  SELECT 
    id,
    plan,
    amount
  FROM payments p
  WHERE p.user_id = (SELECT id FROM most_recent_user)
  AND p.status IN ('verified', 'paid', 'completed')
  ORDER BY p.created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Processing Test:' as info,
  *
FROM process_membership_commission(
  (SELECT id FROM most_recent_user),
  (SELECT id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);

-- Step 7: Check referrer's stats
SELECT '=== REFERRER STATS ===' as step;

-- Get referrer stats for the most recent user's referrer
WITH most_recent_user AS (
  SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1
),
referrer_id AS (
  SELECT rt.referrer_id
  FROM referral_transactions rt
  WHERE rt.referred_id = (SELECT id FROM most_recent_user)
  LIMIT 1
)
SELECT 
  'Referrer Stats:' as info,
  gcs.*
FROM referrer_id ri
CROSS JOIN LATERAL get_comprehensive_referral_stats(ri.referrer_id) gcs;
