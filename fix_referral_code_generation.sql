-- Fix referral code generation to create alphanumeric codes with guaranteed uniqueness
-- This will generate codes like REF7A9K2M4P instead of REF1759394701.826729

-- Helper function to generate alphanumeric referral codes
CREATE OR REPLACE FUNCTION generate_alphanumeric_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_code text;
    v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_length integer := 8; -- 8 characters after REF prefix
    v_i integer;
BEGIN
    v_code := 'REF';
    
    -- Generate random alphanumeric string
    FOR v_i IN 1..v_length LOOP
        v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;
    
    RETURN v_code;
END;
$$;

-- Update the create_user_referral_code function
CREATE OR REPLACE FUNCTION public.create_user_referral_code(
    p_user_uuid uuid,
    p_custom_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral_code text;
    v_code_exists boolean := false;
    v_user_exists boolean := false;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_user_uuid) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found',
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
        -- Generate alphanumeric referral code with guaranteed uniqueness
        v_referral_code := generate_alphanumeric_referral_code();
    END IF;
    
    -- Check if code already exists and regenerate if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_referral_code) INTO v_code_exists;
        EXIT WHEN NOT v_code_exists;
        v_referral_code := generate_alphanumeric_referral_code();
    END LOOP;
    
    -- Insert referral code
    INSERT INTO public.referral_codes (
        user_id,
        code,
        created_at,
        updated_at
    ) VALUES (
        p_user_uuid,
        v_referral_code,
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
            'message', 'Error creating referral code: ' || SQLERRM,
            'referral_code', NULL
        );
END;
$$;

-- Test the function to show the difference
SELECT 'Testing new alphanumeric referral code generation:' as test_message;

-- Test the helper function
SELECT generate_alphanumeric_referral_code() as sample_code_1;
SELECT generate_alphanumeric_referral_code() as sample_code_2;
SELECT generate_alphanumeric_referral_code() as sample_code_3;

-- This will now generate codes like REF7A9K2M4P instead of REF1759394701.826729
SELECT public.create_user_referral_code('d791ba76-4059-4460-bda6-3020bf786100'::uuid, NULL) as test_result;
