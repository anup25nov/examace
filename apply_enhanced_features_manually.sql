-- Enhanced Production Features Migration
-- Apply this in Supabase SQL Editor

-- ==============================================
-- 1. CREATE TEST STATES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS test_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id VARCHAR(50) NOT NULL,
  section_id VARCHAR(50),
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  state_data JSONB NOT NULL,
  last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exam_id, section_id, test_type, test_id)
);

-- Create indexes for test_states
CREATE INDEX IF NOT EXISTS idx_test_states_user_id ON test_states(user_id);
CREATE INDEX IF NOT EXISTS idx_test_states_exam_test ON test_states(exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_test_states_last_saved ON test_states(last_saved_at);

-- ==============================================
-- 2. CREATE PAYMENT ROLLBACKS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS payment_rollbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  rollback_reason TEXT NOT NULL,
  rollback_data JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for payment_rollbacks
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_payment_id ON payment_rollbacks(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_user_id ON payment_rollbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_status ON payment_rollbacks(status);

-- ==============================================
-- 3. CREATE PERFORMANCE METRICS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit VARCHAR(20),
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);

-- ==============================================
-- 4. CREATE USER MESSAGES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for user_messages
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_type ON user_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);

-- ==============================================
-- 5. CREATE ROLLBACK PAYMENT TRANSACTION FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION rollback_payment_transaction(
  p_payment_id VARCHAR,
  p_user_id UUID,
  p_plan_id VARCHAR,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_rollback_id UUID;
  v_restored_data JSONB;
  v_payment_record RECORD;
  v_membership_record RECORD;
  v_commission_record RECORD;
  v_commission_count INTEGER := 0;
BEGIN
  -- Start transaction
  BEGIN
    -- Get payment record
    SELECT * INTO v_payment_record
    FROM payments
    WHERE payment_id = p_payment_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    -- Create rollback record
    INSERT INTO payment_rollbacks (payment_id, user_id, plan_id, original_amount, rollback_reason)
    VALUES (p_payment_id, p_user_id, p_plan_id, v_payment_record.amount, p_reason)
    RETURNING id INTO v_rollback_id;
    
    -- Get membership record
    SELECT * INTO v_membership_record
    FROM user_memberships
    WHERE user_id = p_user_id AND plan_id = p_plan_id
    ORDER BY created_at DESC LIMIT 1;
    
    -- Restore user profile to free plan
    UPDATE user_profiles
    SET 
      membership_plan = 'free',
      membership_status = 'inactive',
      membership_expiry = NULL,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Update membership status to cancelled
    IF v_membership_record.id IS NOT NULL THEN
      UPDATE user_memberships
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = v_membership_record.id;
    END IF;
    
    -- Get and reverse referral commissions
    FOR v_commission_record IN 
      SELECT * FROM referral_commissions 
      WHERE payment_id = p_payment_id
    LOOP
      v_commission_count := v_commission_count + 1;
      
      -- Update referrer earnings
      UPDATE referral_earnings
      SET 
        total_earnings = total_earnings - v_commission_record.amount,
        available_earnings = available_earnings - v_commission_record.amount,
        updated_at = NOW()
      WHERE user_id = v_commission_record.referrer_id;
      
      -- Mark commission as reversed
      UPDATE referral_commissions
      SET 
        status = 'reversed',
        updated_at = NOW()
      WHERE id = v_commission_record.id;
    END LOOP;
    
    -- Update payment status
    UPDATE payments
    SET 
      status = 'refunded',
      updated_at = NOW()
    WHERE payment_id = p_payment_id;
    
    -- Mark rollback as completed
    UPDATE payment_rollbacks
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = v_rollback_id;
    
    -- Build restored data
    v_restored_data := jsonb_build_object(
      'rollback_id', v_rollback_id,
      'user_profile_restored', true,
      'membership_cancelled', v_membership_record.id IS NOT NULL,
      'commissions_reversed', v_commission_count,
      'payment_refunded', true
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'rollback_id', v_rollback_id,
      'restored_data', v_restored_data
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Mark rollback as failed
    UPDATE payment_rollbacks
    SET 
      status = 'failed',
      completed_at = NOW()
    WHERE id = v_rollback_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. CREATE UPDATE MEMBERSHIP STATUS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION update_membership_status(
  p_user_id UUID,
  p_plan_id VARCHAR,
  p_status VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_memberships
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE user_id = p_user_id AND plan_id = p_plan_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. CREATE UPDATE REFERRAL EARNINGS FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION update_referral_earnings(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_operation VARCHAR -- 'add' or 'subtract'
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_operation = 'add' THEN
    INSERT INTO referral_earnings (user_id, total_earnings, available_earnings, created_at, updated_at)
    VALUES (p_user_id, p_amount, p_amount, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_earnings = referral_earnings.total_earnings + p_amount,
      available_earnings = referral_earnings.available_earnings + p_amount,
      updated_at = NOW();
  ELSIF p_operation = 'subtract' THEN
    UPDATE referral_earnings
    SET 
      total_earnings = GREATEST(0, total_earnings - p_amount),
      available_earnings = GREATEST(0, available_earnings - p_amount),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE test_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_rollbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test_states
CREATE POLICY "Users can manage their own test states" ON test_states
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for payment_rollbacks
CREATE POLICY "Users can view their own payment rollbacks" ON payment_rollbacks
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create RLS policies for user_messages
CREATE POLICY "Users can manage their own messages" ON user_messages
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 9. GRANT PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON test_states TO authenticated;
GRANT SELECT ON payment_rollbacks TO authenticated;
GRANT SELECT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_messages TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION rollback_payment_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_membership_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_referral_earnings TO authenticated;

-- ==============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE test_states IS 'Stores user test progress for recovery and persistence';
COMMENT ON TABLE payment_rollbacks IS 'Tracks payment rollback operations and their status';
COMMENT ON TABLE performance_metrics IS 'Stores application performance monitoring data';
COMMENT ON TABLE user_messages IS 'Stores user notifications and messages';

COMMENT ON FUNCTION rollback_payment_transaction IS 'Atomically rolls back a payment and all associated data';
COMMENT ON FUNCTION update_membership_status IS 'Updates user membership status';
COMMENT ON FUNCTION update_referral_earnings IS 'Updates user referral earnings with add/subtract operations';
