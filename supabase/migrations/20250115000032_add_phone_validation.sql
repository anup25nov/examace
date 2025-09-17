-- Add phone number validation function
-- This function checks if a phone number already exists in the system

CREATE OR REPLACE FUNCTION check_phone_exists(phone_number TEXT)
RETURNS TABLE (
  phone_exists BOOLEAN,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN up.id IS NOT NULL THEN true ELSE false END as phone_exists,
    up.id as user_id,
    up.created_at
  FROM user_profiles up
  WHERE up.phone = phone_number
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_phone_exists(TEXT) TO authenticated, anon;

-- Also create a function to validate referral code for new user signup
CREATE OR REPLACE FUNCTION validate_referral_code_for_signup(
  p_referral_code VARCHAR(20)
)
RETURNS TABLE (
  valid BOOLEAN,
  message TEXT,
  referrer_id UUID,
  referrer_phone VARCHAR(15)
) AS $$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Check if referral code exists and is active
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code) AND rc.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Valid referral code', referrer_record.user_id, referrer_record.phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_referral_code_for_signup(VARCHAR) TO authenticated, anon;
