-- Fix type mismatch in validate_and_apply_referral_code function
-- The issue is that phone column is VARCHAR(15) but function returns TEXT

-- Drop and recreate the function with correct types
DROP FUNCTION IF EXISTS validate_and_apply_referral_code(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION validate_and_apply_referral_code(
  p_user_id UUID,
  p_referral_code VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  referrer_id UUID,
  referrer_phone VARCHAR(15)
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  referrer_record RECORD;
  user_record RECORD;
  existing_referral RECORD;
BEGIN
  -- Check if user already has a referral code applied
  SELECT * INTO user_record FROM user_profiles WHERE id = p_user_id;
  
  IF user_record.referral_code_applied THEN
    RETURN QUERY SELECT false, 'Referral code already applied', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  -- Check if user is trying to use their own referral code
  SELECT rc.user_id INTO referrer_record
  FROM referral_codes rc
  WHERE rc.code = UPPER(p_referral_code) AND rc.user_id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  -- Find the referrer by code
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code) AND rc.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  -- Check if there's already a referral transaction for this user
  SELECT * INTO existing_referral
  FROM referral_transactions
  WHERE referred_id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Referral code already applied', NULL::UUID, NULL::VARCHAR(15);
    RETURN;
  END IF;

  -- Apply the referral code
  UPDATE user_profiles 
  SET 
    referral_code_applied = TRUE,
    referral_code_used = UPPER(p_referral_code),
    referral_applied_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id, 
    referred_id, 
    referral_code, 
    amount, 
    transaction_type, 
    status,
    commission_amount,
    commission_status,
    first_membership_only
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    UPPER(p_referral_code),
    0.00,
    'referral_signup',
    'pending',
    0.00,
    'pending',
    true
  );

  -- Update referrer's total referrals count
  UPDATE referral_codes 
  SET total_referrals = total_referrals + 1,
      updated_at = NOW()
  WHERE user_id = referrer_record.user_id;

  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id, referrer_record.phone;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_and_apply_referral_code(UUID, VARCHAR) TO authenticated, anon;
