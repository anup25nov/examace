-- Check the actual structure of the memberships table
-- This will help us understand what columns exist

-- Step 1: Check memberships table structure
SELECT '=== MEMBERSHIPS TABLE STRUCTURE ===' as step;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'memberships' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check memberships table data
SELECT '=== MEMBERSHIPS TABLE DATA ===' as step;

SELECT 
  'Memberships data:' as info,
  *
FROM memberships 
WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 3: Check referral_codes table
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

-- Step 4: Check referral_commissions table
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

-- Step 5: Check referral_transactions table
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

-- Step 6: Test referral stats function
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
