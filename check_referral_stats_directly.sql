-- Check referral stats directly to see what's showing
-- This will help us understand why the stats might not be updating

-- Step 1: Check referral_codes table directly
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

-- Step 5: Manual calculation of what the stats should be
SELECT '=== MANUAL CALCULATION ===' as step;

SELECT 
  'Manual calculation:' as info,
  COUNT(*) as total_referrals,
  SUM(commission_amount) as total_commissions_earned,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';
