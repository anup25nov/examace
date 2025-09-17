-- Update referral stats manually if needed
-- This will ensure the referral stats are correctly calculated

-- Step 1: Calculate total commissions for the referrer
SELECT '=== CALCULATING TOTAL COMMISSIONS ===' as step;

SELECT 
  'Total commissions for referrer:' as info,
  COUNT(*) as total_commissions,
  SUM(commission_amount) as total_commission_amount,
  SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 2: Update referral_codes table with correct earnings
SELECT '=== UPDATING REFERRAL_CODES TABLE ===' as step;

-- Update total_earnings in referral_codes table
UPDATE referral_codes
SET 
  total_earnings = (
    SELECT COALESCE(SUM(commission_amount), 0.00)
    FROM referral_commissions 
    WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
  ),
  updated_at = NOW()
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 3: Check updated referral_codes
SELECT '=== UPDATED REFERRAL_CODES ===' as step;

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

-- Step 4: Test referral stats function again
SELECT '=== TESTING REFERRAL STATS FUNCTION AGAIN ===' as step;

SELECT 
  'Updated Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 5: Check all commissions again
SELECT '=== ALL COMMISSIONS AFTER UPDATE ===' as step;

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
