-- Direct fix for the commission record
-- The commission exists but referrer_id is still not set correctly

-- Step 1: Check all commission records to see what we have
SELECT '=== ALL COMMISSION RECORDS ===' as step;

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
ORDER BY created_at DESC;

-- Step 2: Check if there's a commission for the referred user
SELECT '=== COMMISSION FOR REFERRED USER ===' as step;

SELECT 
  'Commission for referred user:' as info,
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

-- Step 3: If no commission exists, create one manually
SELECT '=== CREATING COMMISSION MANUALLY ===' as step;

INSERT INTO referral_commissions (
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
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb',
  'b2975c5b-c04b-4929-b8ac-9f3da1b155b8',
  (SELECT id FROM payments WHERE user_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8' ORDER BY created_at DESC LIMIT 1),
  0.50,
  50.00,
  'pro_plus',
  1.00,
  'pending',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Check if commission was created
SELECT '=== COMMISSION AFTER CREATION ===' as step;

SELECT 
  'Commission after creation:' as info,
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

-- Step 5: Update referral_codes table
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

-- Step 6: Test referral stats function
SELECT '=== TESTING REFERRAL STATS FUNCTION ===' as step;

SELECT 
  'Comprehensive Referral Stats:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 7: Manual calculation to verify
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
