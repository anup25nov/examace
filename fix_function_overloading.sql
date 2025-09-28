-- Fix function overloading conflict by removing the duplicate function
-- We need to drop the single-parameter function and keep the two-parameter one

-- Drop the single-parameter function that's causing the conflict
DROP FUNCTION IF EXISTS "public"."create_user_referral_code"("user_uuid" "uuid");

-- Keep only the two-parameter function and make sure it works properly
CREATE OR REPLACE FUNCTION "public"."create_user_referral_code"("user_uuid" "uuid", "custom_code" character varying DEFAULT NULL::character varying) 
RETURNS TABLE("success" boolean, "message" "text", "referral_code" character varying)
LANGUAGE "plpgsql" 
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  generated_code VARCHAR(20);
  code_exists BOOLEAN;
  existing_id UUID;
BEGIN
  -- Check if user already has an active referral code
  SELECT id INTO existing_id
  FROM referral_codes
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;
  
  -- If user already has an active code, return it
  IF existing_id IS NOT NULL THEN
    SELECT code INTO generated_code
    FROM referral_codes
    WHERE id = existing_id;
    
    RETURN QUERY
    SELECT 
      true as success,
      'Referral code already exists' as message,
      generated_code;
    RETURN;
  END IF;

  -- Generate or use custom code
  IF custom_code IS NOT NULL THEN
    -- Check if custom code is available
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = custom_code) INTO code_exists;
    IF code_exists THEN
      RETURN QUERY
      SELECT 
        false as success,
        'Referral code already exists' as message,
        NULL::VARCHAR as referral_code;
      RETURN;
    END IF;
    generated_code := custom_code;
  ELSE
    -- Generate random code
    generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM referral_codes WHERE code = generated_code) LOOP
      generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    END LOOP;
  END IF;
  
  -- Check if user has any referral code (active or inactive)
  SELECT id INTO existing_id
  FROM referral_codes
  WHERE user_id = user_uuid
  LIMIT 1;
  
  IF existing_id IS NOT NULL THEN
    -- Update existing referral code
    UPDATE referral_codes
    SET 
      code = generated_code,
      is_active = true,
      updated_at = NOW()
    WHERE id = existing_id;
  ELSE
    -- Insert new referral code
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, is_active)
    VALUES (user_uuid, generated_code, 0, 0, true);
  END IF;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Referral code created successfully' as message,
    generated_code;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error creating referral code: ' || SQLERRM as message,
      NULL::VARCHAR as referral_code;
END;
$$;
