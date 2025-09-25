-- Fix for referral commission system - Webhook Integration
-- The main issue: process_payment_and_membership function doesn't process commissions
-- The system uses referral_codes.total_earnings as the main earnings table

-- 1. First, ensure all required columns exist
ALTER TABLE "public"."referral_transactions" 
ADD COLUMN IF NOT EXISTS "referral_code" character varying(20);

ALTER TABLE "public"."referral_transactions" 
ADD COLUMN IF NOT EXISTS "commission_amount" numeric(10,2) DEFAULT 0;

ALTER TABLE "public"."referral_transactions" 
ADD COLUMN IF NOT EXISTS "commission_status" character varying(20) DEFAULT 'pending';

ALTER TABLE "public"."referral_transactions" 
ADD COLUMN IF NOT EXISTS "first_membership_only" boolean DEFAULT true;

ALTER TABLE "public"."referral_transactions" 
ADD COLUMN IF NOT EXISTS "membership_purchased" boolean DEFAULT false;

-- 2. Fix the process_payment_and_membership function to include commission processing
CREATE OR REPLACE FUNCTION "public"."process_payment_and_membership"("p_payment_id" "uuid", "p_payment_gateway_id" character varying, "p_user_id" "uuid", "p_plan_id" character varying, "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_plan RECORD;
  v_membership_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
  v_commission_result RECORD;
  v_referrer_id UUID;
  v_commission_amount DECIMAL(10,2) := 0;
  v_commission_rate DECIMAL(5,2) := 0.15; -- 15% commission rate
BEGIN
  -- Start transaction
  BEGIN
    -- Get plan details
    SELECT * INTO v_plan
    FROM membership_plans
    WHERE id = p_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Plan not found or inactive'
      );
    END IF;
    
    -- Calculate membership expiry
    v_expires_at := NOW() + INTERVAL '1 day' * v_plan.duration_days;
    
    -- Update payment status
    UPDATE membership_transactions
    SET 
      status = 'completed',
      gateway_payment_id = p_payment_gateway_id,
      completed_at = NOW()
    WHERE id = p_payment_id;
    
    -- Create or update user membership
    INSERT INTO user_memberships (
      user_id,
      plan_id,
      status,
      starts_at,
      expires_at,
      created_at
    ) VALUES (
      p_user_id,
      p_plan_id,
      'active',
      NOW(),
      v_expires_at,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan_id = p_plan_id,
      status = 'active',
      starts_at = NOW(),
      expires_at = v_expires_at,
      updated_at = NOW();
    
    -- Update user profile with membership info
    UPDATE user_profiles
    SET 
      membership_plan = p_plan_id,
      membership_expiry = v_expires_at,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Process referral commission if user has a referrer
    -- Check if user has a pending referral transaction
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = p_user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Calculate commission amount
      v_commission_amount := p_amount * v_commission_rate;
      
      -- Update referral transaction
      UPDATE referral_transactions
      SET 
        amount = p_amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        status = 'completed',
        updated_at = NOW()
      WHERE referred_id = p_user_id 
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
        p_user_id,
        p_payment_id,
        p_plan_id,
        p_amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
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
        v_referrer_id, p_amount, v_commission_amount;
    END IF;
    
    -- Return success with commission info
    RETURN jsonb_build_object(
      'success', true,
      'membership_id', (SELECT id FROM user_memberships WHERE user_id = p_user_id),
      'expires_at', v_expires_at,
      'commission_processed', (v_referrer_id IS NOT NULL),
      'commission_amount', COALESCE(v_commission_amount, 0),
      'referrer_id', v_referrer_id
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      RAISE NOTICE 'Error in process_payment_and_membership: %', SQLERRM;
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
END;
$$;

-- 3. Drop existing function and create a new one to process missed commissions for existing memberships
DROP FUNCTION IF EXISTS "public"."process_missing_commissions"();

CREATE OR REPLACE FUNCTION "public"."process_missing_commissions"() 
RETURNS TABLE("processed_count" integer, "total_commission" numeric)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_total_commission numeric := 0;
  v_record RECORD;
  v_referrer_id UUID;
  v_commission_amount DECIMAL(10,2);
  v_commission_rate DECIMAL(5,2) := 0.15;
BEGIN
  -- Find membership transactions that don't have corresponding commissions
  FOR v_record IN
    SELECT 
      mt.user_id,
      mt.id as membership_transaction_id,
      mt.plan_id,
      mt.amount,
      mt.created_at
    FROM membership_transactions mt
    WHERE mt.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM referral_commissions rc 
      WHERE rc.referred_id = mt.user_id 
      AND rc.payment_id = mt.id
    )
    AND EXISTS (
      SELECT 1 FROM referral_transactions rt 
      WHERE rt.referred_id = mt.user_id 
      AND rt.status = 'pending'
      AND rt.membership_purchased = false
    )
  LOOP
    -- Get referrer for this user
    SELECT referrer_id INTO v_referrer_id
    FROM referral_transactions
    WHERE referred_id = v_record.user_id 
    AND status = 'pending'
    AND membership_purchased = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_referrer_id IS NOT NULL THEN
      -- Calculate commission
      v_commission_amount := v_record.amount * v_commission_rate;
      
      -- Update referral transaction
      UPDATE referral_transactions
      SET 
        amount = v_record.amount,
        commission_amount = v_commission_amount,
        commission_status = 'pending',
        membership_purchased = true,
        status = 'completed',
        updated_at = NOW()
      WHERE referred_id = v_record.user_id 
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
        v_record.user_id,
        v_record.membership_transaction_id,
        v_record.plan_id,
        v_record.amount,
        v_commission_amount,
        v_commission_rate,
        'pending',
        NOW()
      );
      
      -- Update referrer's total earnings
      UPDATE referral_codes
      SET 
        total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
      WHERE user_id = v_referrer_id;
      
      v_count := v_count + 1;
      v_total_commission := v_total_commission + v_commission_amount;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_total_commission;
END;
$$;

-- 4. Drop existing function and create a new one to debug commission status
DROP FUNCTION IF EXISTS "public"."debug_commission_status"("p_user_id" "uuid");

CREATE OR REPLACE FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") 
RETURNS TABLE(
  "user_id" uuid,
  "has_referral" boolean,
  "referral_status" text,
  "membership_count" integer,
  "commission_count" integer,
  "total_commission" numeric,
  "referral_codes_earnings" numeric,
  "last_membership_date" timestamp with time zone
)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_user_id,
    EXISTS(SELECT 1 FROM referral_transactions WHERE referred_id = p_user_id) as has_referral,
    COALESCE(rt.status, 'none') as referral_status,
    (SELECT COUNT(*) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as membership_count,
    (SELECT COUNT(*) FROM referral_commissions WHERE referred_id = p_user_id) as commission_count,
    (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_commissions WHERE referred_id = p_user_id) as total_commission,
    (SELECT COALESCE(rc.total_earnings, 0) FROM referral_codes rc 
     JOIN referral_transactions rt ON rc.user_id = rt.referrer_id 
     WHERE rt.referred_id = p_user_id LIMIT 1) as referral_codes_earnings,
    (SELECT MAX(created_at) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as last_membership_date
  FROM referral_transactions rt
  WHERE rt.referred_id = p_user_id
  LIMIT 1;
  
  -- If no referral found, return basic info
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p_user_id,
      false as has_referral,
      'none' as referral_status,
      (SELECT COUNT(*) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as membership_count,
      (SELECT COUNT(*) FROM referral_commissions WHERE referred_id = p_user_id) as commission_count,
      (SELECT COALESCE(SUM(commission_amount), 0) FROM referral_commissions WHERE referred_id = p_user_id) as total_commission,
      0 as referral_codes_earnings,
      (SELECT MAX(created_at) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as last_membership_date;
  END IF;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "service_role";

-- 6. Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Referral commission webhook fix applied successfully!';
    RAISE NOTICE 'The process_payment_and_membership function now includes commission processing';
    RAISE NOTICE 'Use SELECT * FROM process_missing_commissions(); to process missed commissions';
    RAISE NOTICE 'Use SELECT * FROM debug_commission_status(user_id); to debug commission status';
END $$;
