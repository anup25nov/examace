-- Complete fix for referral function with all NOT NULL constraints
-- Run this script in your Supabase SQL Editor

-- 1. Drop and recreate the function with all required fields
DROP FUNCTION IF EXISTS validate_and_apply_referral_code(UUID, VARCHAR);
DROP FUNCTION IF EXISTS validate_and_apply_referral_code(UUID, CHARACTER VARYING);

-- 2. Create the complete function
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
  
  -- Create referral transaction with all required fields
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
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    p_referral_code,
    'pending',
    'referral', -- Transaction type for referral
    0.00, -- Default amount for pending referral
    0.00, -- Default commission amount
    'pending', -- Commission status
    false, -- Membership not purchased yet
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION validate_and_apply_referral_code(UUID, VARCHAR) TO authenticated;

-- 4. Test the function
SELECT 'validate_and_apply_referral_code function created with all constraints!' as status;
