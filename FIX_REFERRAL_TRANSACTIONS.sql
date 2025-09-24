-- Fix for referral_transactions table missing columns
-- This fixes the "column referral_code of relation referral_transactions does not exist" error

-- Add the missing columns to referral_transactions table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_referral_transactions_referral_code" 
ON "public"."referral_transactions" USING "btree" ("referral_code");

CREATE INDEX IF NOT EXISTS "idx_referral_transactions_commission_status" 
ON "public"."referral_transactions" USING "btree" ("commission_status");

-- Grant permissions to the new columns
GRANT ALL ON TABLE "public"."referral_transactions" TO "anon";
GRANT ALL ON TABLE "public"."referral_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_transactions" TO "service_role";

-- Verify the fix by checking if columns exist
DO $$
BEGIN
    -- Check if referral_code column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'referral_code'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'referral_code column was not added successfully';
    END IF;
    
    -- Check if commission_amount column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'commission_amount'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'commission_amount column was not added successfully';
    END IF;
    
    -- Check if commission_status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'commission_status'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'commission_status column was not added successfully';
    END IF;
    
    -- Check if first_membership_only column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'first_membership_only'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'first_membership_only column was not added successfully';
    END IF;
    
    -- Check if membership_purchased column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referral_transactions' 
        AND column_name = 'membership_purchased'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'membership_purchased column was not added successfully';
    END IF;
    
    RAISE NOTICE 'All referral_transactions columns added successfully!';
END $$;
