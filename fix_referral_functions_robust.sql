-- ========================================
-- ROBUST REFERRAL FUNCTIONS FIX
-- This will handle all function overloads properly
-- ========================================

-- Step 1: Show all existing functions with these names
SELECT 
    'EXISTING FUNCTIONS:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types,
    proargnames as argument_names
FROM pg_proc 
WHERE proname IN ('process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Step 2: Drop ALL existing functions with these names (regardless of signature)
DO $$ 
DECLARE
    func_record RECORD;
    drop_sql TEXT;
BEGIN
    -- Drop all process_referral_commission functions
    FOR func_record IN 
        SELECT 
            proname, 
            oidvectortypes(proargtypes) as argtypes,
            proargnames as argnames
        FROM pg_proc 
        WHERE proname = 'process_referral_commission' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Build the DROP statement with proper argument types
        drop_sql := 'DROP FUNCTION IF EXISTS public.process_referral_commission(' || func_record.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropping function: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    -- Drop all get_referral_stats functions
    FOR func_record IN 
        SELECT 
            proname, 
            oidvectortypes(proargtypes) as argtypes,
            proargnames as argnames
        FROM pg_proc 
        WHERE proname = 'get_referral_stats' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        -- Build the DROP statement with proper argument types
        drop_sql := 'DROP FUNCTION IF EXISTS public.get_referral_stats(' || func_record.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropping function: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    RAISE NOTICE 'All existing functions dropped successfully';
END $$;

-- Step 3: Verify all functions are dropped
SELECT 
    'REMAINING FUNCTIONS AFTER DROP:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Step 4: Create the new process_referral_commission function
CREATE OR REPLACE FUNCTION public.process_referral_commission(
  p_payment_id uuid,
  p_referred_user_id uuid,
  p_payment_amount numeric,
  p_referral_code text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id uuid;
  v_commission_amount numeric;
  v_existing_transaction_id uuid;
  v_new_transaction_id uuid;
  v_referrer_profile record;
BEGIN
  -- Get referrer ID from referral code
  SELECT user_id INTO v_referrer_id
  FROM public.referral_codes
  WHERE code = p_referral_code AND is_active = true;
  
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referrer not found for code: ' || p_referral_code
    );
  END IF;
  
  -- Calculate commission (15% of payment amount)
  v_commission_amount := p_payment_amount * 0.15;
  
  -- Check for existing transaction to prevent duplicates
  SELECT id INTO v_existing_transaction_id
  FROM public.referral_transactions
  WHERE referred_id = p_referred_user_id 
    AND referral_code = p_referral_code
    AND transaction_type = 'referral'
    AND payment_id = p_payment_id;
  
  IF v_existing_transaction_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Referral transaction already exists',
      'transaction_id', v_existing_transaction_id
    );
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
    v_referrer_id,
    p_referred_user_id,
    p_referral_code,
    p_payment_amount,
    'referral',
    'completed',
    v_commission_amount,
    'pending',
    true,
    p_payment_id,
    true
  ) RETURNING id INTO v_new_transaction_id;
  
  -- Update referrer's total earnings
  SELECT * INTO v_referrer_profile
  FROM public.user_profiles
  WHERE id = v_referrer_id;
  
  IF v_referrer_profile.id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET 
      total_referral_earnings = COALESCE(total_referral_earnings, 0) + v_commission_amount,
      updated_at = NOW()
    WHERE id = v_referrer_id;
  END IF;
  
  -- Update referral code stats
  UPDATE public.referral_codes
  SET 
    total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE user_id = v_referrer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_new_transaction_id,
    'referrer_id', v_referrer_id,
    'commission_amount', v_commission_amount,
    'message', 'Referral commission processed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error processing referral commission: ' || SQLERRM
    );
END;
$$;

-- Step 5: Create the new get_referral_stats function
CREATE OR REPLACE FUNCTION public.get_referral_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_referrals', COUNT(*),
    'completed_referrals', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_earnings', COALESCE(SUM(commission_amount), 0),
    'pending_earnings', COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
    'paid_earnings', COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0)
  ) INTO v_stats
  FROM public.referral_transactions
  WHERE referrer_id = p_user_id;
  
  RETURN COALESCE(v_stats, jsonb_build_object(
    'total_referrals', 0,
    'completed_referrals', 0,
    'total_earnings', 0,
    'pending_earnings', 0,
    'paid_earnings', 0
  ));
END;
$$;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO service_role;

-- Step 7: Verify the new functions were created
SELECT 
    'NEW FUNCTIONS CREATED:' as info,
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types
FROM pg_proc 
WHERE proname IN ('process_referral_commission', 'get_referral_stats')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname, oidvectortypes(proargtypes);

-- Success message
SELECT 'Referral functions created successfully! ✅' as message;
