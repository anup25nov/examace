-- Comprehensive diagnosis of the referral and payment system
-- This will help us understand the complete picture

-- Step 1: Check all users in the system
SELECT '=== ALL USERS IN SYSTEM ===' as step;
SELECT 
  id,
  phone,
  created_at,
  membership_plan,
  membership_status
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check all referral transactions
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
ORDER BY created_at DESC;

-- Step 3: Check all payments
SELECT '=== ALL PAYMENTS ===' as step;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
ORDER BY created_at DESC;

-- Step 4: Check all memberships
SELECT '=== ALL MEMBERSHIPS ===' as step;
SELECT 
  id,
  user_id,
  plan,
  start_date,
  end_date,
  created_at
FROM memberships 
ORDER BY created_at DESC;

-- Step 5: Check all commissions
SELECT '=== ALL COMMISSIONS ===' as step;
SELECT 
  id,
  referrer_id,
  referred_id,
  payment_id,
  commission_amount,
  status,
  created_at
FROM referral_commissions 
ORDER BY created_at DESC;

-- Step 6: Find users who have payments but no referral transactions
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

-- Step 7: Find users who have referral transactions but no payments
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

-- Step 8: Check if there are any users who have both payments and referral transactions
SELECT '=== USERS WITH BOTH PAYMENTS AND REFERRAL TRANSACTIONS ===' as step;
SELECT 
  p.user_id,
  p.plan,
  p.amount,
  p.status as payment_status,
  p.created_at as payment_date,
  rt.id as referral_id,
  rt.status as referral_status,
  rt.membership_purchased,
  rt.created_at as referral_date
FROM payments p
INNER JOIN referral_transactions rt ON p.user_id = rt.referred_id
WHERE p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;

-- Step 9: Check the referral code owner
SELECT '=== REFERRAL CODE OWNER ===' as step;
SELECT 
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at
FROM referral_codes 
WHERE code = 'AD1CFF7D';

-- Step 10: Check if the referral code owner has any payments
SELECT '=== PAYMENTS FOR REFERRAL CODE OWNER ===' as step;
SELECT 
  p.id,
  p.user_id,
  p.plan,
  p.amount,
  p.status,
  p.created_at
FROM payments p
WHERE p.user_id = (SELECT user_id FROM referral_codes WHERE code = 'AD1CFF7D')
AND p.status IN ('verified', 'paid', 'completed')
ORDER BY p.created_at DESC;
