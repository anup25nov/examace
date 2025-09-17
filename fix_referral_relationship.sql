-- Fix the referral relationship between U1 and U2
-- U1 should have a referral_code and U2 should have referred_by set

-- Step 1: Check current state
SELECT '=== CURRENT USER PROFILES ===' as step;

SELECT 
  'User profiles:' as info,
  id,
  phone,
  membership_status,
  membership_plan,
  referral_code,
  referred_by,
  referral_code_applied,
  referral_code_used,
  referral_applied_at
FROM user_profiles 
WHERE id IN ('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb', 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8')
ORDER BY created_at;

-- Step 2: Check referral_codes table
SELECT '=== REFERRAL_CODES TABLE ===' as step;

SELECT 
  'Referral codes:' as info,
  id,
  user_id,
  code,
  total_referrals,
  total_earnings,
  is_active
FROM referral_codes 
WHERE user_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 3: Check referral_transactions
SELECT '=== REFERRAL_TRANSACTIONS ===' as step;

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
  commission_status
FROM referral_transactions 
WHERE referrer_id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb' 
   OR referred_id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 4: Fix U1's referral_code in user_profiles
SELECT '=== FIXING U1 REFERRAL_CODE ===' as step;

UPDATE user_profiles
SET 
  referral_code = 'AD1CFF7D',
  updated_at = NOW()
WHERE id = 'ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb';

-- Step 5: Fix U2's referred_by in user_profiles
SELECT '=== FIXING U2 REFERRED_BY ===' as step;

UPDATE user_profiles
SET 
  referred_by = 'AD1CFF7D',
  updated_at = NOW()
WHERE id = 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8';

-- Step 6: Check updated user profiles
SELECT '=== UPDATED USER PROFILES ===' as step;

SELECT 
  'Updated user profiles:' as info,
  id,
  phone,
  membership_status,
  membership_plan,
  referral_code,
  referred_by,
  referral_code_applied,
  referral_code_used,
  referral_applied_at
FROM user_profiles 
WHERE id IN ('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb', 'b2975c5b-c04b-4929-b8ac-9f3da1b155b8')
ORDER BY created_at;

-- Step 7: Test referral stats
SELECT '=== TESTING REFERRAL STATS ===' as step;

SELECT 
  'Referral stats for U1:' as info,
  *
FROM get_comprehensive_referral_stats('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');

-- Step 8: Check referral network
SELECT '=== REFERRAL NETWORK ===' as step;

SELECT 
  'Referral network for U1:' as info,
  *
FROM get_referral_network_detailed('ad1cff7d-11e8-4a99-8a4e-1f44fb6db0fb');
