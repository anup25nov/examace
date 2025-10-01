-- Fix Function Overloading Issues
-- Run this in Supabase SQL Editor

-- Step 1: Show existing functions
SELECT 
    'EXISTING FUNCTIONS BEFORE DROP:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname = 'apply_referral_code'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Step 2: Drop all existing apply_referral_code functions with specific signatures
DO $$ 
DECLARE
    func_record RECORD;
    drop_sql TEXT;
BEGIN
    -- Drop all apply_referral_code functions
    FOR func_record IN 
        SELECT 
            proname, 
            oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE proname = 'apply_referral_code' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Build the DROP statement with proper argument types
        drop_sql := 'DROP FUNCTION IF EXISTS public.apply_referral_code(' || func_record.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropping function: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    RAISE NOTICE 'All apply_referral_code functions dropped successfully';
END $$;

-- Create a single apply_referral_code function with text parameter
CREATE OR REPLACE FUNCTION public.apply_referral_code(
    p_user_id uuid,
    p_referral_code text
) RETURNS TABLE("success" boolean, "message" text, "referrer_id" uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
    referrer_record RECORD;
BEGIN
    -- Check if referral code exists and is active
    SELECT * INTO referrer_record
    FROM referral_codes
    WHERE code = p_referral_code 
    AND is_active = true
    AND user_id != p_user_id;
    
    -- If referral code not found
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            false as success,
            'Referral code not found or inactive' as message,
            NULL::UUID as referrer_id;
        RETURN;
    END IF;
    
    -- Check if user is already referred
    IF EXISTS (
        SELECT 1 FROM referral_transactions 
        WHERE referred_id = p_user_id
    ) THEN
        RETURN QUERY
        SELECT 
            false as success,
            'User already has a referrer' as message,
            NULL::UUID as referrer_id;
        RETURN;
    END IF;
    
    -- Create referral transaction
    INSERT INTO referral_transactions (
        referrer_id,
        referred_id,
        referral_code,
        status,
        transaction_type,
        amount,
        commission_amount,
        commission_status,
        membership_purchased,
        first_membership_only
    ) VALUES (
        referrer_record.user_id,
        p_user_id,
        p_referral_code,
        'pending',
        'referral',
        0.00,
        0.00,
        'pending',
        false,
        true
    );
    
    -- Update referrer's referral count
    UPDATE referral_codes
    SET 
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = referrer_record.user_id;
    
    -- Update user profile with referral code
    UPDATE user_profiles
    SET 
        referred_by = p_referral_code,
        referral_code_applied = true,
        referral_code_used = p_referral_code,
        referral_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Return success
    RETURN QUERY
    SELECT 
        true as success,
        'Referral code applied successfully' as message,
        referrer_record.user_id as referrer_id;
        
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY
        SELECT 
            false as success,
            'Error applying referral code: ' || SQLERRM as message,
            NULL::UUID as referrer_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.apply_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code TO service_role;

-- Step 3: Verify the new function was created
SELECT 
    'NEW FUNCTION CREATED:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname = 'apply_referral_code'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Success message
SELECT 'Function overloading fixed! ✅' as message;