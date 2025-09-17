-- Check for users who made payments but don't have referral transactions
-- This will help us understand if there are missing referral connections

-- Step 1: Find users who made payments but don't have referral transactions
SELECT '=== USERS WITH PAYMENTS BUT NO REFERRAL TRANSACTIONS ===' as step;

SELECT 
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at as payment_date,
  rt.id as referral_id,
  CASE WHEN rt.id IS NULL THEN 'NO REFERRAL TRANSACTION' ELSE 'HAS REFERRAL TRANSACTION' END as referral_status
FROM payments p
LEFT JOIN referral_transactions rt ON p.user_id = rt.referred_id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Step 2: Find users who have referral transactions but no payments
SELECT '=== USERS WITH REFERRAL TRANSACTIONS BUT NO PAYMENTS ===' as step;

SELECT 
  rt.referred_id,
  rt.referrer_id,
  rt.referral_code,
  rt.status,
  rt.created_at as referral_date,
  p.id as payment_id,
  CASE WHEN p.id IS NULL THEN 'NO PAYMENT' ELSE 'HAS PAYMENT' END as payment_status
FROM referral_transactions rt
LEFT JOIN payments p ON rt.referred_id = p.user_id AND p.status IN ('verified', 'paid', 'completed')
ORDER BY rt.created_at DESC;

-- Step 3: Check the most recent referral transaction
SELECT '=== MOST RECENT REFERRAL TRANSACTION ===' as step;

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
LIMIT 1;

-- Step 4: Check if the most recent referral user has any payments
SELECT '=== PAYMENTS FOR MOST RECENT REFERRAL USER ===' as step;

WITH most_recent_referral AS (
  SELECT referred_id FROM referral_transactions ORDER BY created_at DESC LIMIT 1
)
SELECT 
  p.id,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at
FROM payments p
WHERE p.user_id = (SELECT referred_id FROM most_recent_referral)
AND p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Step 5: Check the most recent payment
SELECT '=== MOST RECENT PAYMENT ===' as step;

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
LIMIT 1;

-- Step 6: Check if the most recent payment user has any referral transactions
SELECT '=== REFERRAL TRANSACTIONS FOR MOST RECENT PAYMENT USER ===' as step;

WITH most_recent_payment AS (
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
WHERE rt.referred_id = (SELECT user_id FROM most_recent_payment)
ORDER BY rt.created_at DESC;
