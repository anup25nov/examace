-- Check if functions are dropped
-- Run this in your Supabase SQL Editor

-- 1. Check how many functions exist
SELECT '=== FUNCTION COUNT ===' as step;
SELECT COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 2. If count is 0, functions are dropped
-- If count is > 0, show what functions exist
SELECT '=== EXISTING FUNCTIONS (if any) ===' as step;
SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 3. Check parameters for any remaining functions
SELECT '=== FUNCTION PARAMETERS (if any) ===' as step;
SELECT 
    p.specific_name,
    p.parameter_name,
    p.parameter_mode,
    p.data_type,
    p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_name IN (
    SELECT r.specific_name 
    FROM information_schema.routines r
    WHERE r.routine_name = 'process_referral_commission' 
    AND r.routine_schema = 'public'
)
ORDER BY p.specific_name, p.ordinal_position;
