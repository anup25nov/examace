-- Check if commission was actually created and why stats show 0.00
-- This will help us understand why the referral stats are not updating

-- Step 1: Check if commission was created
SELECT '=== COMMISSION RECORDS ===' as step;

SELECT 
  'All Commissions:' as info,
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

-- Step 2: Check specific commission for the user
SELECT '=== COMMISSION FOR SPECIFIC USER ===' as step;

SELECT 
  'Commission for user b2975c5b-c04b-4929-b8ac-9f3da1b155b8:' as info,
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
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 3: Check referrer's earnings in referral_codes table
SELECT '=== REFERRER EARNINGS IN REFERRAL_CODES ===' as step;

SELECT 
  'Referrer earnings:' as info,
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

-- Step 4: Check referral transaction after update
SELECT '=== REFERRAL TRANSACTION AFTER UPDATE ===' as step;

SELECT 
  'Referral transaction:' as info,
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
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 5: Test the referral stats function manually
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

-- Test get_comprehensive_referral_stats function
SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 6: Check if there are any other referral transactions for this referrer
SELECT '=== ALL REFERRAL TRANSACTIONS FOR REFERRER ===' as step;

SELECT 
  'All referral transactions for referrer:' as info,
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
