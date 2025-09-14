-- Add referral statistics functions

-- Function to get user referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  referral_code VARCHAR(20),
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  pending_earnings DECIMAL(10,2),
  paid_earnings DECIMAL(10,2),
  referral_link TEXT,
  code_created_at TIMESTAMP WITH TIME ZONE,
  last_referral_date TIMESTAMP WITH TIME ZONE,
  active_referrals BIGINT,
  completed_referrals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code as referral_code,
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0) as total_earnings,
    COALESCE(rc.total_earnings - COALESCE(SUM(rp.amount), 0), 0) as pending_earnings,
    COALESCE(SUM(rp.amount), 0) as paid_earnings,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
    rc.created_at as code_created_at,
    MAX(rt.created_at) as last_referral_date,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as active_referrals,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as completed_referrals
  FROM referral_codes rc
  LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
  LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
  WHERE rc.user_id = user_uuid
  GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's referral transactions
CREATE OR REPLACE FUNCTION get_user_referral_transactions(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  referred_user_id UUID,
  referred_user_phone TEXT,
  referral_code VARCHAR(20),
  amount DECIMAL(10,2),
  transaction_type VARCHAR(20),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id,
    rt.referred_id as referred_user_id,
    up.phone as referred_user_phone,
    rt.referral_code,
    rt.amount,
    rt.transaction_type,
    rt.status,
    rt.created_at
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  WHERE rt.referrer_id = user_uuid
  ORDER BY rt.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user's referral payouts
CREATE OR REPLACE FUNCTION get_user_referral_payouts(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  amount DECIMAL(10,2),
  status VARCHAR(20),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.amount,
    rp.status,
    rp.payment_method,
    rp.payment_reference,
    rp.created_at,
    rp.updated_at
  FROM referral_payouts rp
  WHERE rp.user_id = user_uuid
  ORDER BY rp.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(
  user_uuid UUID,
  custom_code VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  referral_code VARCHAR(20)
) AS $$
DECLARE
  generated_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  -- Generate or use custom code
  IF custom_code IS NOT NULL THEN
    -- Check if custom code is available
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = custom_code) INTO code_exists;
    IF code_exists THEN
      RETURN QUERY
      SELECT 
        false as success,
        'Referral code already exists' as message,
        NULL::VARCHAR as referral_code;
      RETURN;
    END IF;
    generated_code := custom_code;
  ELSE
    -- Generate random code
    generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM referral_codes WHERE code = generated_code) LOOP
      generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
    END LOOP;
  END IF;
  
  -- Insert referral code
  INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings, is_active)
  VALUES (user_uuid, generated_code, 0, 0, true)
  ON CONFLICT (user_id) DO UPDATE SET
    code = EXCLUDED.code,
    is_active = true,
    updated_at = NOW();
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Referral code created successfully' as message,
    generated_code;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error creating referral code: ' || SQLERRM as message,
      NULL::VARCHAR as referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to track referral signup
CREATE OR REPLACE FUNCTION track_referral_signup(
  referrer_uuid UUID,
  referred_uuid UUID,
  referral_code_used VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  transaction_id UUID
) AS $$
DECLARE
  new_transaction_id UUID;
  referrer_exists BOOLEAN;
  referred_exists BOOLEAN;
BEGIN
  -- Check if both users exist
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = referrer_uuid) INTO referrer_exists;
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = referred_uuid) INTO referred_exists;
  
  IF NOT referrer_exists THEN
    RETURN QUERY
    SELECT 
      false as success,
      'Referrer user not found' as message,
      NULL::UUID as transaction_id;
    RETURN;
  END IF;
  
  IF NOT referred_exists THEN
    RETURN QUERY
    SELECT 
      false as success,
      'Referred user not found' as message,
      NULL::UUID as transaction_id;
    RETURN;
  END IF;
  
  -- Insert referral transaction
  INSERT INTO referral_transactions (
    referrer_id, referred_id, referral_code, amount, transaction_type, status
  )
  VALUES (
    referrer_uuid, referred_uuid, referral_code_used, 10.00, 'signup', 'pending'
  )
  RETURNING id INTO new_transaction_id;
  
  -- Update referral code stats
  UPDATE referral_codes
  SET 
    total_referrals = total_referrals + 1,
    total_earnings = total_earnings + 10.00,
    updated_at = NOW()
  WHERE user_id = referrer_uuid AND code = referral_code_used;
  
  -- Return success
  RETURN QUERY
  SELECT 
    true as success,
    'Referral tracked successfully' as message,
    new_transaction_id;
    
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY
    SELECT 
      false as success,
      'Error tracking referral: ' || SQLERRM as message,
      NULL::UUID as transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on all new functions
GRANT EXECUTE ON FUNCTION get_user_referral_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_transactions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_payouts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_referral_code(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION track_referral_signup(UUID, UUID, VARCHAR) TO authenticated;
