-- Create Missing RPC Functions for Referral System
-- Run this in Supabase SQL Editor

-- Step 1: Show existing RPC functions
SELECT 
    'EXISTING RPC FUNCTIONS:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Step 2: Drop existing create_user_referral_code functions first
DO $$ 
DECLARE
    func_record RECORD;
    drop_sql TEXT;
BEGIN
    -- Drop all create_user_referral_code functions
    FOR func_record IN 
        SELECT 
            proname, 
            oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE proname = 'create_user_referral_code' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Build the DROP statement with proper argument types
        drop_sql := 'DROP FUNCTION IF EXISTS public.create_user_referral_code(' || func_record.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropping function: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    RAISE NOTICE 'All create_user_referral_code functions dropped successfully';
END $$;

-- Step 3: Create create_user_referral_code function
CREATE OR REPLACE FUNCTION public.create_user_referral_code(
    p_user_uuid uuid,
    p_custom_code text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral_code text;
    v_code_exists boolean;
    v_user_exists boolean;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_user_uuid) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found',
            'referral_code', NULL
        );
    END IF;
    
    -- Check if user already has a referral code
    IF EXISTS(SELECT 1 FROM public.referral_codes WHERE user_id = p_user_uuid) THEN
        SELECT code INTO v_referral_code FROM public.referral_codes WHERE user_id = p_user_uuid;
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User already has a referral code',
            'referral_code', v_referral_code
        );
    END IF;
    
    -- Generate referral code
    IF p_custom_code IS NOT NULL THEN
        v_referral_code := UPPER(p_custom_code);
    ELSE
        v_referral_code := 'REF' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_referral_code) INTO v_code_exists;
    
    IF v_code_exists THEN
        -- Generate a unique code
        v_referral_code := v_referral_code || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    END IF;
    
    -- Insert referral code
    INSERT INTO public.referral_codes (
        user_id,
        code,
        total_referrals,
        total_earnings,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_user_uuid,
        v_referral_code,
        0,
        0.00,
        true,
        NOW(),
        NOW()
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Referral code created successfully',
        'referral_code', v_referral_code
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Error creating referral code: ' || SQLERRM,
            'referral_code', NULL
        );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_referral_code TO service_role;

-- Step 4: Verify all functions exist
SELECT 
    'FINAL RPC FUNCTIONS:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Success message
SELECT 'All RPC functions created successfully! ✅' as message;
