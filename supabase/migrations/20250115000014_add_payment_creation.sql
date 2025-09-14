-- Add payment creation and management functions

-- 1. Create function to create a new payment
CREATE OR REPLACE FUNCTION create_payment(
  p_user_id UUID,
  p_plan_id VARCHAR(50),
  p_payment_method VARCHAR(50) DEFAULT 'razorpay',
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  payment_id VARCHAR(100),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  plan_name VARCHAR(100)
) AS $$
DECLARE
  plan_record RECORD;
  new_payment_id VARCHAR(100);
BEGIN
  -- Get plan details
  SELECT * INTO plan_record 
  FROM membership_plans 
  WHERE id = p_plan_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Plan not found or inactive', NULL::VARCHAR(100), NULL::DECIMAL(10,2), NULL::VARCHAR(3), NULL::VARCHAR(100);
    RETURN;
  END IF;
  
  -- Generate unique payment ID
  new_payment_id := 'PAY_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
  
  -- Create payment record
  INSERT INTO payments (
    payment_id,
    user_id,
    plan_id,
    plan_name,
    amount,
    currency,
    payment_method,
    status,
    metadata
  )
  VALUES (
    new_payment_id,
    p_user_id,
    p_plan_id,
    plan_record.name,
    plan_record.price,
    'INR',
    p_payment_method,
    'pending',
    p_metadata
  );
  
  RETURN QUERY SELECT true, 'Payment created successfully', new_payment_id, plan_record.price, 'INR', plan_record.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status(
  p_payment_id VARCHAR(100),
  p_status VARCHAR(20),
  p_razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  p_razorpay_order_id VARCHAR(100) DEFAULT NULL,
  p_razorpay_signature VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  payment_id VARCHAR(100)
) AS $$
BEGIN
  -- Update payment status
  UPDATE payments 
  SET 
    status = p_status,
    razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
    razorpay_order_id = COALESCE(p_razorpay_order_id, razorpay_order_id),
    razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
    metadata = COALESCE(p_metadata, metadata),
    updated_at = NOW()
  WHERE payments.payment_id = p_payment_id;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Payment status updated successfully', p_payment_id;
  ELSE
    RETURN QUERY SELECT false, 'Payment not found', p_payment_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create function to get payment by ID
CREATE OR REPLACE FUNCTION get_payment_by_id(p_payment_id VARCHAR(100))
RETURNS TABLE (
  id UUID,
  payment_id VARCHAR(100),
  user_id UUID,
  plan_id VARCHAR(50),
  plan_name VARCHAR(100),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  payment_method VARCHAR(50),
  status VARCHAR(20),
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.payment_id,
    p.user_id,
    p.plan_id,
    p.plan_name,
    p.amount,
    p.currency,
    p.payment_method,
    p.status,
    p.razorpay_payment_id,
    p.razorpay_order_id,
    p.metadata,
    p.created_at,
    p.updated_at
  FROM payments p
  WHERE p.payment_id = p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION create_payment(UUID, VARCHAR(50), VARCHAR(50), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status(VARCHAR(100), VARCHAR(20), VARCHAR(100), VARCHAR(100), VARCHAR(255), JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_by_id(VARCHAR(100)) TO authenticated;
