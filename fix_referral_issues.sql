-- Fix Referral System Issues
-- 1. Only increment total_referrals on signup, not on purchase
-- 2. Fix commission status logic (should be pending until actually paid)
-- 3. Ensure withdrawal system works properly

-- Step 1: Fix process_payment_webhook to NOT increment total_referrals on purchase
-- Only increment earnings, not referral count
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS process_payment_webhook(text, text, numeric, text);

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
    v_commission_result RECORD;
    v_referrer_id uuid;
    v_commission_amount decimal(10,2) := 0;
    v_commission_rate decimal(5,2) := 0.15; -- 15% commission rate
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
    
    -- Set duration based on plan_id (use actual plan_id from payment record)
    IF v_payment_record.plan_id = 'pro_plus' THEN
        v_end_date := NOW() + INTERVAL '1 year'; -- 365 days
    ELSIF v_payment_record.plan_id = 'pro' THEN
        v_end_date := NOW() + INTERVAL '3 months'; -- 90 days
    ELSE
        v_end_date := NOW() + INTERVAL '1 month'; -- 30 days default
    END IF;
    
    -- Create or update membership
    v_membership_id := create_or_update_membership(
        v_payment_record.user_id,
        v_payment_record.plan_id, -- Use actual plan_id from payment
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
    
    -- Update user profile with correct plan_id (use actual plan_id from payment)
    PERFORM update_user_profile_membership(
        v_payment_record.user_id,
        'active', -- membership_status
        v_payment_record.plan_id, -- membership_plan (use actual plan_id from payment)
        v_end_date
    );
    
    -- Process referral commission if user has a referrer
    -- Check if user has a pending referral transaction
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = v_payment_record.user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
        -- Calculate commission amount
        v_commission_amount := v_payment_record.amount * v_commission_rate;
        
        -- Update referral transaction
        UPDATE referral_transactions
        SET 
            amount = v_payment_record.amount,
            commission_amount = v_commission_amount,
            commission_status = 'pending', -- Keep as pending until actually paid
            membership_purchased = true,
            status = 'completed',
            updated_at = NOW()
        WHERE referred_id = v_payment_record.user_id 
        AND referrer_id = v_referrer_id
        AND status = 'pending';
        
        -- Create commission record
        INSERT INTO referral_commissions (
            referrer_id,
            referred_id,
            payment_id,
            membership_plan,
            membership_amount,
            commission_amount,
            commission_rate,
            status,
            created_at
        ) VALUES (
            v_referrer_id,
            v_payment_record.user_id,
            v_payment_record.id,
            v_payment_record.plan_id,
            v_payment_record.amount,
            v_commission_amount,
            v_commission_rate,
            'pending', -- Keep as pending until actually paid
            NOW()
        );
        
        -- Update referrer's total earnings in referral_codes table
        -- DO NOT increment total_referrals here - only on signup
        UPDATE referral_codes
        SET 
            total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
            -- total_referrals = COALESCE(total_referrals, 0) + 1, -- REMOVED: Only increment on signup
            updated_at = NOW()
        WHERE referral_codes.user_id = v_referrer_id;
        
        -- Log commission processing
        RAISE NOTICE 'Commission processed: referrer_id=%, amount=%, commission=%', 
            v_referrer_id, v_payment_record.amount, v_commission_amount;
    END IF;
    
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

-- Step 2: Create function to manually pay commissions (for admin use)
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS pay_commission(uuid, uuid);

CREATE OR REPLACE FUNCTION pay_commission(
    p_referral_transaction_id uuid,
    p_admin_user_id uuid
)
RETURNS TABLE(
    success boolean,
    message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction RECORD;
    v_commission_amount decimal(10,2);
BEGIN
    -- Get referral transaction details
    SELECT * INTO v_transaction
    FROM referral_transactions
    WHERE id = p_referral_transaction_id
    AND commission_status = 'pending';
    
    IF v_transaction.id IS NULL THEN
        RETURN QUERY SELECT false, 'Referral transaction not found or already processed';
        RETURN;
    END IF;
    
    -- Update commission status to paid
    UPDATE referral_transactions
    SET 
        commission_status = 'paid',
        updated_at = NOW()
    WHERE id = p_referral_transaction_id;
    
    -- Update referral_commissions table
    UPDATE referral_commissions
    SET 
        status = 'paid',
        updated_at = NOW()
    WHERE referrer_id = v_transaction.referrer_id
    AND referred_id = v_transaction.referred_id
    AND payment_id = v_transaction.payment_id;
    
    RETURN QUERY SELECT true, 'Commission paid successfully';
END;
$$;

-- Step 3: Create function to get withdrawal eligibility
-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS get_withdrawal_eligibility(uuid);

CREATE OR REPLACE FUNCTION get_withdrawal_eligibility(p_user_id uuid)
RETURNS TABLE(
    can_withdraw boolean,
    available_balance decimal(10,2),
    minimum_withdrawal decimal(10,2),
    pending_withdrawals decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_balance decimal(10,2) := 0;
    v_minimum_withdrawal decimal(10,2) := 0; -- From config
    v_pending_withdrawals decimal(10,2) := 0;
    v_can_withdraw boolean := false;
BEGIN
    -- Get available balance (paid commissions only)
    SELECT COALESCE(SUM(commission_amount), 0) INTO v_available_balance
    FROM referral_transactions
    WHERE referrer_id = p_user_id
    AND commission_status = 'paid';
    
    -- Get minimum withdrawal from config
    SELECT minimum_withdrawal INTO v_minimum_withdrawal
    FROM get_commission_config();
    
    -- Get pending withdrawal amount
    SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
    FROM withdrawal_requests
    WHERE user_id = p_user_id
    AND status IN ('pending', 'approved');
    
    -- Calculate available balance after pending withdrawals
    v_available_balance := v_available_balance - v_pending_withdrawals;
    
    -- Check if user can withdraw
    v_can_withdraw := (v_available_balance >= v_minimum_withdrawal);
    
    RETURN QUERY SELECT 
        v_can_withdraw,
        v_available_balance,
        v_minimum_withdrawal,
        v_pending_withdrawals;
END;
$$;

-- Step 4: Update get_referral_stats to show correct pending/paid amounts
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_referral_stats(uuid);

CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id uuid)
RETURNS TABLE(
    total_referrals bigint,
    completed_referrals bigint,
    total_earnings decimal(10,2),
    pending_earnings decimal(10,2),
    paid_earnings decimal(10,2)
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
        COALESCE(SUM(commission_amount), 0) as total_earnings,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0) as pending_earnings,
        COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0) as paid_earnings
    INTO v_stats
    FROM public.referral_transactions
    WHERE referrer_id = p_user_id;
    
    RETURN QUERY SELECT 
        v_stats.total_referrals,
        v_stats.completed_referrals,
        v_stats.total_earnings,
        v_stats.pending_earnings,
        v_stats.paid_earnings;
END;
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION pay_commission(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_withdrawal_eligibility(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats(uuid) TO authenticated;

-- Step 6: Add comments
COMMENT ON FUNCTION process_payment_webhook IS 'Processes payment webhook - only increments earnings, not referral count';
COMMENT ON FUNCTION pay_commission IS 'Admin function to manually pay commissions';
COMMENT ON FUNCTION get_withdrawal_eligibility IS 'Checks if user can withdraw based on paid commissions';
COMMENT ON FUNCTION get_referral_stats IS 'Gets referral statistics with correct pending/paid amounts';
