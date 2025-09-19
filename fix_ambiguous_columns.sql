-- Fix the ambiguous column reference issue
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS handle_referral_commission;

-- 2. Create the fixed function with proper variable prefixes
CREATE OR REPLACE FUNCTION handle_referral_commission(
    p_membership_amount numeric,
    p_membership_plan character varying,
    p_payment_id uuid,
    p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_referrer_id uuid;
    v_commission_rate numeric := 0.15;
    v_commission_amount numeric;
    result json;
BEGIN
    -- Get the referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions 
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    LIMIT 1;
    
    -- If no referrer found, return early
    IF v_referrer_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'No referrer found for user',
            'commission_amount', 0.00
        );
        RETURN result;
    END IF;
    
    -- Set commission rate based on plan
    v_commission_rate := CASE 
        WHEN p_membership_plan = 'pro_plus' THEN 0.15
        ELSE 0.10
    END;
    
    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;
    
    -- Insert commission record
    INSERT INTO referral_commissions (
        referrer_id,
        referred_id,
        payment_id,
        membership_plan,
        membership_amount,
        commission_rate,
        commission_amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_referrer_id,
        p_user_id,
        p_payment_id,
        p_membership_plan,
        p_membership_amount,
        v_commission_rate,
        v_commission_amount,
        'pending',
        NOW(),
        NOW()
    );
    
    -- Update referral transaction to mark membership as purchased
    UPDATE referral_transactions 
    SET 
        membership_purchased = true,
        amount = p_membership_amount,
        commission_amount = v_commission_amount,
        status = 'completed',
        commission_status = 'pending',
        updated_at = NOW()
    WHERE referred_id = p_user_id 
    AND referrer_id = v_referrer_id
    AND status = 'pending';
    
    -- Update referrer's total earnings
    UPDATE referral_codes 
    SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE user_id = v_referrer_id;
    
    -- Set success response
    result := json_build_object(
        'success', true,
        'message', 'Commission processed successfully',
        'commission_amount', v_commission_amount
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Error processing commission: ' || SQLERRM,
            'commission_amount', 0.00
        );
        RETURN result;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION handle_referral_commission TO authenticated;
GRANT EXECUTE ON FUNCTION handle_referral_commission TO anon;

-- 4. Test the function
SELECT '=== TESTING FIXED FUNCTION ===' as step;
SELECT handle_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id
);

-- 5. Check U1's earnings
SELECT '=== U1 EARNINGS ===' as step;
SELECT 
    user_id,
    code,
    total_referrals,
    total_earnings,
    is_active
FROM referral_codes 
WHERE user_id = 'fbc97816-07ed-4e21-bc45-219dbfdc4cec';
