-- Create validate_and_apply_referral_code function
-- Run this script in your Supabase SQL Editor

-- 1. Create the validate_and_apply_referral_code function
CREATE OR REPLACE FUNCTION validate_and_apply_referral_code(
  p_user_id UUID,
  p_referral_code VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  referrer_id UUID
) AS $$
DECLARE
  referrer_record RECORD;
  referral_code_exists BOOLEAN := FALSE;
  user_already_referred BOOLEAN := FALSE;
BEGIN
  -- Debug: Log input parameters
  RAISE NOTICE 'Validating referral code: % for user: %', p_referral_code, p_user_id;
  
  -- Check if referral code exists and is active
  SELECT * INTO referrer_record
  FROM referral_codes
  WHERE code = p_referral_code 
  AND is_active = true
  AND user_id != p_user_id; -- Can't refer yourself
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Referral code not found or inactive: %', p_referral_code;
    RETURN QUERY SELECT false, 'Invalid or inactive referral code', NULL::UUID;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found referrer: %', referrer_record.user_id;
  
  -- Check if user is already referred
  IF EXISTS (
    SELECT 1 FROM referral_transactions 
    WHERE referred_id = p_user_id
  ) THEN
    RAISE NOTICE 'User already has a referrer';
    RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    referral_code,
    status,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    p_referral_code,
    'pending',
    true, -- Only first membership gets commission
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created referral transaction for user: %', p_user_id;
  
  -- Update referrer's referral count
  UPDATE referral_codes
  SET 
    total_referrals = total_referrals + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RAISE NOTICE 'Updated referrer count for: %', referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION validate_and_apply_referral_code(UUID, VARCHAR) TO authenticated;

-- 3. Test the function
SELECT 'validate_and_apply_referral_code function created successfully!' as status;
