-- Comprehensive fix for referral commission system
-- This addresses multiple issues preventing commissions from being credited

-- 1. First, add missing columns to referral_commissions table
ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_amount" numeric(10,2) DEFAULT 0;

ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_plan" character varying(50) DEFAULT 'none';

ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_purchased_date" timestamp with time zone;

ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "payment_id" uuid;

ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "commission_rate" numeric(5,2) DEFAULT 0;

-- 2. Add missing columns to referral_transactions table
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

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_referral_commissions_membership_amount" 
ON "public"."referral_commissions" USING "btree" ("membership_amount");

CREATE INDEX IF NOT EXISTS "idx_referral_commissions_payment_id" 
ON "public"."referral_commissions" USING "btree" ("payment_id");

CREATE INDEX IF NOT EXISTS "idx_referral_transactions_referral_code" 
ON "public"."referral_transactions" USING "btree" ("referral_code");

CREATE INDEX IF NOT EXISTS "idx_referral_transactions_commission_status" 
ON "public"."referral_transactions" USING "btree" ("commission_status");

-- 4. Fix the process_payment_and_membership function to include commission processing
CREATE OR REPLACE FUNCTION "public"."process_payment_and_membership"("p_payment_id" "uuid", "p_payment_gateway_id" character varying, "p_user_id" "uuid", "p_plan_id" character varying, "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_plan RECORD;
  v_membership_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
  v_commission_result RECORD;
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
    SELECT * INTO v_commission_result
    FROM process_membership_commission(
      p_user_id,
      p_payment_id,
      p_plan_id,
      p_amount
    );
    
    -- Return success with commission info
    RETURN jsonb_build_object(
      'success', true,
      'membership_id', (SELECT id FROM user_memberships WHERE user_id = p_user_id),
      'expires_at', v_expires_at,
      'commission_processed', v_commission_result.success,
      'commission_amount', COALESCE(v_commission_result.commission_amount, 0),
      'commission_message', v_commission_result.message
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback on error
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
END;
$$;

-- 5. Create a function to process commissions for existing memberships that missed commissions
CREATE OR REPLACE FUNCTION "public"."process_missing_commissions"() 
RETURNS TABLE("processed_count" integer, "total_commission" numeric)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_total_commission numeric := 0;
  v_record RECORD;
  v_commission_result RECORD;
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
    )
  LOOP
    -- Process commission for this membership
    SELECT * INTO v_commission_result
    FROM process_membership_commission(
      v_record.user_id,
      v_record.membership_transaction_id,
      v_record.plan_id,
      v_record.amount
    );
    
    IF v_commission_result.success THEN
      v_count := v_count + 1;
      v_total_commission := v_total_commission + COALESCE(v_commission_result.commission_amount, 0);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_total_commission;
END;
$$;

-- 6. Create a function to check commission status for debugging
CREATE OR REPLACE FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") 
RETURNS TABLE(
  "user_id" uuid,
  "has_referral" boolean,
  "referral_status" text,
  "membership_count" integer,
  "commission_count" integer,
  "total_commission" numeric,
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
      (SELECT MAX(created_at) FROM membership_transactions WHERE user_id = p_user_id AND status = 'completed') as last_membership_date;
  END IF;
END;
$$;

-- 7. Grant permissions
GRANT ALL ON TABLE "public"."referral_commissions" TO "anon";
GRANT ALL ON TABLE "public"."referral_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_commissions" TO "service_role";

GRANT ALL ON TABLE "public"."referral_transactions" TO "anon";
GRANT ALL ON TABLE "public"."referral_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_transactions" TO "service_role";

-- 8. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."process_missing_commissions"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "anon";
GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."debug_commission_status"("p_user_id" "uuid") TO "service_role";

-- 9. Verify the fix
DO $$
BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_commissions' 
        AND column_name = 'membership_amount'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'referral_commissions.membership_amount column was not added successfully';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'referral_code'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'referral_transactions.referral_code column was not added successfully';
    END IF;
    
    RAISE NOTICE 'All referral commission system fixes applied successfully!';
    RAISE NOTICE 'Use SELECT * FROM process_missing_commissions(); to process missed commissions';
    RAISE NOTICE 'Use SELECT * FROM debug_commission_status(user_id); to debug commission status';
END $$;
