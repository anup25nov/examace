-- Create payment_failures table for tracking payment failures and retries
CREATE TABLE IF NOT EXISTS public.payment_failures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    order_id TEXT NOT NULL,
    failure_reason TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_retry_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'failed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_payment_failures_user_id ON public.payment_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_status ON public.payment_failures(status);
CREATE INDEX IF NOT EXISTS idx_payment_failures_created_at ON public.payment_failures(created_at);

-- Enable RLS
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payment failures" ON public.payment_failures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment failures" ON public.payment_failures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Grant permissions
GRANT ALL ON public.payment_failures TO authenticated;
GRANT ALL ON public.payment_failures TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_failures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_payment_failures_updated_at
    BEFORE UPDATE ON public.payment_failures
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_failures_updated_at();
