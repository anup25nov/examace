-- Razorpay End-to-End Payment System Database Schema
-- This script creates all necessary tables and functions for the payment system

-- 1. Create payments table with proper structure
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT
);

-- 2. Create webhook events table for tracking
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON public.payments(updated_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- 4. Enable RLS on tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for payments table
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create RLS policies for webhook events (admin only)
CREATE POLICY "Admin can view webhook events" ON public.webhook_events
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM auth.users WHERE email IN (
            'admin@examace.com', 'support@examace.com'
        )
    ));

CREATE POLICY "System can insert webhook events" ON public.webhook_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update webhook events" ON public.webhook_events
    FOR UPDATE USING (true);

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.webhook_events TO anon;

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for payments table
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON public.payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to handle payment verification
CREATE OR REPLACE FUNCTION verify_payment(
    p_payment_id UUID,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT
)
RETURNS JSON AS $$
DECLARE
    payment_record RECORD;
    result JSON;
BEGIN
    -- Get payment record
    SELECT * INTO payment_record 
    FROM public.payments 
    WHERE id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment record not found'
        );
    END IF;
    
    -- Update payment status
    UPDATE public.payments 
    SET 
        razorpay_payment_id = p_razorpay_payment_id,
        razorpay_signature = p_razorpay_signature,
        status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_id;
    
    RETURN json_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'user_id', payment_record.user_id,
        'plan_id', payment_record.plan_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to activate membership
CREATE OR REPLACE FUNCTION activate_membership(
    p_user_id UUID,
    p_plan_id TEXT
)
RETURNS JSON AS $$
DECLARE
    expiry_date TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Calculate expiry date (default 1 month)
    expiry_date := NOW() + INTERVAL '1 month';
    
    -- Update user profile
    UPDATE public.user_profiles 
    SET 
        membership_plan = p_plan_id,
        membership_expiry = expiry_date,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User profile not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user_id', p_user_id,
        'plan_id', p_plan_id,
        'expiry_date', expiry_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to get payment status
CREATE OR REPLACE FUNCTION get_payment_status(
    p_payment_id UUID
)
RETURNS JSON AS $$
DECLARE
    payment_record RECORD;
BEGIN
    SELECT 
        id,
        user_id,
        razorpay_order_id,
        razorpay_payment_id,
        plan_id,
        plan_name,
        amount,
        currency,
        status,
        payment_method,
        created_at,
        updated_at,
        paid_at,
        failed_at,
        failed_reason
    INTO payment_record
    FROM public.payments 
    WHERE id = p_payment_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Payment not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'payment', json_build_object(
            'id', payment_record.id,
            'user_id', payment_record.user_id,
            'razorpay_order_id', payment_record.razorpay_order_id,
            'razorpay_payment_id', payment_record.razorpay_payment_id,
            'plan_id', payment_record.plan_id,
            'plan_name', payment_record.plan_name,
            'amount', payment_record.amount,
            'currency', payment_record.currency,
            'status', payment_record.status,
            'payment_method', payment_record.payment_method,
            'created_at', payment_record.created_at,
            'updated_at', payment_record.updated_at,
            'paid_at', payment_record.paid_at,
            'failed_at', payment_record.failed_at,
            'failed_reason', payment_record.failed_reason
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create function to get user payments
CREATE OR REPLACE FUNCTION get_user_payments(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    payments JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'razorpay_order_id', razorpay_order_id,
            'razorpay_payment_id', razorpay_payment_id,
            'plan_id', plan_id,
            'plan_name', plan_name,
            'amount', amount,
            'currency', currency,
            'status', status,
            'payment_method', payment_method,
            'created_at', created_at,
            'updated_at', updated_at,
            'paid_at', paid_at,
            'failed_at', failed_at,
            'failed_reason', failed_reason
        )
    ) INTO payments
    FROM public.payments 
    WHERE user_id = p_user_id
    ORDER BY created_at DESC;
    
    RETURN json_build_object(
        'success', true,
        'payments', COALESCE(payments, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create function to log webhook event
CREATE OR REPLACE FUNCTION log_webhook_event(
    p_event_id TEXT,
    p_event_type TEXT,
    p_payment_id TEXT DEFAULT NULL,
    p_order_id TEXT DEFAULT NULL,
    p_raw_data JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    event_id TEXT;
BEGIN
    INSERT INTO public.webhook_events (
        event_id,
        event_type,
        payment_id,
        order_id,
        raw_data
    ) VALUES (
        p_event_id,
        p_event_type,
        p_payment_id,
        p_order_id,
        p_raw_data
    ) RETURNING id INTO event_id;
    
    RETURN json_build_object(
        'success', true,
        'event_id', event_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create function to mark webhook as processed
CREATE OR REPLACE FUNCTION mark_webhook_processed(
    p_event_id TEXT
)
RETURNS JSON AS $$
BEGIN
    UPDATE public.webhook_events 
    SET processed = true
    WHERE event_id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Webhook event not found'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Webhook marked as processed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION verify_payment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_membership(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_payments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_webhook_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION log_webhook_event(TEXT, TEXT, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION mark_webhook_processed(TEXT) TO authenticated;

-- 17. Success message
SELECT 'Razorpay payment system database schema created successfully!' as message;
