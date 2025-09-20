-- Essential changes for Step2Sarkari
-- Apply these changes directly in Supabase SQL Editor

-- 1. Update membership plans to new pricing
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active, display_order, currency) VALUES
('pro_plus', 'Pro Plus Plan', 'Complete access to all mocks and features', 299, 12, 365, 9999, '["12 months validity", "Unlimited mock tests", "Premium PYQs", "Detailed Solutions", "Priority Support", "Advanced Analytics"]', true, 1, 'INR')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  duration_months = EXCLUDED.duration_months, 
  duration_days = EXCLUDED.duration_days, 
  mock_tests = EXCLUDED.mock_tests, 
  features = EXCLUDED.features, 
  is_active = EXCLUDED.is_active, 
  display_order = EXCLUDED.display_order, 
  currency = EXCLUDED.currency, 
  updated_at = NOW();

INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active, display_order, currency) VALUES
('pro', 'Pro Plan', 'Access to 11 mock tests', 99, 3, 90, 11, '["3 months validity", "11 mock tests", "Premium PYQs", "Detailed Solutions", "Performance Analytics"]', true, 2, 'INR')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  price = EXCLUDED.price, 
  duration_months = EXCLUDED.duration_months, 
  duration_days = EXCLUDED.duration_days, 
  mock_tests = EXCLUDED.mock_tests, 
  features = EXCLUDED.features, 
  is_active = EXCLUDED.is_active, 
  display_order = EXCLUDED.display_order, 
  currency = EXCLUDED.currency, 
  updated_at = NOW();

-- 2. Update commission system to use 50% commission
-- Drop and recreate process_referral_commission function
DROP FUNCTION IF EXISTS process_referral_commission(UUID, VARCHAR, DECIMAL, UUID);

CREATE OR REPLACE FUNCTION process_referral_commission(
  p_user_id UUID,
  p_plan_id VARCHAR(50),
  p_amount DECIMAL(10,2),
  p_membership_transaction_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  referral_record RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 50.00; -- 50% commission
BEGIN
  -- Find the referral relationship for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No pending referral found, no commission to process', 0.00;
    RETURN;
  END IF;

  -- Check if this is the first membership purchase for the referred user
  IF referral_record.first_membership_only THEN
    IF EXISTS (
      SELECT 1 FROM user_memberships um
      WHERE um.user_id = p_user_id
      AND um.status = 'active'
      AND um.end_date > NOW()
      AND um.id != p_membership_transaction_id
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;

  -- Calculate commission
  commission_amount := (p_amount * commission_percentage / 100);

  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    membership_transaction_id,
    commission_amount,
    commission_percentage,
    membership_plan,
    membership_amount,
    status,
    is_first_membership
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_membership_transaction_id,
    commission_amount,
    commission_percentage,
    p_plan_id,
    p_amount,
    'pending',
    referral_record.first_membership_only
  );

  -- Update referral transaction
  UPDATE referral_transactions
  SET
    status = 'completed',
    amount = p_amount,
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

-- 3. Update withdrawal limits to use 100 as minimum
-- Update the get_user_referral_earnings function to use 100 as minimum withdrawal
DROP FUNCTION IF EXISTS get_user_referral_earnings(UUID);

CREATE OR REPLACE FUNCTION get_user_referral_earnings(user_uuid UUID)
RETURNS TABLE (
  total_earnings DECIMAL(10,2),
  pending_earnings DECIMAL(10,2),
  paid_earnings DECIMAL(10,2),
  available_for_withdrawal DECIMAL(10,2),
  min_withdrawal_amount DECIMAL(10,2),
  can_withdraw BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(rc.total_earnings, 0.00) as total_earnings,
    COALESCE(SUM(rc_comm.commission_amount), 0.00) as pending_earnings,
    COALESCE(SUM(rp.amount), 0.00) as paid_earnings,
    GREATEST(0.00, COALESCE(SUM(rc_comm.commission_amount), 0.00) - COALESCE(SUM(rp.amount), 0.00)) as available_for_withdrawal,
    100.00 as min_withdrawal_amount,
    (COALESCE(SUM(rc_comm.commission_amount), 0.00) - COALESCE(SUM(rp.amount), 0.00)) >= 100.00 as can_withdraw
  FROM referral_codes rc
  LEFT JOIN referral_commissions rc_comm ON rc.user_id = rc_comm.referrer_id AND rc_comm.status = 'pending'
  LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
  WHERE rc.user_id = user_uuid
  GROUP BY rc.total_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update request_withdrawal function to use new minimum
DROP FUNCTION IF EXISTS request_withdrawal(UUID, DECIMAL, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION request_withdrawal(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_withdrawal_method VARCHAR(50),
  p_account_details TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  withdrawal_id UUID
) AS $$
DECLARE
  earnings_info RECORD;
  withdrawal_id UUID;
BEGIN
  -- Get user's earnings info
  SELECT * INTO earnings_info
  FROM get_user_referral_earnings(p_user_id);

  -- Check if user can withdraw
  IF NOT earnings_info.can_withdraw THEN
    RETURN QUERY SELECT false, 'Insufficient balance for withdrawal. Minimum required: ₹100', NULL::UUID;
    RETURN;
  END IF;

  -- Check if amount is valid
  IF p_amount < 100.00 THEN
    RETURN QUERY SELECT false, 'Minimum withdrawal amount is ₹100', NULL::UUID;
    RETURN;
  END IF;

  IF p_amount > earnings_info.available_for_withdrawal THEN
    RETURN QUERY SELECT false, 'Amount exceeds available balance', NULL::UUID;
    RETURN;
  END IF;

  -- Create withdrawal request
  withdrawal_id := gen_random_uuid();

  INSERT INTO referral_payouts (
    id,
    user_id,
    amount,
    status,
    withdrawal_method,
    account_details,
    description
  ) VALUES (
    withdrawal_id,
    p_user_id,
    p_amount,
    'pending',
    p_withdrawal_method,
    p_account_details,
    'Withdrawal request for referral earnings'
  );

  RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
