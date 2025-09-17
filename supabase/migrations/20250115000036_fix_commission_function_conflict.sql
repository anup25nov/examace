-- Fix commission function conflict and ensure proper commission processing
-- This migration ensures the correct process_membership_commission function is used

-- 1. Drop all existing versions of the function
DROP FUNCTION IF EXISTS process_membership_commission(UUID, UUID, VARCHAR(50), DECIMAL(10,2));
DROP FUNCTION IF EXISTS process_membership_commission(UUID, VARCHAR(50), DECIMAL(10,2), UUID);

-- 2. Create the correct version that works with the new payment system
CREATE OR REPLACE FUNCTION process_membership_commission(
  p_user_id UUID,
  p_payment_id UUID,
  p_membership_plan VARCHAR(50),
  p_membership_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission as specified
BEGIN
  -- Debug: Log the input parameters
  RAISE NOTICE 'Processing commission for user: %, payment: %, plan: %, amount: %', 
    p_user_id, p_payment_id, p_membership_plan, p_membership_amount;
  
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No pending referral found for user: %', p_user_id;
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found referral record: %, referrer: %', referral_record.id, referral_record.referrer_id;
  
  -- Check if this is the first membership (if first_membership_only is true)
  IF referral_record.first_membership_only THEN
    -- Check if user already has a completed membership
    IF EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = p_user_id 
      AND m.end_date > NOW()
    ) THEN
      RAISE NOTICE 'User already has membership, no commission';
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate commission (50% of membership amount)
  commission_amount := (p_membership_amount * commission_percentage / 100);
  
  RAISE NOTICE 'Calculated commission: %', commission_amount;
  
  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    payment_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_payment_id,
    commission_amount,
    commission_percentage,
    p_membership_plan,
    p_membership_amount,
    'pending',
    referral_record.first_membership_only
  );
  
  RAISE NOTICE 'Created commission record';
  
  -- Update referral transaction
  UPDATE referral_transactions
  SET 
    amount = p_membership_amount,
    transaction_type = 'membership',
    status = 'completed',
    commission_amount = commission_amount,
    commission_status = 'pending',
    membership_purchased = TRUE,
    updated_at = NOW()
  WHERE id = referral_record.id;
  
  RAISE NOTICE 'Updated referral transaction';
  
  -- Update referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = total_earnings + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;
  
  RAISE NOTICE 'Updated referrer earnings';
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION process_membership_commission(UUID, UUID, VARCHAR(50), DECIMAL(10,2)) TO authenticated, anon;

-- 4. Create a function to manually process commission for existing users
CREATE OR REPLACE FUNCTION process_existing_commission(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  payment_record RECORD;
  commission_result RECORD;
BEGIN
  -- Find the latest payment for this user
  SELECT * INTO payment_record
  FROM payments
  WHERE user_id = p_user_id
  AND status IN ('verified', 'paid', 'completed')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No verified payment found for user', 0.00;
    RETURN;
  END IF;
  
  -- Process commission
  RETURN QUERY
  SELECT * FROM process_membership_commission(
    p_user_id,
    payment_record.id,
    payment_record.plan,
    payment_record.amount::DECIMAL(10,2)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION process_existing_commission(UUID) TO authenticated, anon;
