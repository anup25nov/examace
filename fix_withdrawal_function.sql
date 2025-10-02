-- Fix request_commission_withdrawal function to match frontend call
-- Frontend calls: request_commission_withdrawal(p_account_details, p_amount, p_payment_method, p_user_id)

CREATE OR REPLACE FUNCTION request_commission_withdrawal(
    p_account_details text,
    p_amount numeric,
    p_payment_method character varying,
    p_user_id uuid
)
RETURNS TABLE(
    success boolean,
    message text,
    withdrawal_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    available_balance DECIMAL(10,2);
    new_withdrawal_id UUID;
    minimum_withdrawal DECIMAL(10,2);
BEGIN
    -- Get available balance from referral stats
    SELECT COALESCE(SUM(commission_amount), 0.00) INTO available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id;
    
    -- Get minimum withdrawal from config
    SELECT config.minimum_withdrawal INTO minimum_withdrawal
    FROM get_commission_config() AS config;
    
    -- Check if user has any pending withdrawal requests
    IF EXISTS (
        SELECT 1 FROM withdrawal_requests 
        WHERE user_id = p_user_id 
        AND status IN ('pending', 'approved')
    ) THEN
        RETURN QUERY SELECT false, 'You already have a pending withdrawal request', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if withdrawal amount is valid
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', NULL::UUID;
        RETURN;
    END IF;
    
    -- Check minimum withdrawal
    IF p_amount < minimum_withdrawal THEN
        RETURN QUERY SELECT false, 
            'Minimum withdrawal amount is ₹' || minimum_withdrawal, 
            NULL::UUID;
        RETURN;
    END IF;
    
    -- Check if user has sufficient balance
    IF p_amount > available_balance THEN
        RETURN QUERY SELECT false, 
            'Insufficient balance. Available: ₹' || available_balance || ', Requested: ₹' || p_amount, 
            NULL::UUID;
        RETURN;
    END IF;
    
    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
        user_id,
        amount,
        payment_method,
        payment_details,
        status,
        created_at
    ) VALUES (
        p_user_id,
        p_amount,
        p_payment_method,
        p_account_details::jsonb,
        'pending',
        NOW()
    ) RETURNING id INTO new_withdrawal_id;
    
    RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', new_withdrawal_id;
    
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(text, numeric, character varying, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(text, numeric, character varying, uuid) TO anon;
