-- Fix for referral_commissions table missing membership_amount column
-- This fixes the "column rc.membership_amount does not exist" error in get_referral_network_detailed function

-- Add the missing membership_amount column to referral_commissions table
ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_amount" numeric(10,2) DEFAULT 0;

-- Add membership_plan column for better tracking
ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_plan" character varying(50) DEFAULT 'none';

-- Add membership_purchased_date for tracking when membership was purchased
ALTER TABLE "public"."referral_commissions" 
ADD COLUMN IF NOT EXISTS "membership_purchased_date" timestamp with time zone;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_referral_commissions_membership_amount" 
ON "public"."referral_commissions" USING "btree" ("membership_amount");

CREATE INDEX IF NOT EXISTS "idx_referral_commissions_membership_plan" 
ON "public"."referral_commissions" USING "btree" ("membership_plan");

-- Grant permissions to the new columns
GRANT ALL ON TABLE "public"."referral_commissions" TO "anon";
GRANT ALL ON TABLE "public"."referral_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_commissions" TO "service_role";

-- Verify the fix by checking if columns exist
DO $$
BEGIN
    -- Check if membership_amount column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_commissions' 
        AND column_name = 'membership_amount'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'membership_amount column was not added successfully';
    END IF;
    
    -- Check if membership_plan column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_commissions' 
        AND column_name = 'membership_plan'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'membership_plan column was not added successfully';
    END IF;
    
    -- Check if membership_purchased_date column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_commissions' 
        AND column_name = 'membership_purchased_date'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'membership_purchased_date column was not added successfully';
    END IF;
    
    RAISE NOTICE 'All referral_commissions columns added successfully!';
END $$;
