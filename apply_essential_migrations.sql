-- Essential migrations for Step2Sarkari
-- This script applies only the essential database changes

-- 1. Update membership plans to new pricing
INSERT INTO membership_plans (id, name, description, price, duration_months, duration_days, mock_tests, features, is_active, display_order, currency) VALUES
('pro_plus', 'Pro Plus Plan', 'Complete access to all mocks and features', 299, 12, 365, 9999, '{"12 months validity", "Unlimited mock tests", "Premium PYQs", "Detailed Solutions", "Priority Support", "Advanced Analytics"}', true, 1, 'INR')
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
('pro', 'Pro Plan', 'Access to 11 mock tests', 99, 3, 90, 11, '{"3 months validity", "11 mock tests", "Premium PYQs", "Detailed Solutions", "Performance Analytics"}', true, 2, 'INR')
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

-- 3. Update withdrawal limits to use configurable values
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

-- 5. Ensure all tables exist with proper structure
-- Create referral_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_used VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT 0.00,
  commission_amount DECIMAL(10,2) DEFAULT 0.00,
  commission_status VARCHAR(20) DEFAULT 'pending',
  membership_purchased BOOLEAN DEFAULT FALSE,
  first_membership_only BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_commissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_transaction_id UUID,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  membership_plan VARCHAR(50),
  membership_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  is_first_membership BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  withdrawal_method VARCHAR(50),
  account_details TEXT,
  description TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS membership_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
  transaction_id VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS membership_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  mock_tests INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_id ON referral_commissions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_user_id ON membership_transactions(user_id);

-- 7. Add RLS policies if they don't exist
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON referral_codes;
CREATE POLICY "Users can view their own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral codes" ON referral_codes;
CREATE POLICY "Users can insert their own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for referral_transactions
DROP POLICY IF EXISTS "Users can view their own referral transactions" ON referral_transactions;
CREATE POLICY "Users can view their own referral transactions" ON referral_transactions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- RLS policies for referral_commissions
DROP POLICY IF EXISTS "Users can view their own referral commissions" ON referral_commissions;
CREATE POLICY "Users can view their own referral commissions" ON referral_commissions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- RLS policies for referral_payouts
DROP POLICY IF EXISTS "Users can view their own referral payouts" ON referral_payouts;
CREATE POLICY "Users can view their own referral payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own referral payouts" ON referral_payouts;
CREATE POLICY "Users can insert their own referral payouts" ON referral_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON user_memberships;
CREATE POLICY "Users can view their own memberships" ON user_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for membership_plans
DROP POLICY IF EXISTS "Anyone can view membership plans" ON membership_plans;
CREATE POLICY "Anyone can view membership plans" ON membership_plans
  FOR SELECT USING (true);

-- 8. Create trigger to auto-generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'S2S' || UPPER(SUBSTRING(NEW.user_id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_referral_code ON referral_codes;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- 9. Create function to validate and apply referral codes
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
  -- Validate referral code format
  IF p_referral_code IS NULL OR LENGTH(p_referral_code) < 8 THEN
    RETURN QUERY SELECT false, 'Invalid referral code format', NULL::UUID;
    RETURN;
  END IF;

  -- Find referrer by code
  SELECT rc.user_id INTO referrer_record
  FROM referral_codes rc
  WHERE rc.code = UPPER(p_referral_code)
  AND rc.user_id != p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Referral code not found or invalid', NULL::UUID;
    RETURN;
  END IF;

  -- Check if user already has a referrer
  IF EXISTS (
    SELECT 1 FROM referral_transactions rt
    WHERE rt.referred_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
    RETURN;
  END IF;

  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    referral_code_used,
    status
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    UPPER(p_referral_code),
    'pending'
  );

  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
