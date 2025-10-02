-- RPC Functions for Webhook Operations (No Authentication Required)
-- These functions will be called by the webhook to process payments

-- 1. Function to find pending payment by order_id
CREATE OR REPLACE FUNCTION find_pending_payment(p_order_id text)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    plan_id text,
    plan_name text,
    amount numeric,
    currency text,
    status text,
    razorpay_order_id text,
    razorpay_payment_id text,
    paid_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
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
    FROM public.payments p
    WHERE p.razorpay_order_id = p_order_id 
    AND p.status = 'pending'
    ORDER BY p.created_at DESC
    LIMIT 1;
END;
$$;

-- 2. Function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status(
    p_payment_id uuid,
    p_status text,
    p_razorpay_payment_id text DEFAULT NULL,
    p_paid_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.payments 
    SET 
        status = p_status,
        razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
        paid_at = COALESCE(p_paid_at, paid_at),
        updated_at = NOW()
    WHERE id = p_payment_id;
    
    RETURN FOUND;
END;
$$;

-- 3. Function to create or update membership
CREATE OR REPLACE FUNCTION create_or_update_membership(
    p_user_id uuid,
    p_plan_id text,
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_membership_id uuid;
BEGIN
    -- Check if membership exists
    SELECT id INTO v_membership_id
    FROM public.user_memberships
    WHERE user_id = p_user_id
    LIMIT 1;
    
    IF v_membership_id IS NOT NULL THEN
        -- Update existing membership
        UPDATE public.user_memberships
        SET 
            plan_id = p_plan_id,
            start_date = p_start_date,
            end_date = p_end_date,
            status = 'active',
            updated_at = NOW()
        WHERE id = v_membership_id;
    ELSE
        -- Create new membership
        INSERT INTO public.user_memberships (
            user_id, plan_id, start_date, end_date, status
        ) VALUES (
            p_user_id, p_plan_id, p_start_date, p_end_date, 'active'
        ) RETURNING id INTO v_membership_id;
    END IF;
    
    RETURN v_membership_id;
END;
$$;

-- 4. Function to create membership transaction
CREATE OR REPLACE FUNCTION create_membership_transaction(
    p_user_id uuid,
    p_membership_id uuid,
    p_transaction_id uuid,
    p_amount numeric,
    p_currency text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.membership_transactions (
        user_id, membership_id, transaction_id, amount, currency, status, payment_method
    ) VALUES (
        p_user_id, p_membership_id, p_transaction_id, p_amount, p_currency, 'completed', 'razorpay'
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 5. Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile_membership(
    p_user_id uuid,
    p_membership_status text,
    p_membership_plan text,
    p_membership_expiry timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        membership_status = p_membership_status,
        membership_plan = p_membership_plan,
        membership_expiry = p_membership_expiry,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- 6. Function to process complete payment (main function)
-- Drop existing function first
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
    
    -- Calculate membership dates
    v_start_date := NOW();
    v_end_date := NOW() + INTERVAL '1 year';
    
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
        'pro',
        'pro',
        v_end_date
    );
    
    -- Set success result
    v_success := true;
    v_message := 'Payment processed successfully';
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION find_pending_payment(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_payment_status(uuid, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION create_or_update_membership(uuid, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION create_membership_transaction(uuid, uuid, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_membership(uuid, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO authenticated;

-- Grant execute permissions to anon users (for webhook)
GRANT EXECUTE ON FUNCTION find_pending_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION update_payment_status(uuid, text, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION create_or_update_membership(uuid, text, timestamptz, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION create_membership_transaction(uuid, uuid, uuid, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION update_user_profile_membership(uuid, text, text, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO anon;
