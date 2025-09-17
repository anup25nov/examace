-- Debug the exact status of referral transactions
-- This will help us see why the commission function can't find them

-- Step 1: Check all referral transactions with their exact status
SELECT '=== ALL REFERRAL TRANSACTIONS WITH STATUS ===' as step;

SELECT 
  'All Referral Transactions:' as info,
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
ORDER BY created_at DESC;

-- Step 2: Check specifically for pending referrals
SELECT '=== PENDING REFERRAL TRANSACTIONS ===' as step;

SELECT 
  'Pending Referral Transactions:' as info,
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
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Step 3: Check the exact query the commission function uses
SELECT '=== COMMISSION FUNCTION QUERY TEST ===' as step;

-- This is the exact query the commission function uses
WITH latest_payment AS (
  SELECT 
    user_id,
    id as payment_id,
    plan,
    amount
  FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Function Query Test:' as info,
  lp.user_id as payment_user_id,
  rt.id as referral_id,
  rt.referred_id,
  rt.status as referral_status,
  rt.membership_purchased,
  CASE 
    WHEN rt.referred_id = lp.user_id AND rt.status = 'pending' THEN 'SHOULD MATCH'
    WHEN rt.referred_id = lp.user_id AND rt.status != 'pending' THEN 'USER MATCHES BUT STATUS NOT PENDING'
    WHEN rt.referred_id != lp.user_id AND rt.status = 'pending' THEN 'STATUS PENDING BUT USER DOES NOT MATCH'
    ELSE 'NO MATCH'
  END as match_status
FROM latest_payment lp
LEFT JOIN referral_transactions rt ON rt.referred_id = lp.user_id
ORDER BY rt.created_at DESC;

-- Step 4: Check if there are any referral transactions for the latest payment user
SELECT '=== REFERRAL TRANSACTIONS FOR LATEST PAYMENT USER ===' as step;

WITH latest_payment AS (
  SELECT 
    user_id,
    id as payment_id,
    plan,
    amount
  FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Referral Transactions for Latest Payment User:' as info,
  rt.id,
  rt.referrer_id,
  rt.referred_id,
  rt.referral_code,
  rt.amount,
  rt.transaction_type,
  rt.status,
  rt.commission_amount,
  rt.commission_status,
  rt.membership_purchased,
  rt.first_membership_only,
  rt.created_at
FROM referral_transactions rt
WHERE rt.referred_id = (SELECT user_id FROM latest_payment)
ORDER BY rt.created_at DESC;

-- Step 5: Check the exact data types and values
SELECT '=== DATA TYPE AND VALUE CHECK ===' as step;

WITH latest_payment AS (
  SELECT 
    user_id,
    id as payment_id,
    plan,
    amount
  FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Data Type Check:' as info,
  'Payment User ID' as field_name,
  lp.user_id as value,
  pg_typeof(lp.user_id) as data_type
FROM latest_payment lp
UNION ALL
SELECT 
  'Data Type Check:' as info,
  'Referral Referred ID' as field_name,
  rt.referred_id as value,
  pg_typeof(rt.referred_id) as data_type
FROM referral_transactions rt
WHERE rt.referred_id = (SELECT user_id FROM latest_payment)
LIMIT 1;

-- Step 6: Test the commission function with debug output
SELECT '=== COMMISSION FUNCTION WITH DEBUG ===' as step;

-- Test the commission function with the latest payment
WITH latest_payment AS (
  SELECT 
    user_id,
    id as payment_id,
    plan,
    amount
  FROM payments 
  WHERE status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  'Commission Function Test with Debug:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM latest_payment),
  (SELECT payment_id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);
