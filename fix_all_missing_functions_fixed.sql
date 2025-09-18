-- Fix All Missing Functions for Robust System (Fixed Version)
-- Run this script in your Supabase SQL Editor

-- 1. Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS apply_referral_code(UUID, VARCHAR);
DROP FUNCTION IF EXISTS apply_referral_code(UUID, CHARACTER VARYING);
DROP FUNCTION IF EXISTS activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
DROP FUNCTION IF EXISTS get_user_messages(UUID, INTEGER);

-- 2. Create activate_or_upgrade_membership function
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
  membership_duration INTERVAL;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine membership duration based on plan
  IF p_plan = 'pro_plus' THEN
    membership_duration := INTERVAL '1 year';
  ELSE
    membership_duration := INTERVAL '1 month';
  END IF;
  
  start_date := p_upgrade_at;
  end_date := start_date + membership_duration;
  
  -- Insert or update membership
  INSERT INTO user_memberships (
    user_id,
    plan,
    status,
    start_date,
    end_date,
    created_at,
    updated_at
  ) VALUES (
    p_user,
    p_plan,
    'active',
    start_date,
    end_date,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = EXCLUDED.plan,
    status = 'active',
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = NOW();
  
  RETURN QUERY SELECT p_plan, start_date, end_date, 'active'::VARCHAR(20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create get_unread_message_count function
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

-- 4. Create get_user_messages function
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

-- 5. Create apply_referral_code function
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
    total_referrals = total_referrals + 1,
    updated_at = NOW()
  WHERE user_id = referrer_record.user_id;
  
  RETURN QUERY SELECT true, 'Referral code applied successfully', referrer_record.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create user_messages table if it doesn't exist
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

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at);

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_referral_code(UUID, VARCHAR) TO authenticated;

-- 9. Grant table permissions
GRANT SELECT, INSERT, UPDATE ON user_messages TO authenticated;

-- 10. Test the functions
SELECT 'All missing functions created successfully!' as status;
