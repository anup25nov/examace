-- Create Referral RPC Functions
-- Run this after the schema fix

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.process_referral_commission CASCADE;
DROP FUNCTION IF EXISTS public.get_referral_stats CASCADE;

-- Create function to process referral commission properly
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_commission TO service_role;

-- Create function to get referral stats
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats TO service_role;
