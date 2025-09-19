-- Create function to request withdrawal
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS request_commission_withdrawal(UUID, DECIMAL, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION request_commission_withdrawal(
  user_uuid UUID,
  withdrawal_amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  account_details TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  withdrawal_id UUID
) AS $$
DECLARE
  available_balance DECIMAL(10,2);
  new_withdrawal_id UUID;
BEGIN
  -- Check if user has sufficient balance
  SELECT COALESCE(SUM(commission_amount), 0.00) INTO available_balance
  FROM referral_commissions
  WHERE referrer_id = user_uuid 
  AND status IN ('pending', 'completed');
  
  -- Check if user has any pending withdrawal requests
  IF EXISTS (
    SELECT 1 FROM referral_payouts 
    WHERE user_id = user_uuid 
    AND status IN ('pending', 'approved')
  ) THEN
    RETURN QUERY SELECT false, 'You already have a pending withdrawal request', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if withdrawal amount is valid
  IF withdrawal_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if user has sufficient balance
  IF withdrawal_amount > available_balance THEN
    RETURN QUERY SELECT false, 
      'Insufficient balance. Available: ₹' || available_balance || ', Requested: ₹' || withdrawal_amount, 
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Create withdrawal request
  INSERT INTO referral_payouts (
    user_id,
    amount,
    payment_method,
    account_details,
    status
  ) VALUES (
    user_uuid,
    withdrawal_amount,
    payment_method,
    account_details,
    'pending'
  ) RETURNING id INTO new_withdrawal_id;
  
  RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', new_withdrawal_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(UUID, DECIMAL, VARCHAR, TEXT) TO authenticated;

-- Test the function
SELECT * FROM request_commission_withdrawal(
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec',
  0.30,
  'bank_transfer',
  'Test Bank Account: 1234567890'
);
