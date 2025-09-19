-- Debug function signatures in the database
-- Run this in your Supabase SQL Editor

-- 1. Check all functions with the name process_referral_commission
SELECT '=== ALL FUNCTIONS WITH NAME process_referral_commission ===' as step;
SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 2. Check parameters for each function
SELECT '=== FUNCTION PARAMETERS ===' as step;
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

-- 3. Test function with 4 parameters (what Edge Function is calling)
SELECT '=== TESTING WITH 4 PARAMETERS ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id
);

-- 4. Test function with 3 parameters (what Supabase is looking for)
SELECT '=== TESTING WITH 3 PARAMETERS ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id
);
