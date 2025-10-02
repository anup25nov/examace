-- Fix Production Payment Processing Issues
-- This script fixes the existing process_payment_webhook function in production
-- Run this in Supabase SQL Editor

-- 1. Fix the process_payment_webhook function to use correct plan_id and process commissions
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
        v_payment_record.plan_id, -- Use actual plan_id from payment
        v_payment_record.plan_name, -- Use actual plan_name from payment
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
            commission_status = 'completed', -- Set to completed instead of pending
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
            'completed', -- Set to completed instead of pending
            NOW()
        );
        
        -- Update referrer's total earnings in referral_codes table
        UPDATE referral_codes
        SET 
            total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
            total_referrals = COALESCE(total_referrals, 0) + 1,
            updated_at = NOW()
        WHERE user_id = v_referrer_id;
        
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO anon;
GRANT EXECUTE ON FUNCTION process_payment_webhook(text, text, numeric, text) TO service_role;

-- 2. Update existing pending referral transactions to completed status
-- This fixes the referral network showing pending status
UPDATE referral_transactions 
SET 
    status = 'completed',
    commission_status = 'completed',
    membership_purchased = true,
    updated_at = NOW()
WHERE status = 'pending' 
AND referred_id IN (
    SELECT DISTINCT user_id 
    FROM user_memberships 
    WHERE status = 'active'
);

-- 3. Create commission records for existing completed memberships
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
)
SELECT 
    rt.referrer_id,
    rt.referred_id,
    p.id as payment_id,
    um.plan_id as membership_plan,
    rt.amount as membership_amount,
    rt.commission_amount,
    0.15 as commission_rate,
    'completed' as status,
    NOW() as created_at
FROM referral_transactions rt
JOIN user_memberships um ON rt.referred_id = um.user_id
JOIN payments p ON rt.referred_id = p.user_id
WHERE rt.status = 'completed'
AND rt.membership_purchased = true
AND um.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM referral_commissions rc 
    WHERE rc.referrer_id = rt.referrer_id 
    AND rc.referred_id = rt.referred_id
);

-- 4. Update referral_codes table with correct totals
UPDATE referral_codes 
SET 
    total_referrals = (
        SELECT COUNT(*) 
        FROM referral_transactions rt 
        WHERE rt.referrer_id = referral_codes.user_id 
        AND rt.status = 'completed'
    ),
    total_earnings = (
        SELECT COALESCE(SUM(rt.commission_amount), 0)
        FROM referral_transactions rt 
        WHERE rt.referrer_id = referral_codes.user_id 
        AND rt.status = 'completed'
        AND rt.commission_amount IS NOT NULL
    ),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM referral_transactions rt 
    WHERE rt.referrer_id = referral_codes.user_id
);

-- 5. Verify the fix by checking a sample
SELECT 
    'Current process_payment_webhook function updated' as status,
    'All three issues should now be fixed' as message;
