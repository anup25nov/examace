-- Simplify Referral System - Remove Confusing Commission Status
-- Make it simple: Earn commission on signup, withdraw anytime

-- Step 1: Drop complex commission status functions
DROP FUNCTION IF EXISTS pay_commission(uuid, uuid);
DROP FUNCTION IF EXISTS get_withdrawal_eligibility(uuid);

-- Step 2: Simplify process_payment_webhook - Remove commission processing
-- Commissions are earned on signup, not on payment
CREATE OR REPLACE FUNCTION process_payment_webhook(
    p_order_id text,
    p_razorpay_payment_id text,
    p_amount numeric,
    p_currency text DEFAULT 'INR'
)
RETURNS TABLE(
    success boolean,
    message text,
    payment_id uuid,
    user_id uuid,
    membership_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_record RECORD;
    v_membership_id uuid;
    v_start_date timestamptz;
    v_end_date timestamptz;
    v_success boolean := false;
    v_message text := '';
    v_payment_id uuid;
    v_user_id uuid;
BEGIN
    -- Get payment record directly from payments table
    SELECT 
        p.id,
        p.user_id,
        p.plan_id,
        p.plan_name,
        p.amount,
        p.currency,
        p.status,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.paid_at,
        p.created_at,
        p.updated_at
    INTO v_payment_record
    FROM public.payments p
    WHERE p.razorpay_order_id = p_order_id 
    AND p.status = 'pending'
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    IF v_payment_record.id IS NULL THEN
        v_success := false;
        v_message := 'No pending payment found for order: ' || p_order_id;
        RETURN QUERY SELECT v_success, v_message, NULL::uuid, NULL::uuid, NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if already processed
    IF v_payment_record.status = 'completed' THEN
        v_success := false;
        v_message := 'Payment already processed';
        RETURN QUERY SELECT v_success, v_message, v_payment_record.id, v_payment_record.user_id, NULL::uuid;
        RETURN;
    END IF;
    
    -- Update payment status
    PERFORM update_payment_status(
        v_payment_record.id,
        'completed',
        p_razorpay_payment_id,
        NOW()
    );
    
    -- Calculate membership dates based on plan
    v_start_date := NOW();
    
    -- Set duration based on plan_id
    IF v_payment_record.plan_id = 'pro_plus' THEN
        v_end_date := NOW() + INTERVAL '1 year';
    ELSIF v_payment_record.plan_id = 'pro' THEN
        v_end_date := NOW() + INTERVAL '3 months';
    ELSE
        v_end_date := NOW() + INTERVAL '1 month';
    END IF;
    
    -- Create or update membership
    v_membership_id := create_or_update_membership(
        v_payment_record.user_id,
        v_payment_record.plan_id,
        v_start_date,
        v_end_date
    );
    
    -- Create membership transaction
    PERFORM create_membership_transaction(
        v_payment_record.user_id,
        v_membership_id,
        v_payment_record.id,
        v_payment_record.amount,
        v_payment_record.currency
    );
    
    -- Update user profile
    PERFORM update_user_profile_membership(
        v_payment_record.user_id,
        'active',
        v_payment_record.plan_id,
        v_end_date
    );
    
    -- NO COMMISSION PROCESSING HERE - Commissions are earned on signup only
    
    -- Set success result
    v_success := true;
    v_message := 'Payment processed successfully with plan: ' || v_payment_record.plan_id;
    v_payment_id := v_payment_record.id;
    v_user_id := v_payment_record.user_id;
    
    -- Return success result
    RETURN QUERY SELECT v_success, v_message, v_payment_id, v_user_id, v_membership_id;
    
EXCEPTION
    WHEN OTHERS THEN
        v_success := false;
        v_message := 'Error processing payment: ' || SQLERRM;
        RETURN QUERY SELECT v_success, v_message, NULL::uuid, NULL::uuid, NULL::uuid;
END;
$$;

-- Step 3: Simplify get_referral_stats - Only show total earnings
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id uuid)
RETURNS TABLE(
    total_referrals bigint,
    completed_referrals bigint,
    total_earnings decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
        COALESCE(SUM(commission_amount), 0) as total_earnings
    INTO v_stats
    FROM public.referral_transactions
    WHERE referrer_id = p_user_id;
    
    RETURN QUERY SELECT 
        v_stats.total_referrals,
        v_stats.completed_referrals,
        v_stats.total_earnings;
END;
$$;

-- Step 4: Create simple withdrawal eligibility
CREATE OR REPLACE FUNCTION get_withdrawal_eligibility(p_user_id uuid)
RETURNS TABLE(
    can_withdraw boolean,
    available_balance decimal(10,2),
    minimum_withdrawal decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_balance decimal(10,2) := 0;
    v_minimum_withdrawal decimal(10,2) := 0;
    v_can_withdraw boolean := false;
BEGIN
    -- Get total earnings (all commissions are available for withdrawal)
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id;
    
    -- Get minimum withdrawal from config
    SELECT minimum_withdrawal INTO v_minimum_withdrawal
    FROM get_commission_config();
    
    -- Check if user can withdraw
    v_can_withdraw := (v_available_balance >= v_minimum_withdrawal);
    
    RETURN QUERY SELECT 
        v_can_withdraw,
        v_available_balance,
        v_minimum_withdrawal;
END;
$$;

-- Step 5: Simplify withdrawal request
CREATE OR REPLACE FUNCTION request_commission_withdrawal(
    p_user_id uuid,
    p_amount numeric,
    p_payment_method character varying DEFAULT 'bank_transfer',
    p_account_details text DEFAULT NULL
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
    v_withdrawal_id uuid;
    v_available_balance decimal(10,2);
    v_minimum_withdrawal decimal(10,2);
BEGIN
    -- Get available balance
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id;
    
    -- Get minimum withdrawal
    SELECT minimum_withdrawal INTO v_minimum_withdrawal
    FROM get_commission_config();
    
    -- Check if user can withdraw
    IF p_amount < v_minimum_withdrawal THEN
        RETURN QUERY SELECT false, 'Minimum withdrawal amount is ₹' || v_minimum_withdrawal, NULL::uuid;
        RETURN;
    END IF;
    
    IF p_amount > v_available_balance THEN
        RETURN QUERY SELECT false, 'Insufficient balance. Available: ₹' || v_available_balance, NULL::uuid;
        RETURN;
    END IF;
    
    -- Create withdrawal request
    v_withdrawal_id := gen_random_uuid();
    
    INSERT INTO withdrawal_requests (
        id,
        user_id,
        amount,
        payment_method,
        payment_details,
        status,
        created_at
    ) VALUES (
        v_withdrawal_id,
        p_user_id,
        p_amount,
        p_payment_method,
        p_account_details::jsonb,
        'pending',
        NOW()
    );
    
    RETURN QUERY SELECT true, 'Withdrawal request submitted successfully', v_withdrawal_id;
END;
$$;

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_withdrawal_eligibility(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION request_commission_withdrawal(uuid, numeric, character varying, text) TO authenticated;

-- Step 7: Add comments
COMMENT ON FUNCTION process_payment_webhook IS 'Simplified payment processing - no commission handling';
COMMENT ON FUNCTION get_referral_stats IS 'Simplified referral stats - only total earnings';
COMMENT ON FUNCTION get_withdrawal_eligibility IS 'Simple withdrawal eligibility based on total earnings';
COMMENT ON FUNCTION request_commission_withdrawal IS 'Simple withdrawal request - all earnings available';
