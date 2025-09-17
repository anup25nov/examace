-- Fix referral network data display
-- The network shows the user but with wrong amounts and status

-- Step 1: Check current referral_codes table
SELECT '=== REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Referral codes:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active,
  created_at,
  updated_at
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 2: Check referral_commissions table
SELECT '=== REFERRAL_COMMISSIONS TABLE ===' as step;

SELECT 
  'Referral commissions:' as info,
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
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
ORDER BY created_at DESC;

-- Step 3: Check referral_transactions table
SELECT '=== REFERRAL_TRANSACTIONS TABLE ===' as step;

SELECT 
  'Referral transactions:' as info,
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
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
ORDER BY created_at DESC;

-- Step 4: Check memberships table
SELECT '=== MEMBERSHIPS TABLE ===' as step;

SELECT 
  'Memberships:' as info,
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  created_at,
  expires_at
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 5: Check payments table
SELECT '=== PAYMENTS TABLE ===' as step;

SELECT 
  'Payments:' as info,
  id,
  user_id,
  plan,
  amount,
  currency,
  status,
  razorpay_payment_id,
  created_at
FROM payments 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 6: Test referral stats function
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 7: Check what the referral network function should be reading
SELECT '=== MANUAL REFERRAL NETWORK DATA ===' as step;

SELECT 
  'Manual referral network data:' as info,
  rt.referred_id,
  up.phone,
  rt.created_at as signup_date,
  rt.status as referral_status,
  rc.status as commission_status,
  rc.commission_amount,
  rc.membership_plan,
  rc.membership_amount,
  rc.is_first_membership,
  m.created_at as membership_date
FROM referral_transactions rt
LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
LEFT JOIN user_profiles up ON rt.referred_id = up.id
LEFT JOIN memberships m ON rt.referred_id = m.user_id
WHERE rt.referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
ORDER BY rt.created_at DESC;
