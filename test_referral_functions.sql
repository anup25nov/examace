-- Test if referral functions exist and work
-- Run this in your Supabase SQL Editor

-- 1. Check if functions exist
SELECT '=== CHECKING REFERRAL FUNCTIONS ===' as test;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'activate_or_upgrade_membership',
  'apply_referral_code', 
  'process_referral_commission',
  'validate_and_apply_referral_code'
)
ORDER BY routine_name;

-- 2. Test activate_or_upgrade_membership function
SELECT '=== TESTING ACTIVATE_MEMBERSHIP ===' as test;

SELECT * FROM activate_or_upgrade_membership(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'pro_plus',
  NOW()
);

-- 3. Check if referral code exists for U1
SELECT '=== CHECKING U1 REFERRAL CODE ===' as test;

SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';

-- 4. Test apply_referral_code function
SELECT '=== TESTING APPLY_REFERRAL_CODE ===' as test;

SELECT * FROM apply_referral_code(
  '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
  'FBC97816'
);

-- 5. Test process_referral_commission function (skip if doesn't exist)
SELECT '=== TESTING PROCESS_COMMISSION ===' as test;

-- Check if function exists first
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'process_referral_commission';

-- If it exists, test it
-- SELECT * FROM process_referral_commission(
--   '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
--   '9e508576-f73c-4d53-9c8d-9119b2d6224c'::UUID,
--   'pro_plus',
--   2.00
-- );

-- 6. Check current referral_transactions
SELECT '=== CURRENT REFERRAL TRANSACTIONS ===' as test;

SELECT * FROM referral_transactions 
WHERE referrer_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec'
ORDER BY created_at DESC;

-- 7. Check current referral_codes
SELECT '=== CURRENT REFERRAL CODES ===' as test;

SELECT * FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
