-- Quick Fix: Add Missing Columns to Existing Payments Table
-- This script adds missing columns without dropping existing data

-- Check if plan_name column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'plan_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN plan_name TEXT;
    END IF;
END $$;

-- Check if verification_status column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'verification_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN verification_status TEXT DEFAULT 'none';
    END IF;
END $$;

-- Check if paid_at column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'paid_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Check if verified_at column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'verified_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Check if failed_reason column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'failed_reason'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN failed_reason TEXT;
    END IF;
END $$;

-- Check if dispute_reason column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'dispute_reason'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN dispute_reason TEXT;
    END IF;
END $$;

-- Check if admin_notes column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'admin_notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- Check if metadata column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'metadata'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update existing records to have plan_name if it's NULL
UPDATE public.payments 
SET plan_name = CASE 
    WHEN plan_id = 'monthly' THEN 'Monthly Premium'
    WHEN plan_id = 'yearly' THEN 'Yearly Premium'
    WHEN plan_id = 'lifetime' THEN 'Lifetime Access'
    WHEN plan_id = 'free' THEN 'Free Plan'
    ELSE 'Unknown Plan'
END
WHERE plan_name IS NULL;

-- Add constraints if they don't exist
DO $$ 
BEGIN
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_status'
    ) THEN
        ALTER TABLE public.payments ADD CONSTRAINT valid_status 
        CHECK (status IN ('pending', 'paid', 'verified', 'failed', 'expired', 'disputed', 'refunded'));
    END IF;
    
    -- Add verification_status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'valid_verification_status'
    ) THEN
        ALTER TABLE public.payments ADD CONSTRAINT valid_verification_status 
        CHECK (verification_status IN ('none', 'pending', 'verified', 'failed', 'disputed'));
    END IF;
END $$;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    reference_id TEXT NOT NULL,
    verification_attempt INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    verification_method TEXT DEFAULT 'manual',
    verified_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_verification_status CHECK (status IN ('pending', 'verified', 'failed', 'disputed'))
);

CREATE TABLE IF NOT EXISTS public.payment_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON public.payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_payment_id ON public.payment_verifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_payment_id ON public.payment_audit_log(payment_id);

-- Success message
SELECT 'Payment table schema fixed successfully! All required columns added.' as message;
