-- Test Referral Commission Functions
-- Run this script in your Supabase SQL Editor after applying the commission functions

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

-- Test 2: Check if tables exist
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

-- Test 3: Check if indexes exist
SELECT '=== CHECKING INDEXES EXIST ===' as test;

SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_referral_%'
AND schemaname = 'public';

-- Test 4: Test function signatures
SELECT '=== TESTING FUNCTION SIGNATURES ===' as test;

-- This will show the function signatures
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

SELECT '=== ALL TESTS COMPLETED ===' as test;
