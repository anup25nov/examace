-- Force clean function definition
-- This will drop ALL overloads and create exactly one function

-- 1. Drop ALL functions with this name (CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS process_referral_commission CASCADE;

-- 2. Create exactly one function with the correct signature
CREATE OR REPLACE FUNCTION process_referral_commission(
    p_membership_amount numeric,
    p_membership_plan character varying,
    p_payment_id uuid,
    p_user_id uuid
)
RETURNS TABLE(
    success boolean,
    message text,
    commission_amount numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_referrer_id uuid;
    v_commission_rate numeric := 0.15; -- 15% commission
    v_commission_amount numeric;
    v_referral_code_id uuid;
BEGIN
    -- Initialize return values
    success := false;
    message := 'No referrer found for user';
    commission_amount := 0.00;
    
    -- Get the referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions 
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    LIMIT 1;
    
    -- If no referrer found, return early
    IF v_referrer_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate commission amount
    v_commission_amount := p_membership_amount * v_commission_rate;
    
    -- Get the referral code ID for the referrer
    SELECT id INTO v_referral_code_id
    FROM referral_codes 
    WHERE user_id = v_referrer_id 
    AND is_active = true
    LIMIT 1;
    
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
    success := true;
    message := 'Commission processed successfully';
    commission_amount := v_commission_amount;
    
    RETURN;
    
EXCEPTION
    WHEN OTHERS THEN
        success := false;
        message := 'Error processing commission: ' || SQLERRM;
        commission_amount := 0.00;
        RETURN;
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION process_referral_commission TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_commission TO anon;

-- 4. Verify the function was created correctly
SELECT '=== VERIFICATION ===' as step;
SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_referral_commission' 
AND routine_schema = 'public';

-- 5. Test the function
SELECT '=== TEST FUNCTION ===' as step;
SELECT * FROM process_referral_commission(
    2.00,  -- p_membership_amount
    'pro_plus',  -- p_membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- p_payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- p_user_id
);
