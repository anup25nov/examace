-- Debug why the referral stats function isn't showing the correct data
-- The manual calculation shows 0.50 but the function might not be working

-- Step 1: Check referral_codes table directly
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

-- Step 2: Check if the update actually worked
SELECT '=== CHECKING IF UPDATE WORKED ===' as step;

SELECT 
  'Total earnings from commissions:' as info,
  SUM(commission_amount) as total_commission_amount
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 3: Test the referral stats function step by step
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

-- Test get_comprehensive_referral_stats
SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

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

-- Step 5: Check if there's a mismatch in the function
SELECT '=== CHECKING FUNCTION LOGIC ===' as step;

-- Check what the function should be reading from
SELECT 
  'Referral codes for function:' as info,
  total_earnings,
  total_referrals
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Check commissions for function
SELECT 
  'Commissions for function:' as info,
  COUNT(*) as commission_count,
  SUM(commission_amount) as total_commission_amount
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';
