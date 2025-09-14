-- Enhanced Referral System with all requirements
-- This migration implements the complete referral system as specified

-- 1. Update user_profiles table to track referral status
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_applied_at TIMESTAMP WITH TIME ZONE;

-- 2. Update referral_transactions table to track commission status
ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS commission_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS membership_purchased BOOLEAN DEFAULT FALSE;
ALTER TABLE referral_transactions ADD COLUMN IF NOT EXISTS first_membership_only BOOLEAN DEFAULT TRUE;

-- 3. Create referral_commissions table for detailed commission tracking
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  membership_transaction_id UUID REFERENCES membership_transactions(id) ON DELETE CASCADE,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  membership_plan VARCHAR(50) NOT NULL,
  membership_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled, refunded
  is_first_membership BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id, membership_transaction_id)
);

-- 4. Create function to validate and apply referral code during signup
CREATE OR REPLACE FUNCTION validate_and_apply_referral_code(
  p_user_id UUID,
  p_referral_code VARCHAR(20)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  referrer_id UUID,
  referrer_phone TEXT
) AS $$
DECLARE
  referrer_record RECORD;
  user_record RECORD;
  existing_referral RECORD;
BEGIN
  -- Check if user already has a referral code applied
  SELECT * INTO user_record FROM user_profiles WHERE id = p_user_id;
  
  IF user_record.referral_code_applied THEN
    RETURN QUERY SELECT false, 'Referral code already applied', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if user is trying to use their own referral code
  SELECT rc.user_id INTO referrer_record
  FROM referral_codes rc
  WHERE rc.code = UPPER(p_referral_code) AND rc.user_id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Find the referrer by code
  SELECT rc.user_id, up.phone INTO referrer_record
  FROM referral_codes rc
  LEFT JOIN user_profiles up ON rc.user_id = up.id
  WHERE rc.code = UPPER(p_referral_code) AND rc.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code', NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if there's already a referral transaction for this user
  SELECT * INTO existing_referral
  FROM referral_transactions
  WHERE referred_id = p_user_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT false, 'Referral code already applied', NULL::UUID, NULL::TEXT;
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
    'signup',
    'pending',
    0.00,
    'pending',
    TRUE
  );
  
  -- Update referrer's total referrals count
  UPDATE referral_codes 
  SET 
    total_referrals = total_referrals + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id, referrer_record.phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create function to process commission when membership is purchased
CREATE OR REPLACE FUNCTION process_membership_commission(
  p_user_id UUID,
  p_membership_transaction_id UUID,
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
  commission_config RECORD;
  commission_amount DECIMAL(10,2) := 0.00;
  commission_percentage DECIMAL(5,2) := 0.00;
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
      SELECT 1 FROM membership_transactions mt
      JOIN user_memberships um ON mt.membership_id = um.id
      WHERE mt.user_id = p_user_id 
      AND mt.status = 'completed'
      AND mt.id != p_membership_transaction_id
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;
  
  -- Get commission configuration for the plan
  SELECT commission_percentage, commission_amount INTO commission_config
  FROM referral_config
  WHERE plan_id = p_membership_plan AND is_active = true;
  
  IF NOT FOUND THEN
    -- Default commission if no specific config found
    commission_percentage := 10.00;
  ELSE
    commission_percentage := commission_config.commission_percentage;
    IF commission_config.commission_amount IS NOT NULL THEN
      commission_amount := commission_config.commission_amount;
    ELSE
      commission_amount := (p_membership_amount * commission_percentage / 100);
    END IF;
  END IF;
  
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

-- 6. Create function to handle membership cancellation/refund
CREATE OR REPLACE FUNCTION handle_membership_refund(
  p_membership_transaction_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  commission_revoked DECIMAL(10,2)
) AS $$
DECLARE
  commission_record RECORD;
  revoked_amount DECIMAL(10,2) := 0.00;
BEGIN
  -- Find the commission record
  SELECT * INTO commission_record
  FROM referral_commissions
  WHERE membership_transaction_id = p_membership_transaction_id
  AND status IN ('pending', 'paid');
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No commission found to revoke', 0.00;
    RETURN;
  END IF;
  
  revoked_amount := commission_record.commission_amount;
  
  -- Update commission status to refunded
  UPDATE referral_commissions
  SET 
    status = 'refunded',
    updated_at = NOW()
  WHERE id = commission_record.id;
  
  -- Update referral transaction
  UPDATE referral_transactions
  SET 
    commission_status = 'refunded',
    updated_at = NOW()
  WHERE referred_id = commission_record.referred_id
  AND commission_amount = commission_record.commission_amount;
  
  -- Deduct from referrer's total earnings
  UPDATE referral_codes
  SET 
    total_earnings = GREATEST(0, total_earnings - revoked_amount),
    updated_at = NOW()
  WHERE user_id = commission_record.referrer_id;
  
  RETURN QUERY SELECT true, 'Commission revoked successfully', revoked_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create function to get detailed referral network with masked phones
CREATE OR REPLACE FUNCTION get_referral_network_detailed(user_uuid UUID)
RETURNS TABLE (
  referred_user_id UUID,
  referred_phone_masked TEXT,
  signup_date TIMESTAMP WITH TIME ZONE,
  referral_status VARCHAR(20),
  commission_status VARCHAR(20),
  commission_amount DECIMAL(10,2),
  membership_plan VARCHAR(50),
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
        SUBSTRING(up.phone, 1, 3) || '****' || SUBSTRING(up.phone, LENGTH(up.phone) - 2)
      ELSE up.phone
    END as referred_phone_masked,
    up.created_at,
    rt.status as referral_status,
    COALESCE(rc.status, 'pending') as commission_status,
    COALESCE(rc.commission_amount, 0.00) as commission_amount,
    COALESCE(rc.membership_plan, 'none') as membership_plan,
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

-- 8. Create function to get comprehensive referral stats
CREATE OR REPLACE FUNCTION get_comprehensive_referral_stats(user_uuid UUID)
RETURNS TABLE (
  referral_code VARCHAR(20),
  total_referrals INTEGER,
  total_commissions_earned DECIMAL(10,2),
  paid_commissions DECIMAL(10,2),
  pending_commissions DECIMAL(10,2),
  cancelled_commissions DECIMAL(10,2),
  active_referrals INTEGER,
  completed_referrals INTEGER,
  pending_referrals INTEGER,
  referral_link TEXT,
  code_created_at TIMESTAMP WITH TIME ZONE,
  last_referral_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code as referral_code,
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'paid' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as paid_commissions,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'pending' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as pending_commissions,
    COALESCE(SUM(CASE WHEN rc_comm.status = 'refunded' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as cancelled_commissions,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as active_referrals,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as completed_referrals,
    COUNT(CASE WHEN rt.status = 'pending' AND rt.membership_purchased = false THEN 1 END) as pending_referrals,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
    rc.created_at as code_created_at,
    MAX(rt.created_at) as last_referral_date
  FROM referral_codes rc
  LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
  LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
  WHERE rc.user_id = user_uuid
  GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION validate_and_apply_referral_code(UUID, VARCHAR(20)) TO authenticated;
GRANT EXECUTE ON FUNCTION process_membership_commission(UUID, UUID, VARCHAR(50), DECIMAL(10,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_membership_refund(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_referral_stats(UUID) TO authenticated;

-- 10. Enable RLS for new tables
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies for referral_commissions
CREATE POLICY "Users can view own referral commissions" ON referral_commissions
  FOR SELECT USING (referrer_id = auth.uid());

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_id ON referral_commissions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code_used ON user_profiles(referral_code_used);
