-- Final fix for the function signature issue
-- Run this in your Supabase SQL Editor

-- 1. Drop the current function
SELECT '=== DROPPING CURRENT FUNCTION ===' as step;
DROP FUNCTION IF EXISTS process_referral_commission(DECIMAL, VARCHAR, UUID, UUID) CASCADE;

-- 2. Create function with the exact signature that matches the Edge Function call
SELECT '=== CREATING FUNCTION WITH EXACT SIGNATURE ===' as step;
CREATE OR REPLACE FUNCTION process_referral_commission(
    p_membership_amount DECIMAL(10,2),
    p_membership_plan VARCHAR(50),
    p_payment_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    commission_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_referrer_id UUID;
    v_commission_rate DECIMAL(5,4);
    v_commission_amount DECIMAL(10,2);
    v_referral_code_value VARCHAR(20);
BEGIN
    -- Get referrer_id from referral_transactions
    SELECT rt.referrer_id, rt.referral_code
    INTO v_referrer_id, v_referral_code_value
    FROM referral_transactions rt
    WHERE rt.referred_id = p_user_id
    AND rt.membership_purchased = false
    ORDER BY rt.created_at DESC
    LIMIT 1;

    -- If no referrer found, return success but no commission
    IF v_referrer_id IS NULL THEN
        RETURN QUERY SELECT false, 'No referrer found for user', 0.00;
        RETURN;
    END IF;

    -- Set commission rate (10% for pro, 15% for pro_plus)
    v_commission_rate := CASE 
        WHEN p_membership_plan = 'pro_plus' THEN 0.15
        ELSE 0.10
    END;

    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;

    -- Update referral_transaction to mark membership as purchased
    UPDATE referral_transactions
    SET 
        amount = p_membership_amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        updated_at = NOW()
    WHERE referred_id = p_user_id
    AND referrer_id = v_referrer_id
    AND membership_purchased = false;

    -- Insert commission record
    INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        amount,
        commission_amount,
        commission_rate,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_referrer_id,
        p_user_id,
        p_membership_amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
        NOW(),
        NOW()
    );

    -- Update referral_codes total_earnings
    UPDATE referral_codes
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;

    RETURN QUERY SELECT true, 'Commission processed successfully', v_commission_amount;
END;
$$;

-- 3. Test the function with the exact parameters the Edge Function uses
SELECT '=== TESTING FUNCTION WITH EDGE FUNCTION PARAMETERS ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id
);

-- 4. Verify function signature matches what Supabase expects
SELECT '=== VERIFYING FUNCTION SIGNATURE ===' as step;
SELECT 
    p.parameter_name,
    p.parameter_mode,
    p.data_type,
    p.ordinal_position
FROM information_schema.parameters p
WHERE p.specific_name IN (
    SELECT r.specific_name 
    FROM information_schema.routines r
    WHERE r.routine_name = 'process_referral_commission' 
    AND r.routine_schema = 'public'
)
ORDER BY p.ordinal_position;
