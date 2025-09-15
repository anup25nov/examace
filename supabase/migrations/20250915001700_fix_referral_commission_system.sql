-- Fix referral commission system to work with new memberships/payments tables

-- 1. Update referral_commissions table to work with new system
ALTER TABLE referral_commissions DROP CONSTRAINT IF EXISTS referral_commissions_membership_transaction_id_fkey;
ALTER TABLE referral_commissions DROP COLUMN IF EXISTS membership_transaction_id;
ALTER TABLE referral_commissions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE CASCADE;

-- 2. Drop old function and create updated process_membership_commission function for new system
DROP FUNCTION IF EXISTS process_membership_commission(UUID, UUID, VARCHAR(50), DECIMAL(10,2));

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
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  -- Check if this is the first membership (if first_membership_only is true)
  IF referral_record.first_membership_only THEN
    -- Check if user already has a completed membership
    IF EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = p_user_id 
      AND m.end_date > NOW()
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate commission (50% of membership amount)
  commission_amount := (p_membership_amount * commission_percentage / 100);
  
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
  
  -- Update referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = total_earnings + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create function to check if user can make withdrawal request
CREATE OR REPLACE FUNCTION can_make_withdrawal_request(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has any pending withdrawal requests
  RETURN NOT EXISTS (
    SELECT 1 FROM withdrawal_requests 
    WHERE user_id = user_uuid 
    AND status IN ('pending', 'processing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION process_membership_commission(UUID, UUID, VARCHAR(50), DECIMAL(10,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION can_make_withdrawal_request(UUID) TO authenticated;
