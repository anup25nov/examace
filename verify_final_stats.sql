-- Verify that all referral stats are now showing correctly
-- This should show the updated earnings and stats

-- Step 1: Check referral_codes table
SELECT '=== REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Referral codes table:' as info,
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

-- Step 2: Check comprehensive referral stats
SELECT '=== COMPREHENSIVE REFERRAL STATS ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 3: Check user referral stats
SELECT '=== USER REFERRAL STATS ===' as step;

SELECT 
  'User Referral Stats:' as info,
  *
FROM get_user_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 4: Check all commissions
SELECT '=== ALL COMMISSIONS ===' as step;

SELECT 
  'All commissions:' as info,
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

-- Step 5: Check referral transactions
SELECT '=== REFERRAL TRANSACTIONS ===' as step;

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
