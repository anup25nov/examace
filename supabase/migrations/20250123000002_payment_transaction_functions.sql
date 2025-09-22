-- Payment Transaction Functions
-- This migration creates functions to handle payment and membership transactions atomically

-- ==============================================
-- 1. PROCESS PAYMENT AND MEMBERSHIP FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION process_payment_and_membership(
  p_payment_id UUID,
  p_payment_gateway_id VARCHAR(255),
  p_user_id UUID,
  p_plan_id VARCHAR(50),
  p_amount DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
  v_plan RECORD;
  v_membership_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Get plan details
    SELECT * INTO v_plan
    FROM membership_plans
    WHERE id = p_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Plan not found or inactive'
      );
    END IF;
    
    -- Calculate membership expiry
    v_expires_at := NOW() + INTERVAL '1 day' * v_plan.duration_days;
    
    -- Update payment status
    UPDATE membership_transactions
    SET 
      status = 'completed',
      gateway_payment_id = p_payment_gateway_id,
      completed_at = NOW()
    WHERE id = p_payment_id;
    
    -- Create or update user membership
    INSERT INTO user_memberships (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      created_at
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      NOW(),
      v_expires_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = p_plan_id,
      status = 'active',
      starts_at = NOW(),
      expires_at = v_expires_at,
      updated_at = NOW();
    
    -- Update user profile with membership info
    UPDATE user_profiles
    SET 
      membership_plan = p_plan_id,
      membership_expiry = v_expires_at,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Return success
    RETURN jsonb_build_object(
      'success', true,
      'membership_id', (SELECT id FROM user_memberships WHERE user_id = p_user_id),
      'expires_at', v_expires_at
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. VERIFY PAYMENT WEBHOOK FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION verify_payment_webhook(
  p_razorpay_signature VARCHAR(255),
  p_razorpay_payment_id VARCHAR(255),
  p_razorpay_order_id VARCHAR(255),
  p_webhook_secret TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_signature TEXT;
  v_payload TEXT;
BEGIN
  -- Create payload for signature verification
  v_payload := p_razorpay_order_id || '|' || p_razorpay_payment_id;
  
  -- Generate expected signature
  v_signature := encode(hmac(v_payload, p_webhook_secret, 'sha256'), 'hex');
  
  -- Compare signatures
  RETURN v_signature = p_razorpay_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 3. GET USER MEMBERSHIP STATUS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION get_user_membership_status(p_user_id UUID)
RETURNS TABLE(
  membership_plan VARCHAR(50),
  membership_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.membership_plan,
    up.membership_expiry,
    CASE 
      WHEN up.membership_expiry IS NULL THEN false
      WHEN up.membership_expiry > NOW() THEN true
      ELSE false
    END as is_active,
    CASE 
      WHEN up.membership_expiry IS NULL THEN 0
      WHEN up.membership_expiry > NOW() THEN EXTRACT(DAYS FROM up.membership_expiry - NOW())::INTEGER
      ELSE 0
    END as days_remaining
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. CANCEL MEMBERSHIP FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION cancel_user_membership(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'User requested cancellation'
)
RETURNS JSONB AS $$
DECLARE
  v_membership_id UUID;
BEGIN
  -- Get active membership
  SELECT id INTO v_membership_id
  FROM user_memberships
  WHERE user_id = p_user_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active membership found'
    );
  END IF;
  
  -- Update membership status
  UPDATE user_memberships
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = v_membership_id;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    membership_plan = NULL,
    membership_expiry = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cancelled_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. GET PAYMENT STATISTICS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION get_payment_statistics(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_revenue DECIMAL(12,2),
  total_transactions BIGINT,
  successful_transactions BIGINT,
  failed_transactions BIGINT,
  refunded_transactions BIGINT,
  average_transaction_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_transaction_value
  FROM membership_transactions
  WHERE 
    (p_start_date IS NULL OR DATE(created_at) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(created_at) <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. GRANT PERMISSIONS
-- ==============================================

GRANT EXECUTE ON FUNCTION process_payment_and_membership TO authenticated;
GRANT EXECUTE ON FUNCTION verify_payment_webhook TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_membership_status TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_user_membership TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_statistics TO authenticated;

-- ==============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_membership_transactions_user_id ON membership_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_status ON membership_transactions(status);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_created_at ON membership_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_gateway_payment_id ON membership_transactions(gateway_payment_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_expires_at ON user_memberships(expires_at);

-- ==============================================
-- 8. ADD CONSTRAINTS
-- ==============================================

-- Add constraints to prevent invalid data
ALTER TABLE membership_transactions ADD CONSTRAINT check_amount_positive CHECK (amount > 0);
ALTER TABLE membership_transactions ADD CONSTRAINT check_status_valid CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'));

ALTER TABLE user_memberships ADD CONSTRAINT check_expires_after_starts CHECK (expires_at > starts_at);
ALTER TABLE user_memberships ADD CONSTRAINT check_status_valid CHECK (status IN ('active', 'expired', 'cancelled'));

-- ==============================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON FUNCTION process_payment_and_membership IS 'Atomically processes payment completion and creates/updates user membership';
COMMENT ON FUNCTION verify_payment_webhook IS 'Verifies Razorpay webhook signature for security';
COMMENT ON FUNCTION get_user_membership_status IS 'Returns current user membership status and remaining days';
COMMENT ON FUNCTION cancel_user_membership IS 'Cancels user membership and updates profile';
COMMENT ON FUNCTION get_payment_statistics IS 'Returns payment statistics for admin dashboard';
