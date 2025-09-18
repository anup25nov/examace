-- Test validate_and_apply_referral_code function
-- Run this after creating the function

-- Test 1: Check if function exists
SELECT '=== CHECKING FUNCTION EXISTS ===' as test;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'validate_and_apply_referral_code'
AND routine_schema = 'public';

-- Test 2: Check function signature
SELECT '=== CHECKING FUNCTION SIGNATURE ===' as test;

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'validate_and_apply_referral_code';

-- Test 3: Test with a sample referral code (if you have one)
SELECT '=== TESTING FUNCTION ===' as test;

-- This will work if you have a referral code in your database
-- Replace 'TEST123' with an actual referral code and 'your-user-id' with a real user ID
-- SELECT * FROM validate_and_apply_referral_code('your-user-id'::UUID, 'TEST123');

-- Test 4: Check if referral_codes table has data
SELECT '=== CHECKING REFERRAL CODES TABLE ===' as test;

SELECT COUNT(*) as total_codes, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_codes
FROM referral_codes;

SELECT '=== ALL TESTS COMPLETED ===' as test;
