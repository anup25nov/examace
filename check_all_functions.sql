-- Check ALL functions with process_referral_commission in the name
SELECT '=== ALL FUNCTIONS WITH process_referral_commission ===' as step;

SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%process_referral_commission%' 
AND routine_schema = 'public'
ORDER BY specific_name;

-- Check parameters for ALL functions
SELECT '=== ALL FUNCTION PARAMETERS ===' as step;
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
    WHERE r.routine_name LIKE '%process_referral_commission%' 
    AND r.routine_schema = 'public'
)
ORDER BY p.specific_name, p.ordinal_position;

-- Check what Supabase sees
SELECT '=== SUPABASE FUNCTION CACHE ===' as step;
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname LIKE '%process_referral_commission%'
AND n.nspname = 'public';
