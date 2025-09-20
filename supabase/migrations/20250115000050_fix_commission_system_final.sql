-- Final fix for referral commission system
-- This migration creates a unified, working commission processing system

-- 1. Create or replace the process_referral_commission function with correct signature
DROP FUNCTION IF EXISTS process_referral_commission(UUID, VARCHAR, VARCHAR, DECIMAL);
DROP FUNCTION IF EXISTS process_referral_commission(UUID, VARCHAR, DECIMAL, UUID);

CREATE OR REPLACE FUNCTION process_referral_commission(
  p_user_id UUID,
  p_payment_id VARCHAR(100),
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
      SELECT 1 FROM user_memberships um
      WHERE um.user_id = p_user_id 
      AND um.status = 'active'
      AND um.end_date > NOW()
      AND um.payment_id != p_payment_id
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

-- 2. Create function to get user's referral statistics
DROP FUNCTION IF EXISTS get_user_referral_stats(UUID);
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  pending_commission DECIMAL(10,2),
  paid_commission DECIMAL(10,2),
  referral_code VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0.00) as total_earnings,
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'pending'), 
      0.00
    ) as pending_commission,
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'paid'), 
      0.00
    ) as paid_commission,
    rc.code as referral_code
  FROM referral_codes rc
  WHERE rc.user_id = user_uuid AND rc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create function to request commission withdrawal
CREATE OR REPLACE FUNCTION request_commission_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_method VARCHAR(50) DEFAULT 'bank_transfer'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  withdrawal_id UUID
) AS $$
DECLARE
  available_balance DECIMAL(10,2);
  withdrawal_record_id UUID;
BEGIN
  -- Check available balance
  SELECT COALESCE(
    (SELECT SUM(commission_amount) 
     FROM referral_commissions 
     WHERE referrer_id = p_user_id AND status = 'pending'), 
    0.00
  ) INTO available_balance;
  
  IF available_balance < p_amount THEN
    RETURN QUERY SELECT false, 'Insufficient balance for withdrawal', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create withdrawal request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    status,
    payment_method
  ) VALUES (
    p_user_id,
    p_amount,
    'pending',
    p_payment_method
  ) RETURNING id INTO withdrawal_record_id;
  
  -- Mark commissions as processing
  UPDATE referral_commissions
  SET status = 'processing'
  WHERE referrer_id = p_user_id 
  AND status = 'pending'
  AND id IN (
    SELECT id FROM referral_commissions 
    WHERE referrer_id = p_user_id AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT (SELECT COUNT(*) FROM referral_commissions WHERE referrer_id = p_user_id AND status = 'pending')
  );
  
  RETURN QUERY SELECT true, 'Withdrawal request created successfully', withdrawal_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create function to get user's commission history
CREATE OR REPLACE FUNCTION get_user_commission_history(user_uuid UUID)
RETURNS TABLE (
  commission_id UUID,
  referred_user_id UUID,
  referred_phone VARCHAR(15),
  membership_plan VARCHAR(50),
  membership_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.id as commission_id,
    rc.referred_id as referred_user_id,
    up.phone as referred_phone,
    rc.membership_plan,
    rc.membership_amount,
    rc.commission_amount,
    rc.commission_percentage,
    rc.status,
    rc.created_at
  FROM referral_commissions rc
  LEFT JOIN user_profiles up ON rc.referred_id = up.id
  WHERE rc.referrer_id = user_uuid
  ORDER BY rc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION process_referral_commission(UUID, VARCHAR, VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(UUID, DECIMAL, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_commission_history(UUID) TO authenticated;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);
