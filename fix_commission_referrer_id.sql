-- Fix the commission record with correct referrer_id
-- The commission exists but has null referrer_id

-- Step 1: Check current commission record
SELECT '=== CURRENT COMMISSION RECORD ===' as step;

SELECT 
  'Current commission:' as info,
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
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
ORDER BY created_at DESC;

-- Step 2: Update commission record with correct referrer_id
SELECT '=== UPDATING COMMISSION RECORD ===' as step;

UPDATE referral_commissions
SET 
  referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb',
  updated_at = NOW()
WHERE referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8'
  AND referrer_id IS NULL;

-- Step 3: Check updated commission record
SELECT '=== UPDATED COMMISSION RECORD ===' as step;

SELECT 
  'Updated commission:' as info,
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

-- Step 4: Update referral_codes table with correct earnings
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

-- Step 5: Check updated referral_codes table
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

-- Step 6: Test referral stats function
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 7: Test referral network function
SELECT '=== TESTING REFERRAL NETWORK FUNCTION ===' as step;

SELECT 
  'Referral Network:' as info,
  *
FROM get_referral_network_detailed('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 8: Manual calculation to verify
SELECT '=== MANUAL CALCULATION ===' as step;

SELECT 
  'Manual calculation:' as info,
  COUNT(*) as total_referrals,
  SUM(commission_amount) as total_commissions_earned,
  SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';
