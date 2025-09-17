-- Simple diagnosis to understand the current state
-- This will show us what's actually in the database

-- Step 1: Count all records
SELECT '=== RECORD COUNTS ===' as step;
SELECT 
  'User Profiles:' as table_name,
  COUNT(*) as count
FROM user_profiles
UNION ALL
SELECT 
  'Referral Codes:' as table_name,
  COUNT(*) as count
FROM referral_codes
UNION ALL
SELECT 
  'Referral Transactions:' as table_name,
  COUNT(*) as count
FROM referral_transactions
UNION ALL
SELECT 
  'Payments:' as table_name,
  COUNT(*) as count
FROM payments
UNION ALL
SELECT 
  'Memberships:' as table_name,
  COUNT(*) as count
FROM memberships
UNION ALL
SELECT 
  'Referral Commissions:' as table_name,
  COUNT(*) as count
FROM referral_commissions;

-- Step 2: Show recent users
SELECT '=== RECENT USERS ===' as step;
SELECT 
  id,
  phone,
  created_at,
  membership_plan
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Show recent payments
SELECT '=== RECENT PAYMENTS ===' as step;
SELECT 
  id,
  user_id,
  plan,
  amount,
  status,
  created_at
FROM payments 
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Show recent referral transactions
SELECT '=== RECENT REFERRAL TRANSACTIONS ===' as step;
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

-- Step 5: Check if there are any users with both payments and referral transactions
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

-- Step 6: Check the referral code owner
SELECT '=== REFERRAL CODE OWNER ===' as step;
SELECT 
  rc.id,
  rc.user_id,
  rc.code,
  rc.total_referrals,
  rc.total_earnings,
  rc.is_active,
  up.phone,
  up.created_at as user_created_at
FROM referral_codes rc
LEFT JOIN user_profiles up ON rc.user_id = up.id
WHERE rc.code = 'AD1CFF7D';
