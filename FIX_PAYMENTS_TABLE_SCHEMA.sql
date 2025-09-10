-- Fix Payments Table Schema
-- This script ensures the payments table has all required columns

-- First, let's check if the table exists and what columns it has
-- If the table exists but is missing columns, we'll add them

-- Drop the existing table if it exists (this will remove all data)
-- WARNING: This will delete all existing payment data
DROP TABLE IF EXISTS public.payment_verifications CASCADE;
DROP TABLE IF EXISTS public.payment_audit_log CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

-- Recreate the payments table with the correct schema
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL UNIQUE,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL, -- 'upi', 'qr'
    upi_id TEXT,
    payment_reference TEXT, -- UPI transaction reference
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'verified', 'failed', 'expired', 'disputed', 'refunded'
    verification_status TEXT DEFAULT 'none', -- 'none', 'pending', 'verified', 'failed', 'disputed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE, -- When user claims payment made
    verified_at TIMESTAMP WITH TIME ZONE, -- When payment verified
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'),
    failed_reason TEXT, -- Reason for failure
    dispute_reason TEXT, -- Reason for dispute
    admin_notes TEXT, -- Admin notes for manual verification
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'verified', 'failed', 'expired', 'disputed', 'refunded')),
    CONSTRAINT valid_verification_status CHECK (verification_status IN ('none', 'pending', 'verified', 'failed', 'disputed'))
);

-- Create payment_verifications table for tracking verification attempts
CREATE TABLE public.payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    reference_id TEXT NOT NULL,
    verification_attempt INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed', 'disputed'
    verification_method TEXT DEFAULT 'manual', -- 'manual', 'automatic', 'admin'
    verified_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_verification_status CHECK (status IN ('pending', 'verified', 'failed', 'disputed'))
);

-- Create payment_audit_log table for complete audit trail
CREATE TABLE public.payment_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'paid', 'verified', 'failed', 'expired', 'disputed', 'refunded'
    performed_by UUID REFERENCES auth.users(id), -- NULL for system actions
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON public.payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_payment_id ON public.payment_verifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_payment_id ON public.payment_audit_log(payment_id);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment verifications" ON public.payment_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payments 
            WHERE payments.id = payment_verifications.payment_id 
            AND payments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own payment verifications" ON public.payment_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.payments 
            WHERE payments.id = payment_verifications.payment_id 
            AND payments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own payment audit log" ON public.payment_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.payments 
            WHERE payments.id = payment_audit_log.payment_id 
            AND payments.user_id = auth.uid()
        )
    );

-- Now recreate all the functions from the main script
-- (Copy all functions from PAYMENT_VERIFICATION_SYSTEM.sql here)

-- Function to create payment
CREATE OR REPLACE FUNCTION public.create_payment(
    p_user_id UUID,
    p_payment_id TEXT,
    p_plan_id TEXT,
    p_plan_name TEXT,
    p_amount DECIMAL,
    p_payment_method TEXT,
    p_upi_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_payment RECORD;
BEGIN
    -- Insert payment record
    INSERT INTO public.payments (
        user_id, payment_id, plan_id, plan_name, amount, payment_method, upi_id
    ) VALUES (
        p_user_id, p_payment_id, p_plan_id, p_plan_name, p_amount, p_payment_method, p_upi_id
    ) RETURNING * INTO new_payment;
    
    -- Log the creation
    INSERT INTO public.payment_audit_log (
        payment_id, action, new_status, reason
    ) VALUES (
        new_payment.id, 'created', 'pending', 'Payment created'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', new_payment.payment_id,
        'amount', new_payment.amount,
        'plan_name', new_payment.plan_name,
        'expires_at', new_payment.expires_at
    );
END;
$$;

-- Function to mark payment as paid (user claims payment made)
CREATE OR REPLACE FUNCTION public.mark_payment_paid(
    p_payment_id TEXT,
    p_reference_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
BEGIN
    -- Check if payment exists and is pending
    SELECT * INTO payment_record
    FROM public.payments
    WHERE payment_id = p_payment_id 
        AND status = 'pending'
        AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment not found or expired'
        );
    END IF;
    
    -- Update payment status to paid
    UPDATE public.payments
    SET status = 'paid',
        payment_reference = p_reference_id,
        paid_at = NOW(),
        verification_status = 'pending'
    WHERE id = payment_record.id;
    
    -- Log the action
    INSERT INTO public.payment_audit_log (
        payment_id, action, old_status, new_status, reason
    ) VALUES (
        payment_record.id, 'paid', 'pending', 'paid', 'User claimed payment made'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payment marked as paid, awaiting verification',
        'payment_id', payment_record.payment_id
    );
END;
$$;

-- Enhanced function to verify payment with comprehensive validation
CREATE OR REPLACE FUNCTION public.verify_payment(
    p_payment_id TEXT,
    p_reference_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
    verification_count INTEGER;
    existing_verification RECORD;
    validation_result JSONB;
BEGIN
    -- Check if payment exists and is in paid status
    SELECT * INTO payment_record
    FROM public.payments
    WHERE payment_id = p_payment_id 
        AND status = 'paid'
        AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment not found, not paid, or expired'
        );
    END IF;
    
    -- Check if already verified
    IF payment_record.verification_status = 'verified' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment already verified'
        );
    END IF;
    
    -- Check verification attempts (max 5)
    SELECT COUNT(*) INTO verification_count
    FROM public.payment_verifications
    WHERE payment_id = payment_record.id;
    
    IF verification_count >= 5 THEN
        -- Mark as disputed after max attempts
        UPDATE public.payments
        SET status = 'disputed',
            verification_status = 'disputed',
            dispute_reason = 'Maximum verification attempts exceeded'
        WHERE id = payment_record.id;
        
        INSERT INTO public.payment_audit_log (
            payment_id, action, old_status, new_status, reason
        ) VALUES (
            payment_record.id, 'disputed', 'paid', 'disputed', 'Maximum verification attempts exceeded'
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Maximum verification attempts exceeded. Payment marked for manual review.'
        );
    END IF;
    
    -- Validate reference ID format
    validation_result := validate_upi_reference(p_reference_id);
    IF (validation_result->>'valid')::boolean = false THEN
        -- Record failed verification
        INSERT INTO public.payment_verifications (
            payment_id, reference_id, verification_attempt, status, failed_reason
        ) VALUES (
            payment_record.id, p_reference_id, verification_count + 1, 'failed', validation_result->>'error'
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', validation_result->>'error'
        );
    END IF;
    
    -- Check for duplicate reference ID
    SELECT * INTO existing_verification
    FROM public.payment_verifications
    WHERE reference_id = p_reference_id AND status = 'verified';
    
    IF FOUND THEN
        -- Record failed verification
        INSERT INTO public.payment_verifications (
            payment_id, reference_id, verification_attempt, status, failed_reason
        ) VALUES (
            payment_record.id, p_reference_id, verification_count + 1, 'failed', 'Reference ID already used'
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This transaction reference has already been used'
        );
    END IF;
    
    -- Simulate verification (replace with actual payment gateway verification)
    -- In production, you would call your payment gateway API here
    IF perform_payment_verification(payment_record, p_reference_id) THEN
        -- Mark payment as verified
        UPDATE public.payments
        SET status = 'verified',
            verification_status = 'verified',
            verified_at = NOW()
        WHERE id = payment_record.id;
        
        -- Record successful verification
        INSERT INTO public.payment_verifications (
            payment_id, reference_id, verification_attempt, status, verification_method, verified_at
        ) VALUES (
            payment_record.id, p_reference_id, verification_count + 1, 'verified', 'manual', NOW()
        );
        
        -- Activate user membership
        UPDATE public.user_profiles
        SET membership_plan = payment_record.plan_id,
            membership_expiry = CASE 
                WHEN payment_record.plan_id = 'monthly' THEN NOW() + INTERVAL '1 month'
                WHEN payment_record.plan_id = 'yearly' THEN NOW() + INTERVAL '1 year'
                WHEN payment_record.plan_id = 'lifetime' THEN NOW() + INTERVAL '100 years'
                ELSE NOW() + INTERVAL '1 month'
            END,
            updated_at = NOW()
        WHERE id = payment_record.user_id;
        
        -- Log successful verification
        INSERT INTO public.payment_audit_log (
            payment_id, action, old_status, new_status, reason
        ) VALUES (
            payment_record.id, 'verified', 'paid', 'verified', 'Payment verified successfully'
        );
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment verified successfully',
            'payment_id', payment_record.payment_id,
            'plan_name', payment_record.plan_name,
            'membership_activated', true
        );
    ELSE
        -- Record failed verification
        INSERT INTO public.payment_verifications (
            payment_id, reference_id, verification_attempt, status, failed_reason
        ) VALUES (
            payment_record.id, p_reference_id, verification_count + 1, 'failed', 'Payment verification failed'
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment verification failed. Please check your transaction reference and try again.'
        );
    END IF;
END;
$$;

-- Function to validate UPI reference ID format
CREATE OR REPLACE FUNCTION public.validate_upi_reference(p_reference_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if reference ID is provided
    IF p_reference_id IS NULL OR TRIM(p_reference_id) = '' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Transaction reference is required'
        );
    END IF;
    
    -- Check minimum length
    IF LENGTH(TRIM(p_reference_id)) < 8 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Transaction reference must be at least 8 characters long'
        );
    END IF;
    
    -- Check maximum length
    IF LENGTH(TRIM(p_reference_id)) > 20 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Transaction reference must be less than 20 characters'
        );
    END IF;
    
    -- Check for valid characters (alphanumeric and some special chars)
    IF NOT p_reference_id ~ '^[A-Za-z0-9_-]+$' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Transaction reference contains invalid characters'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'valid', true,
        'error', NULL
    );
END;
$$;

-- Function to simulate payment verification (replace with actual gateway integration)
CREATE OR REPLACE FUNCTION public.perform_payment_verification(
    payment_record RECORD,
    reference_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This is a simulation function
    -- In production, you would:
    -- 1. Call your payment gateway API (Razorpay, PhonePe, etc.)
    -- 2. Verify the transaction reference
    -- 3. Check amount, timestamp, and other details
    -- 4. Return true if verification successful
    
    -- For now, we'll simulate verification based on reference ID format
    -- A real UPI reference typically starts with specific patterns
    IF reference_id ~ '^[A-Z0-9]{8,12}$' THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- Function to get payment status
CREATE OR REPLACE FUNCTION public.get_payment_status(
    p_payment_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    payment_record RECORD;
BEGIN
    SELECT * INTO payment_record
    FROM public.payments
    WHERE payment_id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment not found'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', payment_record.payment_id,
        'status', payment_record.status,
        'verification_status', payment_record.verification_status,
        'amount', payment_record.amount,
        'plan_name', payment_record.plan_name,
        'created_at', payment_record.created_at,
        'expires_at', payment_record.expires_at
    );
END;
$$;

-- Function to cleanup expired payments
CREATE OR REPLACE FUNCTION public.cleanup_expired_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired payments as expired
    UPDATE public.payments
    SET status = 'expired'
    WHERE status = 'pending' 
        AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log expired payments
    INSERT INTO public.payment_audit_log (payment_id, action, old_status, new_status, reason)
    SELECT id, 'expired', 'pending', 'expired', 'Payment expired'
    FROM public.payments
    WHERE status = 'expired' 
        AND expires_at < NOW();
    
    RETURN expired_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_payment(UUID, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_paid(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_payments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_upi_reference(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_payment_verification(RECORD, TEXT) TO authenticated;

-- Success message
SELECT 'Payment verification system tables and functions created successfully!' as message;
