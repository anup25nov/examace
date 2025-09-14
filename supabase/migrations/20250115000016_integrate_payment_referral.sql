-- Integrate payment completion with referral commission processing

-- 1. Drop and recreate the complete_payment function to process referral commissions
DROP FUNCTION IF EXISTS complete_payment(VARCHAR(100), VARCHAR(100), VARCHAR(100), VARCHAR(255), JSONB);

CREATE OR REPLACE FUNCTION complete_payment(
  p_payment_id VARCHAR(100),
  p_razorpay_payment_id VARCHAR(100),
  p_razorpay_order_id VARCHAR(100),
  p_razorpay_signature VARCHAR(255),
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  payment_id VARCHAR(100),
  user_id UUID,
  plan_id VARCHAR(50),
  commission_processed BOOLEAN,
  commission_amount DECIMAL(10,2)
) AS $$
DECLARE
  payment_record RECORD;
  membership_id UUID;
  commission_result RECORD;
BEGIN
  -- Get the payment record
  SELECT * INTO payment_record 
  FROM payments 
  WHERE payments.payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', p_payment_id, NULL::UUID, NULL::VARCHAR(50), false, 0.00::DECIMAL(10,2);
    RETURN;
  END IF;
  
  -- Update payment status
  UPDATE payments 
  SET 
    status = 'completed',
    razorpay_payment_id = p_razorpay_payment_id,
    razorpay_order_id = p_razorpay_order_id,
    razorpay_signature = p_razorpay_signature,
    metadata = p_metadata,
    updated_at = NOW()
  WHERE payments.payment_id = p_payment_id;
  
  -- Create user membership
  INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status)
  VALUES (
    payment_record.user_id,
    payment_record.plan_id,
    NOW(),
    NOW() + INTERVAL '1 month' * (
      SELECT duration_months FROM membership_plans WHERE id = payment_record.plan_id
    ),
    'active'
  )
  RETURNING id INTO membership_id;
  
  -- Create membership transaction
  INSERT INTO membership_transactions (
    user_id, 
    membership_id, 
    transaction_id, 
    amount, 
    currency, 
    status, 
    payment_method
  )
  VALUES (
    payment_record.user_id,
    membership_id,
    p_payment_id,
    payment_record.amount,
    payment_record.currency,
    'completed',
    payment_record.payment_method
  );
  
  -- Process referral commission
  SELECT * INTO commission_result
  FROM process_referral_commission(
    payment_record.user_id,
    payment_record.plan_id,
    payment_record.amount
  );
  
  RETURN QUERY SELECT 
    true, 
    'Payment completed successfully', 
    p_payment_id, 
    payment_record.user_id, 
    payment_record.plan_id,
    commission_result.success,
    COALESCE(commission_result.commission_amount, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create function to get user's referral dashboard data
CREATE OR REPLACE FUNCTION get_referral_dashboard(user_uuid UUID)
RETURNS TABLE (
  my_referral_code VARCHAR(20),
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  pending_earnings DECIMAL(10,2),
  paid_earnings DECIMAL(10,2),
  referral_link TEXT,
  recent_referrals JSONB,
  commission_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH referral_stats AS (
    SELECT 
      rc.code,
      rc.total_referrals,
      rc.total_earnings,
      COALESCE(rc.total_earnings - COALESCE(SUM(rp.amount), 0), 0) as pending,
      COALESCE(SUM(rp.amount), 0) as paid
    FROM referral_codes rc
    LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings
  ),
  recent_refs AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', rt.referred_id,
        'phone', up.phone,
        'signup_date', up.created_at,
        'status', rt.status,
        'commission', rt.commission_amount,
        'plan', um.plan_id
      ) ORDER BY up.created_at DESC
    ) as referrals
    FROM referral_transactions rt
    LEFT JOIN user_profiles up ON rt.referred_id = up.id
    LEFT JOIN user_memberships um ON rt.referred_id = um.user_id AND um.status = 'active'
    WHERE rt.referrer_id = user_uuid
  ),
  commission_breakdown AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'plan_id', rc.plan_id,
        'commission_percentage', rc.commission_percentage,
        'commission_amount', rc.commission_amount
      )
    ) as breakdown
    FROM referral_config rc
    WHERE rc.is_active = true
  )
  SELECT 
    rs.code,
    rs.total_referrals,
    rs.total_earnings,
    rs.pending,
    rs.paid,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rs.code) as referral_link,
    COALESCE(rr.referrals, '[]'::jsonb) as recent_referrals,
    COALESCE(cb.breakdown, '[]'::jsonb) as commission_breakdown
  FROM referral_stats rs, recent_refs rr, commission_breakdown cb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Drop and recreate function to get referral leaderboard
DROP FUNCTION IF EXISTS get_referral_leaderboard(INTEGER);

CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  phone TEXT,
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  referral_code VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY rc.total_referrals DESC, rc.total_earnings DESC)::INTEGER as rank,
    rc.user_id,
    up.phone,
    rc.total_referrals,
    rc.total_earnings,
    rc.code
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.total_referrals > 0
  ORDER BY rc.total_referrals DESC, rc.total_earnings DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_leaderboard(INTEGER) TO authenticated;
