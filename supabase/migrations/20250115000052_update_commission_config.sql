-- Update commission configuration to be centralized and configurable
-- This migration updates all commission-related functions to use consistent configuration

-- 1. Create a commission configuration table
CREATE TABLE IF NOT EXISTS commission_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default commission configuration
INSERT INTO commission_config (key, value, description) VALUES
('commission_percentage', 50.00, 'Commission percentage for referrals'),
('minimum_withdrawal', 100.00, 'Minimum withdrawal amount'),
('maximum_withdrawal', 10000.00, 'Maximum withdrawal amount'),
('processing_fee', 0.00, 'Processing fee percentage'),
('tax_deduction', 0.00, 'Tax deduction percentage')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 3. Create function to get commission configuration
CREATE OR REPLACE FUNCTION get_commission_config(config_key VARCHAR(50))
RETURNS DECIMAL(10,2) AS $$
DECLARE
  config_value DECIMAL(10,2);
BEGIN
  SELECT value INTO config_value
  FROM commission_config
  WHERE key = config_key;
  
  IF config_value IS NULL THEN
    -- Return default values if not found
    CASE config_key
      WHEN 'commission_percentage' THEN RETURN 50.00;
      WHEN 'minimum_withdrawal' THEN RETURN 100.00;
      WHEN 'maximum_withdrawal' THEN RETURN 10000.00;
      WHEN 'processing_fee' THEN RETURN 0.00;
      WHEN 'tax_deduction' THEN RETURN 0.00;
      ELSE RETURN 0.00;
    END CASE;
  END IF;
  
  RETURN config_value;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the process_referral_commission function to use centralized config
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
  commission_percentage DECIMAL(5,2);
  minimum_withdrawal DECIMAL(10,2);
BEGIN
  -- Get commission configuration
  commission_percentage := get_commission_config('commission_percentage');
  minimum_withdrawal := get_commission_config('minimum_withdrawal');
  
  -- Debug: Log the input parameters
  RAISE NOTICE 'Processing commission for user: %, payment: %, plan: %, amount: %', 
    p_user_id, p_payment_id, p_membership_plan, p_membership_amount;
  
  -- Find the referral transaction for this user
  SELECT * INTO referral_record
  FROM referral_transactions
  WHERE referred_id = p_user_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No pending referral found for user: %', p_user_id;
    RETURN QUERY SELECT true, 'No referral found, no commission to process', 0.00;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found referral record: %, referrer: %', referral_record.id, referral_record.referrer_id;
  
  -- Calculate commission amount
  commission_amount := (p_membership_amount * commission_percentage) / 100;
  
  -- Check if commission meets minimum withdrawal requirement
  IF commission_amount < minimum_withdrawal THEN
    RAISE NOTICE 'Commission amount % is below minimum withdrawal %', commission_amount, minimum_withdrawal;
    RETURN QUERY SELECT true, 'Commission amount below minimum withdrawal threshold', 0.00;
    RETURN;
  END IF;
  
  -- Update referral transaction status
  UPDATE referral_transactions
  SET status = 'completed',
      commission_amount = commission_amount,
      completed_at = NOW()
  WHERE id = referral_record.id;
  
  -- Create commission record
  INSERT INTO referral_commissions (
    referrer_id,
    referred_id,
    payment_id,
    membership_plan,
    membership_amount,
    commission_amount,
    commission_percentage,
    status,
    created_at
  ) VALUES (
    referral_record.referrer_id,
    p_user_id,
    p_payment_id,
    p_membership_plan,
    p_membership_amount,
    commission_amount,
    commission_percentage,
    'pending',
    NOW()
  );
  
  RAISE NOTICE 'Commission processed successfully: %', commission_amount;
  
  RETURN QUERY SELECT true, 'Commission processed successfully', commission_amount;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to update commission configuration
CREATE OR REPLACE FUNCTION update_commission_config(
  config_key VARCHAR(50),
  config_value DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO commission_config (key, value)
  VALUES (config_key, config_value)
  ON CONFLICT (key) DO UPDATE SET
    value = config_value,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get all commission configuration
CREATE OR REPLACE FUNCTION get_all_commission_config()
RETURNS TABLE (
  key VARCHAR(50),
  value DECIMAL(10,2),
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT cc.key, cc.value, cc.description
  FROM commission_config cc
  ORDER BY cc.key;
END;
$$ LANGUAGE plpgsql;
