-- Step-by-step test script for referral flow (FIXED VERSION)
-- Run this after each step to see what's happening

-- Step 1: Check if you have a referral code
SELECT '=== STEP 1: CHECK REFERRAL CODES ===' as step;

-- Get all referral codes
SELECT 
  'Your Referral Codes:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at
FROM referral_codes 
ORDER BY created_at DESC;

-- Step 2: Check if you have any referral transactions
SELECT '=== STEP 2: CHECK REFERRAL TRANSACTIONS ===' as step;

-- Get all referral transactions
SELECT 
  'Referral Transactions:' as info,
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
ORDER BY created_at DESC;

-- Step 3: Check if you have any payments
SELECT '=== STEP 3: CHECK PAYMENTS ===' as step;

-- Get all payments
SELECT 
  'Payments:' as info,
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
ORDER BY created_at DESC;

-- Step 4: Check if you have any memberships
SELECT '=== STEP 4: CHECK MEMBERSHIPS ===' as step;

-- Get all memberships (without status column)
SELECT 
  'Memberships:' as info,
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
ORDER BY created_at DESC;

-- Step 5: Check if you have any commissions
SELECT '=== STEP 5: CHECK COMMISSIONS ===' as step;

-- Get all commissions
SELECT 
  'Commissions:' as info,
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
ORDER BY created_at DESC;

-- Step 6: Test commission processing for the most recent user
SELECT '=== STEP 6: TEST COMMISSION PROCESSING ===' as step;

-- Test commission processing for the most recent user with payment
WITH latest_user_with_payment AS (
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
  'Commission Processing Test:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM latest_user_with_payment),
  (SELECT payment_id FROM latest_user_with_payment),
  (SELECT plan FROM latest_user_with_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_user_with_payment)
);

-- Step 7: Check referral stats
SELECT '=== STEP 7: CHECK REFERRAL STATS ===' as step;

-- Get referral stats for the most recent referrer
WITH latest_referrer AS (
  SELECT rt.referrer_id
  FROM referral_transactions rt
  ORDER BY rt.created_at DESC
  LIMIT 1
)
SELECT 
  'Referral Stats:' as info,
  gcs.*
FROM latest_referrer lr
CROSS JOIN LATERAL get_comprehensive_referral_stats(lr.referrer_id) gcs;
