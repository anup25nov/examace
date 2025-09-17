-- Simple debug script to see the exact data
-- This will show us step by step what's happening

-- Step 1: Show all referral transactions
SELECT '=== ALL REFERRAL TRANSACTIONS ===' as step;
SELECT 
  id,
  referrer_id,
  referred_id,
  referral_code,
  status,
  membership_purchased,
  created_at
FROM referral_transactions 
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Show all payments
SELECT '=== ALL PAYMENTS ===' as step;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Show the latest payment user
SELECT '=== LATEST PAYMENT USER ===' as step;
SELECT 
  user_id,
  id as payment_id,
  plan,
  amount
FROM payments 
WHERE status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC
LIMIT 1;

-- Step 4: Check if there are any referral transactions for the latest payment user
SELECT '=== REFERRAL TRANSACTIONS FOR LATEST PAYMENT USER ===' as step;
WITH latest_payment AS (
  SELECT user_id FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  rt.id,
  rt.referrer_id,
  rt.referred_id,
  rt.referral_code,
  rt.status,
  rt.membership_purchased,
  rt.created_at
FROM referral_transactions rt
WHERE rt.referred_id = (SELECT user_id FROM latest_payment);

-- Step 5: Check specifically for pending referrals for the latest payment user
SELECT '=== PENDING REFERRAL TRANSACTIONS FOR LATEST PAYMENT USER ===' as step;
WITH latest_payment AS (
  SELECT user_id FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  rt.id,
  rt.referrer_id,
  rt.referred_id,
  rt.referral_code,
  rt.status,
  rt.membership_purchased,
  rt.created_at
FROM referral_transactions rt
WHERE rt.referred_id = (SELECT user_id FROM latest_payment)
AND rt.status = 'pending';
