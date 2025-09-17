-- Check the referral_codes table specifically
-- This will show us if the table was updated correctly

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

-- Step 2: Check if the update worked
SELECT '=== CHECKING IF UPDATE WORKED ===' as step;

SELECT 
  'Total earnings from commissions:' as info,
  SUM(commission_amount) as total_commission_amount
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 3: Force update referral_codes table
SELECT '=== FORCE UPDATE REFERRAL_CODES ===' as step;

UPDATE referral_codes
SET 
  total_earnings = (
    SELECT COALESCE(SUM(commission_amount), 0.00)
    FROM referral_commissions 
    WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
  ),
  updated_at = NOW()
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 4: Check updated referral_codes table
SELECT '=== UPDATED REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Updated referral_codes:' as info,
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

-- Step 5: Test referral stats function
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
