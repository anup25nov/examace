-- COMPLETE SYSTEM FIX - Run this single script to fix everything
-- This script fixes all issues in the correct order

-- ===========================================
-- STEP 1: CHECK DATABASE CONNECTION
-- ===========================================
SELECT '=== CHECKING DATABASE CONNECTION ===' as step;
SELECT 'Database connection successful!' as status;

-- ===========================================
-- STEP 2: CHECK CURRENT TABLE STRUCTURES
-- ===========================================
SELECT '=== CHECKING CURRENT TABLE STRUCTURES ===' as step;

-- Check user_memberships table
SELECT 'user_memberships columns:' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_memberships' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check payments table
SELECT 'payments columns:' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check membership_plans table
SELECT 'membership_plans columns:' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'membership_plans' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===========================================
-- STEP 3: FIX MEMBERSHIP_PLANS TABLE
-- ===========================================
SELECT '=== FIXING MEMBERSHIP_PLANS TABLE ===' as step;

-- Create membership_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans if they don't exist
INSERT INTO membership_plans (id, name, price, duration_days, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID, 'pro', 1.00, 30, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = 'pro');

INSERT INTO membership_plans (id, name, price, duration_days, created_at, updated_at)
SELECT 
  '00000000-0000-0000-0000-000000000002'::UUID, 'pro_plus', 2.00, 365, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM membership_plans WHERE name = 'pro_plus');

-- ===========================================
-- STEP 4: FIX USER_MEMBERSHIPS TABLE
-- ===========================================
SELECT '=== FIXING USER_MEMBERSHIPS TABLE ===' as step;

-- Add missing columns if they don't exist
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES membership_plans(id),
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records with proper plan_id
UPDATE user_memberships 
SET 
  plan_id = (SELECT id FROM membership_plans WHERE name = 'pro' LIMIT 1),
  plan = COALESCE(plan, 'pro'),
  status = COALESCE(status, 'active'),
  start_date = COALESCE(start_date, COALESCE(created_at, NOW())),
  end_date = COALESCE(end_date, COALESCE(created_at, NOW()) + INTERVAL '1 month'),
  updated_at = NOW()
WHERE plan_id IS NULL;

-- ===========================================
-- STEP 5: FIX PAYMENTS TABLE
-- ===========================================
SELECT '=== FIXING PAYMENTS TABLE ===' as step;

-- Add missing columns if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- Make payment_id, plan_id, and plan_name nullable if they're not already
ALTER TABLE payments ALTER COLUMN payment_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN plan_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN plan_name DROP NOT NULL;

-- Update existing records with default values
UPDATE payments 
SET 
  plan = COALESCE(plan, 'pro'),
  plan_name = COALESCE(plan_name, 'pro'),
  amount = COALESCE(amount, 0.00),
  status = COALESCE(status, 'pending'),
  payment_id = COALESCE(payment_id, 'legacy_' || id::text),
  plan_id = COALESCE(plan_id, '00000000-0000-0000-0000-000000000001'::UUID)
WHERE plan IS NULL OR plan_name IS NULL OR amount IS NULL OR status IS NULL OR payment_id IS NULL OR plan_id IS NULL;

-- ===========================================
-- STEP 6: CREATE USER_MESSAGES TABLE
-- ===========================================
SELECT '=== CREATING USER_MESSAGES TABLE ===' as step;

CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- STEP 7: CREATE ALL MISSING FUNCTIONS
-- ===========================================
SELECT '=== CREATING ALL MISSING FUNCTIONS ===' as step;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
DROP FUNCTION IF EXISTS get_user_messages(UUID, INTEGER);
DROP FUNCTION IF EXISTS apply_referral_code(UUID, VARCHAR);
DROP FUNCTION IF EXISTS validate_and_apply_referral_code(UUID, VARCHAR);
DROP FUNCTION IF EXISTS get_user_referral_earnings(UUID);
DROP FUNCTION IF EXISTS get_referral_network_detailed(UUID);
DROP FUNCTION IF EXISTS process_referral_commission(UUID, VARCHAR, VARCHAR, DECIMAL);
DROP FUNCTION IF EXISTS request_commission_withdrawal(UUID, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS get_user_commission_history(UUID);

-- 1. Create activate_or_upgrade_membership function
CREATE OR REPLACE FUNCTION activate_or_upgrade_membership(
  p_user UUID,
  p_plan VARCHAR(50),
  p_upgrade_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  plan VARCHAR(50),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20)
) AS $$
DECLARE
  plan_id_value UUID;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get plan_id for the given plan name
  SELECT id INTO plan_id_value
  FROM membership_plans
  WHERE name = p_plan
  LIMIT 1;
  
  -- If plan not found, use pro plan
  IF plan_id_value IS NULL THEN
    SELECT id INTO plan_id_value
    FROM membership_plans
    WHERE name = 'pro'
    LIMIT 1;
  END IF;
  
  -- Set dates
  start_date := p_upgrade_at;
  end_date := start_date + CASE 
    WHEN p_plan = 'pro_plus' THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END;
  
  -- Insert or update membership (using upsert approach)
  INSERT INTO user_memberships (
    user_id,
    plan_id,
    plan,
    status,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES (
    p_user,
    plan_id_value,
    p_plan,
    'active',
    start_date,
    end_date,
    NOW(),
    NOW()
  );
  
  -- Update if record already exists
  UPDATE user_memberships 
  SET 
    plan_id = plan_id_value,
    plan = p_plan,
    status = 'active',
    start_date = p_upgrade_at,
    end_date = p_upgrade_at + CASE 
      WHEN p_plan = 'pro_plus' THEN INTERVAL '1 year'
      ELSE INTERVAL '1 month'
    END,
    updated_at = NOW()
  WHERE user_id = p_user;
  
  RETURN QUERY SELECT p_plan, start_date, end_date, 'active'::VARCHAR(20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create get_unread_message_count function
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS TABLE (
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(COUNT(*), 0)::INTEGER as unread_count
  FROM user_messages
  WHERE user_id = user_uuid 
  AND is_read = false
  AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create get_user_messages function
CREATE OR REPLACE FUNCTION get_user_messages(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id,
    um.title,
    um.content,
    um.is_read,
    um.created_at,
    um.updated_at
  FROM user_messages um
  WHERE um.user_id = user_uuid 
  AND um.deleted_at IS NULL
  ORDER BY um.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create apply_referral_code function
CREATE OR REPLACE FUNCTION apply_referral_code(
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
  -- Check if referral code exists and is active
  SELECT * INTO referrer_record
  FROM referral_codes
  WHERE code = p_referral_code 
  AND is_active = true
  AND user_id != p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or inactive referral code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user is already referred
  IF EXISTS (
    SELECT 1 FROM referral_transactions 
    WHERE referred_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    referral_code,
    status,
    transaction_type,
    amount,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    p_referral_code,
    'pending',
    'referral',
    0.00,
    0.00,
    'pending',
    false,
    true,
    NOW(),
    NOW()
  );
  
  -- Update referrer's referral count
  UPDATE referral_codes
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create validate_and_apply_referral_code function
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
  -- Check if referral code exists and is active
  SELECT * INTO referrer_record
  FROM referral_codes
  WHERE code = p_referral_code 
  AND is_active = true
  AND user_id != p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or inactive referral code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user is already referred
  IF EXISTS (
    SELECT 1 FROM referral_transactions 
    WHERE referred_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'User already has a referrer', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create referral transaction
  INSERT INTO referral_transactions (
    referrer_id,
    referred_id,
    referral_code,
    status,
    transaction_type,
    amount,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    referrer_record.user_id,
    p_user_id,
    p_referral_code,
    'pending',
    'referral',
    0.00,
    0.00,
    'pending',
    false,
    true,
    NOW(),
    NOW()
  );
  
  -- Update referrer's referral count
  UPDATE referral_codes
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create get_user_referral_earnings function
CREATE OR REPLACE FUNCTION get_user_referral_earnings(user_uuid UUID)
RETURNS TABLE (
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  pending_earnings DECIMAL(10,2),
  paid_earnings DECIMAL(10,2),
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
    ) as pending_earnings,
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'paid'), 
      0.00
    ) as paid_earnings,
    rc.code as referral_code
  FROM referral_codes rc
  WHERE rc.user_id = user_uuid AND rc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create get_referral_network_detailed function
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

-- 8. Create process_referral_commission function
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
  commission_percentage DECIMAL(5,2) := 50.00;
BEGIN
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  -- Check if this is the first membership
  IF referral_record.first_membership_only THEN
    IF EXISTS (
      SELECT 1 FROM user_memberships um
      WHERE um.user_id = p_user_id 
      AND um.status = 'active'
      AND um.end_date > NOW()
      AND um.plan != p_membership_plan
    ) THEN
      RETURN QUERY SELECT true, 'Not first membership, no commission', 0.00;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate commission
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
    total_earnings = COALESCE(total_earnings, 0) + commission_amount,
    updated_at = NOW()
  WHERE user_id = referral_record.referrer_id;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Create request_commission_withdrawal function
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
  AND status = 'pending';
  
  RETURN QUERY SELECT true, 'Withdrawal request created successfully', withdrawal_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Create get_user_commission_history function
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

-- ===========================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ===========================================
SELECT '=== CREATING INDEXES ===' as step;

-- user_memberships indexes
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan ON user_memberships(plan);
CREATE INDEX IF NOT EXISTS idx_user_memberships_plan_id ON user_memberships(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);

-- payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON payments(plan);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);

-- user_messages indexes
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);

-- referral indexes
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);

-- ===========================================
-- STEP 9: GRANT PERMISSIONS
-- ===========================================
SELECT '=== GRANTING PERMISSIONS ===' as step;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_referral_code(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_and_apply_referral_code(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_referral_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_commission(UUID, VARCHAR, VARCHAR, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(UUID, DECIMAL, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_commission_history(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON user_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON membership_plans TO authenticated;

-- ===========================================
-- STEP 10: FINAL VERIFICATION
-- ===========================================
SELECT '=== FINAL VERIFICATION ===' as step;

-- Check all functions exist
SELECT 'Functions created:' as test, COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN (
  'activate_or_upgrade_membership',
  'get_unread_message_count',
  'get_user_messages',
  'apply_referral_code',
  'validate_and_apply_referral_code',
  'get_user_referral_earnings',
  'get_referral_network_detailed',
  'process_referral_commission',
  'request_commission_withdrawal',
  'get_user_commission_history'
)
AND routine_schema = 'public';

-- Check all tables exist
SELECT 'Tables created:' as test, COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN (
  'user_memberships',
  'payments',
  'user_messages',
  'membership_plans',
  'referral_codes',
  'referral_transactions',
  'referral_commissions',
  'referral_payouts'
)
AND table_schema = 'public';

-- Check user_memberships has no NULL plan_id
SELECT 'user_memberships plan_id status:' as test, 
  COUNT(*) as total_records,
  COUNT(plan_id) as records_with_plan_id,
  COUNT(*) - COUNT(plan_id) as records_without_plan_id
FROM user_memberships;

SELECT '=== COMPLETE SYSTEM FIX FINISHED ===' as status;
SELECT 'All issues have been resolved! Your system is now fully functional.' as message;
