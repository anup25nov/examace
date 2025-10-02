-- Create Test Referral Code
-- Run this in Supabase SQL Editor

-- First, let's create a referral code for the test user
-- Check if referral code already exists for this user
DO $$ 
BEGIN
    -- Delete existing referral code for this user if it exists
    DELETE FROM public.referral_codes 
    WHERE user_id = 'd791ba76-4059-4460-bda6-3020bf786100';
    
    -- Insert new referral code
    INSERT INTO public.referral_codes (
        user_id,
        code,
        total_referrals,
        total_earnings,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        'd791ba76-4059-4460-bda6-3020bf786100', -- Your test user ID
        'TEST123',
        0,
        0.00,
        true,
        NOW(),
        NOW()
    );
END $$;

-- Verify the referral code was created
SELECT 
    'REFERRAL CODE CREATED:' as status,
    user_id,
    code,
    is_active,
    created_at
FROM public.referral_codes 
WHERE user_id = 'd791ba76-4059-4460-bda6-3020bf786100';

-- Also create a test referral transaction to verify the schema
-- First check if we have any payments, if not create a test payment
DO $$ 
DECLARE
    payment_count INTEGER;
    test_payment_id UUID;
BEGIN
    -- Check if we have any payments
    SELECT COUNT(*) INTO payment_count FROM public.payments;
    
    -- If no payments exist, create a test payment
    IF payment_count = 0 THEN
        INSERT INTO public.payments (
            payment_id,
            user_id,
            plan_id,
            plan_name,
            amount,
            currency,
            payment_method,
            status,
            razorpay_order_id,
            created_at,
            updated_at
        ) VALUES (
            'PAY_TEST_' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'd791ba76-4059-4460-bda6-3020bf786100',
            'pro',
            'Pro Plan',
            99.00,
            'INR',
            'razorpay',
            'completed',
            'order_test_' || EXTRACT(EPOCH FROM NOW())::TEXT,
            NOW(),
            NOW()
        ) RETURNING id INTO test_payment_id;
    ELSE
        -- Get the latest payment ID
        SELECT id INTO test_payment_id FROM public.payments ORDER BY created_at DESC LIMIT 1;
    END IF;
    
    -- Create referral transaction
    INSERT INTO public.referral_transactions (
        referrer_id,
        referred_id,
        referral_code,
        amount,
        transaction_type,
        status,
        commission_amount,
        commission_status,
        membership_purchased,
        payment_id,
        first_membership_only
    ) VALUES (
        'd791ba76-4059-4460-bda6-3020bf786100', -- referrer
        'd791ba76-4059-4460-bda6-3020bf786100', -- referred (same user for test)
        'TEST123',
        99.00,
        'referral',
        'completed',
        14.85, -- 15% of 99
        'pending',
        true,
        test_payment_id,
        true
    );
END $$;

-- Verify the transaction was created
SELECT 
    'REFERRAL TRANSACTION CREATED:' as status,
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    commission_amount,
    commission_status
FROM public.referral_transactions 
WHERE referral_code = 'TEST123';

-- Success message
SELECT 'Test referral code and transaction created successfully! ✅' as message;
