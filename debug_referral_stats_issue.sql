-- Debug why referral stats are showing 0 when commission exists
-- The referral code is in referral_codes table, not user_profiles

-- Step 1: Check referral_codes table
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

-- Step 4: Check what the referral stats function is actually reading
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 5: Check if there's a mismatch in the function logic
SELECT '=== CHECKING FUNCTION LOGIC ===' as step;

-- Check what the function should be reading from referral_codes
SELECT 
  'Referral codes for function:' as info,
  total_earnings,
  total_referrals
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Check what the function should be reading from commissions
SELECT 
  'Commissions for function:' as info,
  COUNT(*) as commission_count,
  SUM(commission_amount) as total_commission_amount,
  SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END) as pending_commissions,
  SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_commissions,
  SUM(CASE WHEN status = 'cancelled' THEN commission_amount ELSE 0 END) as cancelled_commissions
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 6: Check if the function is reading from the right tables
SELECT '=== CHECKING FUNCTION SOURCE TABLES ===' as step;

-- Check if the function is reading from referral_codes correctly
SELECT 
  'Function should read from referral_codes:' as info,
  user_id,
  code,
  total_earnings,
  total_referrals
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Check if the function is reading from commissions correctly
SELECT 
  'Function should read from commissions:' as info,
  referrer_id,
  COUNT(*) as commission_count,
  SUM(commission_amount) as total_commission_amount
FROM referral_commissions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb'
GROUP BY referrer_id;
