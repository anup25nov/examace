-- Final diagnosis to understand the complete disconnect
-- This will show us exactly what's happening with the data

-- Step 1: Show all users with their creation dates
SELECT '=== ALL USERS WITH DATES ===' as step;
SELECT 
  id,
  phone,
  created_at,
  membership_plan,
  membership_status
FROM user_profiles 
ORDER BY created_at DESC;

-- Step 2: Show all referral transactions with details
SELECT '=== ALL REFERRAL TRANSACTIONS WITH DETAILS ===' as step;
SELECT 
  id,
  referrer_id,
  referred_id,
  referral_code,
  status,
  membership_purchased,
  created_at
FROM referral_transactions 
ORDER BY created_at DESC;

-- Step 3: Show all payments with details
SELECT '=== ALL PAYMENTS WITH DETAILS ===' as step;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
WHERE status IN ('verified', 'paid', 'completed')
ORDER BY created_at DESC;

-- Step 4: Check if any referral transactions have matching users
SELECT '=== REFERRAL TRANSACTIONS WITH MATCHING USERS ===' as step;
SELECT 
  rt.id as referral_id,
  rt.referred_id,
  rt.status as referral_status,
  rt.created_at as referral_date,
  up.id as user_id,
  up.phone,
  up.created_at as user_date,
  CASE WHEN up.id IS NULL THEN 'USER NOT FOUND' ELSE 'USER EXISTS' END as user_status
FROM referral_transactions rt
LEFT JOIN user_profiles up ON rt.referred_id = up.id
ORDER BY rt.created_at DESC;

-- Step 5: Check if any payments have matching users
SELECT '=== PAYMENTS WITH MATCHING USERS ===' as step;
SELECT 
  p.id as payment_id,
  p.user_id,
  p.plan,
  p.amount,
  p.status as payment_status,
  p.created_at as payment_date,
  up.id as user_id,
  up.phone,
  up.created_at as user_date,
  CASE WHEN up.id IS NULL THEN 'USER NOT FOUND' ELSE 'USER EXISTS' END as user_status
FROM payments p
LEFT JOIN user_profiles up ON p.user_id = up.id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Step 6: Find the exact mismatch
SELECT '=== EXACT MISMATCH ANALYSIS ===' as step;

-- Check if there are any users who appear in both referral transactions and payments
SELECT 
  'Users in Referral Transactions:' as info,
  COUNT(DISTINCT referred_id) as count
FROM referral_transactions
UNION ALL
SELECT 
  'Users in Payments:' as info,
  COUNT(DISTINCT user_id) as count
FROM payments
WHERE status IN ('verified', 'paid', 'completed')
UNION ALL
SELECT 
  'Users in Both:' as info,
  COUNT(DISTINCT rt.referred_id) as count
FROM referral_transactions rt
INNER JOIN payments p ON rt.referred_id = p.user_id
WHERE p.status IN ('verified', 'paid', 'completed');

-- Step 7: Check the most recent data
SELECT '=== MOST RECENT DATA ===' as step;

-- Most recent referral transaction
SELECT 
  'Most Recent Referral Transaction:' as info,
  id,
  referrer_id,
  referred_id,
  referral_code,
  status,
  created_at
FROM referral_transactions 
ORDER BY created_at DESC
LIMIT 1;

-- Most recent payment
SELECT 
  'Most Recent Payment:' as info,
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

-- Step 8: Check if the referral code owner has any payments
SELECT '=== REFERRAL CODE OWNER PAYMENTS ===' as step;
SELECT 
  p.id,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at
FROM payments p
WHERE p.user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
AND p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;
