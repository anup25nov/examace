-- Create robust referral system with automatic code generation and commission tracking

-- 1. First, fix the duplicate key issue by updating the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user doesn't already exist
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    updated_at = now();
  
  -- Automatically create a referral code for the new user
  INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
  VALUES (
    new.id, 
    UPPER(SUBSTRING(MD5(new.id::TEXT) FROM 1 FOR 8)), 
    0, 
    0.00
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create referral configuration table for commission rates
CREATE TABLE IF NOT EXISTS referral_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id VARCHAR(50) REFERENCES membership_plans(id),
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  commission_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default commission rates
INSERT INTO referral_config (plan_id, commission_percentage, commission_amount) VALUES
('free', 0.00, 0.00),
('premium', 15.00, NULL),
('pro', 20.00, NULL)
ON CONFLICT DO NOTHING;

-- 3. Create function to apply referral code during signup
CREATE OR REPLACE FUNCTION apply_referral_code(
  p_user_id UUID,
  p_referral_code VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  referrer_id UUID,
  referrer_code VARCHAR(20)
) AS $$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Find the referrer by code
  SELECT user_id, code INTO referrer_record
  FROM referral_codes 
  WHERE code = UPPER(p_referral_code);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::VARCHAR(20);
    RETURN;
  END IF;
  
  -- Check if user is trying to refer themselves
  IF referrer_record.user_id = p_user_id THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code', NULL::UUID, NULL::VARCHAR(20);
    RETURN;
  END IF;
  
  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    status,
    commission_amount,
    commission_percentage
  )
  VALUES (
    referrer_record.user_id,
    p_user_id,
    'pending',
    0.00,
    0.00
  );
  
  -- Update referrer's total referrals count
  UPDATE referral_codes 
  SET total_referrals = total_referrals + 1,
      updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id, referrer_record.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create function to process commission on membership purchase
CREATE OR REPLACE FUNCTION process_referral_commission(
  p_user_id UUID,
  p_plan_id VARCHAR(50),
  p_amount DECIMAL(10,2)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_amount DECIMAL(10,2),
  referrer_id UUID
) AS $$
DECLARE
  referral_record RECORD;
  config_record RECORD;
  commission_amount DECIMAL(10,2);
BEGIN
  -- Find the referral relationship
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No pending referral found', 0.00::DECIMAL(10,2), NULL::UUID;
    RETURN;
  END IF;
  
  -- Get commission configuration for the plan
  SELECT * INTO config_record
  FROM referral_config
  WHERE plan_id = p_plan_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No commission configuration found for this plan', 0.00::DECIMAL(10,2), NULL::UUID;
    RETURN;
  END IF;
  
  -- Calculate commission
  IF config_record.commission_amount IS NOT NULL THEN
    commission_amount := config_record.commission_amount;
  ELSE
    commission_amount := (p_amount * config_record.commission_percentage) / 100;
  END IF;
  
  -- Update referral transaction
  UPDATE referral_transactions
  SET 
    status = 'completed',
    commission_amount = commission_amount,
    commission_percentage = config_record.commission_percentage,
    completed_at = NOW()
  WHERE id = referral_record.id;
  
  -- Update referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = total_earnings + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;
  
  -- Create referral payout record
  INSERT INTO referral_payouts (
    user_id,
    referral_transaction_id,
    amount,
    status,
    description
  )
  VALUES (
    referral_record.referrer_id,
    referral_record.id,
    commission_amount,
    'pending',
    'Commission from ' || p_plan_id || ' membership purchase'
  );
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount, referral_record.referrer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to get user's referral network
CREATE OR REPLACE FUNCTION get_user_referral_network(user_uuid UUID)
RETURNS TABLE (
  referred_user_id UUID,
  referred_phone TEXT,
  signup_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20),
  commission_earned DECIMAL(10,2),
  membership_plan VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    up.phone,
    up.created_at,
    rt.status,
    rt.commission_amount,
    um.plan_id
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN user_memberships um ON rt.referred_id = um.user_id AND um.status = 'active'
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create function to validate referral code
CREATE OR REPLACE FUNCTION validate_referral_code(p_referral_code VARCHAR(20))
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  referrer_id UUID,
  referrer_phone TEXT
) AS $$
DECLARE
  referrer_record RECORD;
BEGIN
  -- Find the referrer by code
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code);
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Valid referral code', referrer_record.user_id, referrer_record.phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION apply_referral_code(UUID, VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_commission(UUID, VARCHAR(50), DECIMAL(10,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_network(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_referral_code(VARCHAR(20)) TO authenticated;

-- 8. Enable RLS for referral_config
ALTER TABLE referral_config ENABLE ROW LEVEL SECURITY;

-- Create policy for referral_config (admin only for now)
CREATE POLICY "Admin can manage referral config" ON referral_config
  FOR ALL USING (false); -- Will be updated when admin system is implemented
