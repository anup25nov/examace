-- ========================================
-- ESSENTIAL REFERRAL SYSTEM FIX
-- Run this FIRST in Supabase SQL Editor
-- ========================================

-- Step 1: Add missing columns to referral_transactions table
ALTER TABLE public.referral_transactions 
ADD COLUMN IF NOT EXISTS referral_code character varying(50),
ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_status character varying(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS membership_purchased boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_id uuid,
ADD COLUMN IF NOT EXISTS first_membership_only boolean DEFAULT true;

-- Step 2: Add constraints for new columns (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_commission_status_valid'
    ) THEN
        ALTER TABLE public.referral_transactions 
        ADD CONSTRAINT check_commission_status_valid 
        CHECK (commission_status IN ('pending', 'paid', 'cancelled', 'refunded'));
    END IF;
END $$;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referral_code 
ON public.referral_transactions(referral_code);

CREATE INDEX IF NOT EXISTS idx_referral_transactions_payment_id 
ON public.referral_transactions(payment_id);

CREATE INDEX IF NOT EXISTS idx_referral_transactions_commission_status 
ON public.referral_transactions(commission_status);

-- Step 4: Update existing records to have default values
UPDATE public.referral_transactions 
SET 
  commission_amount = 0,
  commission_status = 'pending',
  membership_purchased = false,
  first_membership_only = true
WHERE commission_amount IS NULL;

-- Step 5: Add foreign key constraint for payment_id (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_referral_transactions_payment_id'
    ) THEN
        ALTER TABLE public.referral_transactions 
        ADD CONSTRAINT fk_referral_transactions_payment_id 
        FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 6: Add comments
COMMENT ON COLUMN public.referral_transactions.referral_code IS 'The referral code used for this transaction';
COMMENT ON COLUMN public.referral_transactions.commission_amount IS 'Commission amount earned by referrer';
COMMENT ON COLUMN public.referral_transactions.commission_status IS 'Status of commission payment (pending, paid, cancelled, refunded)';
COMMENT ON COLUMN public.referral_transactions.membership_purchased IS 'Whether a membership was purchased in this transaction';
COMMENT ON COLUMN public.referral_transactions.payment_id IS 'Reference to the payment that triggered this referral';
COMMENT ON COLUMN public.referral_transactions.first_membership_only IS 'Whether commission is only for first membership purchase';

-- Success message
SELECT 'Essential referral system fix completed! ✅' as message;
