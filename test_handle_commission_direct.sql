-- Test handle_referral_commission function directly
-- Run this in your Supabase SQL Editor

-- 1. Check if function exists
SELECT '=== CHECKING FUNCTION EXISTS ===' as step;
SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_referral_commission' 
AND routine_schema = 'public';

[
  {
    "routine_name": "handle_referral_commission",
    "specific_name": "handle_referral_commission_55460",
    "routine_definition": "\nDECLARE\n    v_referrer_id uuid;\n    v_commission_rate numeric := 0.15;\n    v_commission_amount numeric;\n    result json;\nBEGIN\n    -- Get the referrer for this user\n    SELECT referrer_id INTO v_referrer_id\n    FROM referral_transactions \n    WHERE referred_id = user_id \n    AND status = 'pending'\n    AND membership_purchased = false\n    LIMIT 1;\n    \n    -- If no referrer found, return early\n    IF v_referrer_id IS NULL THEN\n        result := json_build_object(\n            'success', false,\n            'message', 'No referrer found for user',\n            'commission_amount', 0.00\n        );\n        RETURN result;\n    END IF;\n    \n    -- Set commission rate based on plan\n    v_commission_rate := CASE \n        WHEN membership_plan = 'pro_plus' THEN 0.15\n        ELSE 0.10\n    END;\n    \n    -- Calculate commission amount\n    v_commission_amount := membership_amount * v_commission_rate;\n    \n    -- Insert commission record\n    INSERT INTO referral_commissions (\n        referrer_id,\n        referred_id,\n        payment_id,\n        membership_plan,\n        membership_amount,\n        commission_rate,\n        commission_amount,\n        status,\n        created_at,\n        updated_at\n    ) VALUES (\n        v_referrer_id,\n        user_id,\n        payment_id,\n        membership_plan,\n        membership_amount,\n        v_commission_rate,\n        v_commission_amount,\n        'pending',\n        NOW(),\n        NOW()\n    );\n    \n    -- Update referral transaction to mark membership as purchased\n    UPDATE referral_transactions \n    SET \n        membership_purchased = true,\n        amount = membership_amount,\n        commission_amount = v_commission_amount,\n        status = 'completed',\n        commission_status = 'pending',\n        updated_at = NOW()\n    WHERE referred_id = user_id \n    AND referrer_id = v_referrer_id\n    AND status = 'pending';\n    \n    -- Update referrer's total earnings\n    UPDATE referral_codes \n    SET \n        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,\n        total_referrals = COALESCE(total_referrals, 0) + 1,\n        updated_at = NOW()\n    WHERE user_id = v_referrer_id;\n    \n    -- Set success response\n    result := json_build_object(\n        'success', true,\n        'message', 'Commission processed successfully',\n        'commission_amount', v_commission_amount\n    );\n    \n    RETURN result;\n    \nEXCEPTION\n    WHEN OTHERS THEN\n        result := json_build_object(\n            'success', false,\n            'message', 'Error processing commission: ' || SQLERRM,\n            'commission_amount', 0.00\n        );\n        RETURN result;\nEND;\n"
  }
]

-- 2. Check function parameters
SELECT '=== FUNCTION PARAMETERS ===' as step;
SELECT 
    parameter_name,
    parameter_mode,
    data_type,
    ordinal_position
FROM information_schema.parameters 
WHERE specific_name IN (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'handle_referral_commission' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

[
  {
    "parameter_name": "membership_amount",
    "parameter_mode": "IN",
    "data_type": "numeric",
    "ordinal_position": 1
  },
  {
    "parameter_name": "membership_plan",
    "parameter_mode": "IN",
    "data_type": "character varying",
    "ordinal_position": 2
  },
  {
    "parameter_name": "payment_id",
    "parameter_mode": "IN",
    "data_type": "uuid",
    "ordinal_position": 3
  },
  {
    "parameter_name": "user_id",
    "parameter_mode": "IN",
    "data_type": "uuid",
    "ordinal_position": 4
  }
]

-- 3. Test the function with 4 parameters
SELECT '=== TESTING WITH 4 PARAMETERS ===' as step;
SELECT handle_referral_commission(
    2.00,  -- membership_amount
    'pro_plus',  -- membership_plan
    (SELECT id FROM payments WHERE user_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870' ORDER BY created_at DESC LIMIT 1)::UUID,  -- payment_id
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- user_id
);
[
  {
    "handle_referral_commission": {
      "success": false,
      "message": "Error processing commission: column reference \"user_id\" is ambiguous",
      "commission_amount": 0
    }
  }
]
-- 4. Test the function with 3 parameters (what Supabase is looking for)
SELECT '=== TESTING WITH 3 PARAMETERS ===' as step;
SELECT handle_referral_commission(
    2.00,  -- membership_amount
    'pro_plus',  -- membership_plan
    '9948aaa7-1746-465a-968a-3f8c5b3d5870'::UUID  -- user_id
);

-- 5. Check referral transactions for U2
SELECT '=== U2 REFERRAL TRANSACTIONS ===' as step;
SELECT 
    referrer_id,
    referred_id,
    referral_code,
    status,
    membership_purchased,
    created_at
FROM referral_transactions 
WHERE referred_id = '9948aaa7-1746-465a-968a-3f8c5b3d5870'
ORDER BY created_at DESC;
