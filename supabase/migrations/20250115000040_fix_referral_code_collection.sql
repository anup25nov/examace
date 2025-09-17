-- Fix referral code collection to ensure proper referrer_id is set
-- This migration ensures referral codes are properly linked to referrers

-- Step 1: Create a function to properly apply referral codes
CREATE OR REPLACE FUNCTION apply_referral_code(
  p_user_id UUID,
  p_referral_code TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  referrer_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  referrer_id_val UUID;
  referral_code_exists BOOLEAN;
BEGIN
  -- Check if referral code exists
  SELECT 
    user_id,
    true
  INTO 
    referrer_id_val,
    referral_code_exists
  FROM referral_codes
  WHERE code = p_referral_code
    AND is_active = true
  LIMIT 1;
  
  -- If referral code not found
  IF NOT referral_code_exists THEN
    RETURN QUERY SELECT false, 'Referral code not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user is trying to use their own referral code
  IF referrer_id_val = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Update user profile with referral code
  UPDATE user_profiles
  SET 
    referred_by = p_referral_code,
    referral_code_applied = true,
    referral_code_used = p_referral_code,
    referral_applied_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_id_val;
END;
$$;

-- Step 2: Create a function to fix existing user profiles with missing referral relationships
CREATE OR REPLACE FUNCTION fix_user_referral_relationships()
RETURNS TABLE(
  fixed_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_count_val INTEGER := 0;
  user_record RECORD;
  referrer_id_val UUID;
BEGIN
  -- Fix user profiles with referral codes but missing referred_by
  FOR user_record IN
    SELECT 
      up.id,
      up.referral_code_used,
      rt.referrer_id
    FROM user_profiles up
    LEFT JOIN referral_transactions rt ON up.id = rt.referred_id
    WHERE up.referral_code_used IS NOT NULL
      AND up.referred_by IS NULL
      AND rt.referrer_id IS NOT NULL
  LOOP
    -- Update user profile with referral code
    UPDATE user_profiles
    SET 
      referred_by = user_record.referral_code_used,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    fixed_count_val := fixed_count_val + 1;
  END LOOP;
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' user referral relationships';
END;
$$;

-- Step 3: Run the fix function
SELECT * FROM fix_user_referral_relationships();

-- Step 4: Create a trigger to automatically create referral transactions when users are created with referral codes
CREATE OR REPLACE FUNCTION create_referral_transaction_on_user_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  referrer_id_val UUID;
  referral_code_val TEXT;
BEGIN
  -- Only process if referral code is used
  IF NEW.referral_code_used IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get referrer_id from referral code
  SELECT user_id INTO referrer_id_val
  FROM referral_codes
  WHERE code = NEW.referral_code_used
  LIMIT 1;
  
  -- If referrer not found, return
  IF referrer_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create referral transaction for signup
  INSERT INTO referral_transactions (
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    transaction_type,
    status,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    referrer_id_val,
    NEW.id,
    NEW.referral_code_used,
    0.00,
    'referral_signup',
    'completed',
    0.00,
    'pending',
    false,
    true,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_referral_transaction_on_user_creation ON user_profiles;

-- Create trigger
CREATE TRIGGER trigger_create_referral_transaction_on_user_creation
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_transaction_on_user_creation();
