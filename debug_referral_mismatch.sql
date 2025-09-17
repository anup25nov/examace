-- Debug why the commission function can't find referrals
-- This will help us identify the exact mismatch

-- Step 1: Check all referral transactions and their status
SELECT '=== ALL REFERRAL TRANSACTIONS ===' as step;

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
  created_at
FROM referral_transactions 
ORDER BY created_at DESC;

-- Step 2: Check all payments and their users
SELECT '=== ALL PAYMENTS ===' as step;

SELECT 
  'All Payments:' as info,
  id,
  user_id,
  plan,
  amount,
  status,
  razorpay_payment_id,
  created_at,
  paid_at
FROM payments 
WHERE status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC;

-- Step 3: Check if there's a mismatch between referral transactions and payments
SELECT '=== REFERRAL TRANSACTION vs PAYMENT MATCH ===' as step;

SELECT 
  'Referral vs Payment Match:' as info,
  rt.id as referral_id,
  rt.referred_id,
  rt.status as referral_status,
  rt.membership_purchased,
  p.id as payment_id,
  p.user_id as payment_user_id,
  p.status as payment_status,
  p.plan as payment_plan,
  p.amount as payment_amount,
  CASE 
    WHEN rt.referred_id = p.user_id THEN 'MATCH' 
    ELSE 'NO MATCH' 
  END as user_match
FROM referral_transactions rt
LEFT JOIN payments p ON rt.referred_id = p.user_id AND p.status IN ('verified', 'paid', 'completed')
ORDER BY rt.created_at DESC;

-- Step 4: Check specific users who have payments but no matching referrals
SELECT '=== USERS WITH PAYMENTS BUT NO MATCHING REFERRALS ===' as step;

SELECT 
  'Users with Payments but No Matching Referrals:' as info,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at as payment_date,
  rt.id as referral_id,
  rt.status as referral_status,
  CASE WHEN rt.id IS NULL THEN 'NO REFERRAL TRANSACTION' ELSE 'HAS REFERRAL TRANSACTION' END as referral_status
FROM payments p
LEFT JOIN referral_transactions rt ON p.user_id = rt.referred_id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Step 5: Test the commission function with specific data
SELECT '=== TESTING COMMISSION FUNCTION WITH SPECIFIC DATA ===' as step;

-- Test with the most recent payment
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
  'Testing with Latest Payment:' as info,
  lp.*,
  rt.id as referral_transaction_id,
  rt.status as referral_status,
  rt.membership_purchased
FROM latest_payment lp
LEFT JOIN referral_transactions rt ON lp.user_id = rt.referred_id;

-- Step 6: Test commission function with the latest payment
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
  'Commission Function Test with Latest Payment:' as info,
  *
FROM process_membership_commission(
  (SELECT user_id FROM latest_payment),
  (SELECT payment_id FROM latest_payment),
  (SELECT plan FROM latest_payment),
  (SELECT amount::DECIMAL(10,2) FROM latest_payment)
);
