-- Simple Payments Table Fix
-- This script adds missing columns without complex constraint checking

-- Add missing columns to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failed_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
