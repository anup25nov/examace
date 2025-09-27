-- Create refund_requests table for managing refunds
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    payment_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('user_requested', 'payment_failed', 'duplicate_payment', 'service_unavailable', 'fraud_detected')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    refund_id TEXT,
    admin_notes TEXT,
    created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'admin', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON public.refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_requested_at ON public.refund_requests(requested_at);

-- Enable RLS
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own refund requests" ON public.refund_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refund requests" ON public.refund_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all refund requests" ON public.refund_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can update refund requests" ON public.refund_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Grant permissions
GRANT ALL ON public.refund_requests TO authenticated;
GRANT ALL ON public.refund_requests TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_requests_updated_at();

-- Create function to get refund statistics
CREATE OR REPLACE FUNCTION get_refund_statistics()
RETURNS TABLE (
    total_refunds BIGINT,
    pending_refunds BIGINT,
    completed_refunds BIGINT,
    failed_refunds BIGINT,
    total_refund_amount DECIMAL,
    average_refund_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_refunds,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_refunds,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_refunds,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_refunds,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_refund_amount,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_refund_amount
    FROM public.refund_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_refund_statistics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_refund_statistics() TO anon;
