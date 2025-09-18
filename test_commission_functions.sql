-- Test Commission Functions
-- Run this after applying apply_commission_functions_fixed.sql

-- Test 1: Check if functions exist
SELECT '=== CHECKING FUNCTIONS EXIST ===' as test;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'process_referral_commission',
  'get_user_referral_stats', 
  'request_commission_withdrawal',
  'get_user_commission_history'
)
AND routine_schema = 'public';

-- Test 2: Check function signatures
SELECT '=== CHECKING FUNCTION SIGNATURES ===' as test;

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'process_referral_commission',
  'get_user_referral_stats',
  'request_commission_withdrawal', 
  'get_user_commission_history'
);

-- Test 3: Test get_user_referral_stats function (if you have a user)
SELECT '=== TESTING get_user_referral_stats ===' as test;

-- This will work if you have a user with a referral code
-- Replace 'your-user-id-here' with an actual user ID from your database
-- SELECT * FROM get_user_referral_stats('your-user-id-here'::UUID);

-- Test 4: Check if tables exist
SELECT '=== CHECKING TABLES EXIST ===' as test;

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'referral_codes',
  'referral_transactions', 
  'referral_commissions',
  'referral_payouts'
)
AND table_schema = 'public';

SELECT '=== ALL TESTS COMPLETED ===' as test;
