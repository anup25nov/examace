-- Simple drop and create script
-- Run this in your Supabase SQL Editor

-- 1. Drop all existing functions by name (this will drop all overloads)
SELECT '=== DROPPING ALL FUNCTIONS ===' as step;
DROP FUNCTION IF EXISTS process_referral_commission CASCADE;

-- 2. Verify they're gone
SELECT '=== CHECKING IF FUNCTIONS ARE DROPPED ===' as step;
SELECT COUNT(*) as remaining_functions
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 3. Create the new function with the correct signature
SELECT '=== CREATING NEW FUNCTION ===' as step;
CREATE OR REPLACE FUNCTION process_referral_commission(
    p_user_id UUID,
    p_payment_id UUID,
    p_membership_plan VARCHAR(50),
    p_membership_amount DECIMAL(10,2)
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

-- 4. Test the function
SELECT '=== TESTING NEW FUNCTION ===' as step;
SELECT * FROM process_referral_commission(
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID,
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,
    'pro_plus',
    2.00
);

-- 5. Verify only one function exists
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    routine_name,
    specific_name,
    COUNT(*) as parameter_count
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'process_referral_commission' 
AND r.routine_schema = 'public'
GROUP BY r.routine_name, r.specific_name;
