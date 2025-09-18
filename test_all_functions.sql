-- Test All Functions for Robust System
-- Run this after applying the fixes

-- Test 1: Check if all functions exist
SELECT '=== CHECKING ALL FUNCTIONS EXIST ===' as test;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'activate_or_upgrade_membership',
  'get_unread_message_count',
  'get_user_messages',
  'apply_referral_code',
  'validate_and_apply_referral_code',
  'get_user_referral_earnings',
  'get_referral_network_detailed',
  'process_referral_commission',
  'request_commission_withdrawal',
  'get_user_commission_history'
)
AND routine_schema = 'public'
ORDER BY routine_name;

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
  'activate_or_upgrade_membership',
  'get_unread_message_count',
  'get_user_messages',
  'apply_referral_code',
  'validate_and_apply_referral_code',
  'get_user_referral_earnings',
  'get_referral_network_detailed',
  'process_referral_commission',
  'request_commission_withdrawal',
  'get_user_commission_history'
)
ORDER BY p.proname;

-- Test 3: Check tables exist
SELECT '=== CHECKING TABLES EXIST ===' as test;

SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'payments',
  'user_messages',
  'referral_codes',
  'referral_transactions', 
  'referral_commissions',
  'referral_payouts',
  'user_memberships'
)
AND table_schema = 'public'
ORDER BY table_name;

-- Test 4: Check payments table structure
SELECT '=== CHECKING PAYMENTS TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 5: Check user_messages table structure
SELECT '=== CHECKING USER_MESSAGES TABLE STRUCTURE ===' as test;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 6: Check indexes exist
SELECT '=== CHECKING INDEXES EXIST ===' as test;

SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
AND schemaname = 'public'
ORDER BY tablename, indexname;

SELECT '=== ALL TESTS COMPLETED ===' as test;
