-- Fix referral_codes table to show correct earnings
-- The commission was created but referral_codes table wasn't updated

-- Step 1: Check current referral_codes table
SELECT '=== CURRENT REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Current referral_codes:' as info,
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

-- Step 2: Calculate correct total earnings from commissions
SELECT '=== CALCULATING CORRECT EARNINGS ===' as step;

SELECT 
  'Correct earnings calculation:' as info,
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_commission_amount,
  SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 3: Update referral_codes table with correct earnings
SELECT '=== UPDATING REFERRAL_CODES TABLE ===' as step;

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
  'Updated Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 6: Test referral network function
SELECT '=== TESTING REFERRAL NETWORK FUNCTION ===' as step;

SELECT 
  'Referral Network:' as info,
  *
FROM get_referral_network_detailed('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
