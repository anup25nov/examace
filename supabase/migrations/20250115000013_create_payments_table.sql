-- Create payments table and related functionality

-- 1. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(50) REFERENCES membership_plans(id) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 3. Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create function to handle payment completion
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
  plan_id VARCHAR(50)
) AS $$
DECLARE
  payment_record RECORD;
  membership_id UUID;
BEGIN
  -- Get the payment record
  SELECT * INTO payment_record 
  FROM payments 
  WHERE payments.payment_id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', p_payment_id, NULL::UUID, NULL::VARCHAR(50);
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
  
  RETURN QUERY SELECT true, 'Payment completed successfully', p_payment_id, payment_record.user_id, payment_record.plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create function to get user payments
CREATE OR REPLACE FUNCTION get_user_payments(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  payment_id VARCHAR(100),
  plan_id VARCHAR(50),
  plan_name VARCHAR(100),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  payment_method VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.plan_id,
    p.plan_name,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION complete_payment(VARCHAR(100), VARCHAR(100), VARCHAR(100), VARCHAR(255), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payments(UUID) TO authenticated;
