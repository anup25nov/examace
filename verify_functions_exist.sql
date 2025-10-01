-- Verify All RPC Functions Exist
-- Run this in Supabase SQL Editor

-- Check if all required functions exist
SELECT 
    'FUNCTION STATUS:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types,
    CASE 
        WHEN proname = 'create_user_referral_code' THEN '✅'
        WHEN proname = 'apply_referral_code' THEN '✅'
        WHEN proname = 'process_referral_commission' THEN '✅'
        WHEN proname = 'get_referral_stats' THEN '✅'
        ELSE '❌'
    END as status
FROM pg_proc 
WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Test create_user_referral_code function
SELECT 'TESTING create_user_referral_code:' as info;

-- Test apply_referral_code function  
SELECT 'TESTING apply_referral_code:' as info;

-- Test process_referral_commission function
SELECT 'TESTING process_referral_commission:' as info;

-- Test get_referral_stats function
SELECT 'TESTING get_referral_stats:' as info;
