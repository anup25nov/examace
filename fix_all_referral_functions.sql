-- Complete Fix for All Referral Functions
-- Run this in Supabase SQL Editor

-- Step 1: Show existing functions
SELECT 
    'EXISTING FUNCTIONS BEFORE FIX:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Step 2: Drop ALL existing functions
DO $$ 
DECLARE
    func_record RECORD;
    drop_sql TEXT;
BEGIN
    -- Drop all functions
    FOR func_record IN 
        SELECT 
            proname, 
            oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Build the DROP statement with proper argument types
        drop_sql := 'DROP FUNCTION IF EXISTS public.' || func_record.proname || '(' || func_record.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropping function: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    RAISE NOTICE 'All functions dropped successfully';
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

-- Step 4: Create apply_referral_code function
CREATE OR REPLACE FUNCTION public.apply_referral_code(
    p_user_id uuid, 
    p_referral_code text
) RETURNS TABLE(success boolean, message text, referrer_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    referrer_record record;
    referrer_id_val UUID;
BEGIN
    -- Check if referral code exists and is active
    SELECT user_id INTO referrer_id_val
    FROM public.referral_codes
    WHERE code = p_referral_code AND is_active = true AND user_id != p_user_id;
    
    IF referrer_id_val IS NULL THEN
        RETURN QUERY SELECT false, 'Referral code not found or inactive', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user is already referred
    IF EXISTS (
        SELECT 1 FROM public.referral_transactions 
        WHERE referred_id = p_user_id
    ) THEN
        RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
        RETURN;
    END IF;
    
    -- Create referral transaction
    INSERT INTO public.referral_transactions (
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
        referrer_id_val,
        p_user_id,
        p_referral_code,
        'pending', -- Initial status
        'referral_signup', -- Type for initial signup
        0.00, -- No amount for signup
        0.00, -- No commission for signup
        'pending',
        false,
        true
    );
    
    -- Update referrer's referral count
    UPDATE public.referral_codes
    SET 
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = referrer_id_val;
    
    -- Update user profile with referral code
    UPDATE public.user_profiles
    SET 
        referred_by = p_referral_code,
        referral_code_applied = true,
        referral_code_used = p_referral_code,
        referral_applied_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_id_val;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error applying referral code: ' || SQLERRM, NULL::UUID;
END;
$$;

-- Step 5: Create process_referral_commission function
CREATE OR REPLACE FUNCTION public.process_referral_commission(
    p_payment_id uuid,
    p_referred_user_id uuid,
    p_payment_amount numeric,
    p_referral_code text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id uuid;
    v_commission_amount numeric;
    v_existing_transaction_id uuid;
    v_new_transaction_id uuid;
    v_referrer_profile record;
BEGIN
    -- Get referrer ID from referral code
    SELECT user_id INTO v_referrer_id
    FROM public.referral_codes
    WHERE code = p_referral_code AND is_active = true;
    
    IF v_referrer_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Referrer not found for code: ' || p_referral_code
        );
    END IF;
    
    -- Calculate commission (15% of payment amount)
    v_commission_amount := p_payment_amount * 0.15;
    
    -- Check for existing transaction to prevent duplicates
    SELECT id INTO v_existing_transaction_id
    FROM public.referral_transactions
    WHERE referred_id = p_referred_user_id 
        AND referral_code = p_referral_code
        AND transaction_type = 'referral'
        AND payment_id = p_payment_id;
    
    IF v_existing_transaction_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Referral transaction already exists',
            'transaction_id', v_existing_transaction_id
        );
    END IF;
    
    -- Create referral transaction
    INSERT INTO public.referral_transactions (
        referrer_id,
        referred_id,
        referral_code,
        amount,
        transaction_type,
        status,
        commission_amount,
        commission_status,
        membership_purchased,
        payment_id,
        first_membership_only
    ) VALUES (
        v_referrer_id,
        p_referred_user_id,
        p_referral_code,
        p_payment_amount,
        'referral',
        'completed',
        v_commission_amount,
        'pending',
        true,
        p_payment_id,
        true
    ) RETURNING id INTO v_new_transaction_id;
    
    -- Update referrer's total earnings
    SELECT * INTO v_referrer_profile
    FROM public.user_profiles
    WHERE id = v_referrer_id;
    
    IF v_referrer_profile.id IS NOT NULL THEN
        UPDATE public.user_profiles
        SET 
            total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount,
            updated_at = NOW()
        WHERE id = v_referrer_id;
    END IF;
    
    -- Update referral code stats
    UPDATE public.referral_codes
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_new_transaction_id,
        'referrer_id', v_referrer_id,
        'commission_amount', v_commission_amount,
        'message', 'Referral commission processed successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Error processing referral commission: ' || SQLERRM
        );
END;
$$;

-- Step 6: Create get_referral_stats function
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_referrals', COUNT(*),
        'completed_referrals', COUNT(*) FILTER (WHERE status = 'completed'),
        'total_earnings', COALESCE(SUM(commission_amount), 0),
        'pending_earnings', COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
        'paid_earnings', COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0)
    ) INTO v_stats
    FROM public.referral_transactions
    WHERE referrer_id = p_user_id;
    
    RETURN COALESCE(v_stats, jsonb_build_object(
        'total_referrals', 0,
        'completed_referrals', 0,
        'total_earnings', 0,
        'pending_earnings', 0,
        'paid_earnings', 0
    ));
END;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_referral_code TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code TO service_role;
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO service_role;

-- Step 8: Verify all functions were created
SELECT 
    'FINAL FUNCTIONS CREATED:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('create_user_referral_code', 'apply_referral_code', 'process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Success message
SELECT 'All referral functions created successfully! ✅' as message;
