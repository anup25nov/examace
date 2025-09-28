-- Fix referral_codes table constraint issue
-- Add unique constraint on user_id to support ON CONFLICT clause

-- First, let's check if there are any duplicate user_ids
-- If there are, we need to clean them up first
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicate user_ids
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, COUNT(*) as cnt
        FROM referral_codes
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate user_ids in referral_codes, cleaning up...', duplicate_count;
        
        -- Keep only the most recent referral code for each user
        DELETE FROM referral_codes
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id) id
            FROM referral_codes
            ORDER BY user_id, created_at DESC
        );
        
        RAISE NOTICE 'Cleaned up duplicate referral codes';
    END IF;
END $$;

-- Add unique constraint on user_id
ALTER TABLE "public"."referral_codes"
ADD CONSTRAINT "referral_codes_user_id_unique" UNIQUE ("user_id");

-- Update the create_user_referral_code function to handle the constraint properly
CREATE OR REPLACE FUNCTION "public"."create_user_referral_code"("user_uuid" "uuid")
RETURNS "character varying"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    new_code VARCHAR(20);
    existing_code VARCHAR(20);
BEGIN
    -- Check if user already has an active referral code
    SELECT code INTO existing_code
    FROM referral_codes
    WHERE user_id = user_uuid AND is_active = true
    LIMIT 1;
    
    -- If user already has a code, return it
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code();
    
    -- Insert new referral code with proper conflict handling
    INSERT INTO referral_codes (user_id, code, is_active)
    VALUES (user_uuid, new_code, true)
    ON CONFLICT (user_id) DO UPDATE SET
        code = EXCLUDED.code,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    RETURNING code INTO new_code;
    
    RETURN new_code;
END;
$$;
