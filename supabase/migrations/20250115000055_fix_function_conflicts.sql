-- Fix function conflicts by dropping and recreating functions with correct signatures

-- Drop existing functions that have conflicts
DROP FUNCTION IF EXISTS get_user_referral_earnings(UUID);
DROP FUNCTION IF EXISTS get_referral_network_detailed(UUID);
DROP FUNCTION IF EXISTS request_withdrawal(UUID, DECIMAL, VARCHAR, TEXT);

-- Recreate get_user_referral_earnings function
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

-- Recreate get_referral_network_detailed function
CREATE OR REPLACE FUNCTION get_referral_network_detailed(user_uuid UUID)
RETURNS TABLE (
  referred_user_id UUID,
  referred_phone_masked TEXT,
  signup_date TIMESTAMP WITH TIME ZONE,
  referral_status TEXT,
  commission_status TEXT,
  commission_amount DECIMAL(10,2),
  membership_plan TEXT,
  membership_amount DECIMAL(10,2),
  membership_date TIMESTAMP WITH TIME ZONE,
  is_first_membership BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    CASE 
      WHEN LENGTH(up.phone) >= 10 THEN 
        (SUBSTRING(up.phone, 1, 3) || '****' || SUBSTRING(up.phone, LENGTH(up.phone) - 2))::TEXT
      ELSE up.phone::TEXT
    END as referred_phone_masked,
    up.created_at,
    rt.status::TEXT as referral_status,
    COALESCE(rc.status, 'pending')::TEXT as commission_status,
    COALESCE(rc.commission_amount, 0.00) as commission_amount,
    COALESCE(rc.membership_plan, 'none')::TEXT as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    COALESCE(rc.created_at, up.created_at) as membership_date,
    COALESCE(rc.is_first_membership, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate request_withdrawal function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_referral_earnings(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION request_withdrawal(UUID, DECIMAL, VARCHAR, TEXT) TO authenticated, anon;
