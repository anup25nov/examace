-- Fix the create_user_referral_code function to work without unique constraint
-- This approach uses UPSERT logic instead of ON CONFLICT

CREATE OR REPLACE FUNCTION "public"."create_user_referral_code"("user_uuid" "uuid")
RETURNS TEXT
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    new_code TEXT;
    existing_code TEXT;
    existing_id UUID;
BEGIN
    -- Check if user already has an active referral code
    SELECT code, id INTO existing_code, existing_id
    FROM referral_codes
    WHERE user_id = user_uuid AND is_active = true
    LIMIT 1;
    
    -- If user already has a code, return it
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code();
    
    -- Check if user has any referral code (active or inactive)
    SELECT id INTO existing_id
    FROM referral_codes
    WHERE user_id = user_uuid
    LIMIT 1;
    
    IF existing_id IS NOT NULL THEN
        -- Update existing referral code
        UPDATE referral_codes
        SET 
            code = new_code,
            is_active = true,
            updated_at = NOW()
        WHERE id = existing_id
        RETURNING code INTO new_code;
    ELSE
        -- Insert new referral code
        INSERT INTO referral_codes (user_id, code, is_active)
        VALUES (user_uuid, new_code, true)
        RETURNING code INTO new_code;
    END IF;
    
    RETURN new_code;
END;
$$;
