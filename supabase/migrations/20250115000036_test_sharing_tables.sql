-- Create test_shares table for managing test sharing
CREATE TABLE IF NOT EXISTS public.test_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    test_type TEXT NOT NULL,
    test_name TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    share_code TEXT UNIQUE NOT NULL,
    share_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_share_access table for tracking access
CREATE TABLE IF NOT EXISTS public.test_share_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    share_code TEXT NOT NULL,
    user_id UUID,
    ip_address TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_test_shares_share_code ON public.test_shares(share_code);
CREATE INDEX IF NOT EXISTS idx_test_shares_created_by ON public.test_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_test_shares_is_active ON public.test_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_test_shares_expires_at ON public.test_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_test_share_access_share_code ON public.test_share_access(share_code);
CREATE INDEX IF NOT EXISTS idx_test_share_access_user_id ON public.test_share_access(user_id);
CREATE INDEX IF NOT EXISTS idx_test_share_access_accessed_at ON public.test_share_access(accessed_at);

-- Enable RLS
ALTER TABLE public.test_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_share_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for test_shares
CREATE POLICY "Users can view their own test shares" ON public.test_shares
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create test shares" ON public.test_shares
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own test shares" ON public.test_shares
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view active test shares by code" ON public.test_shares
    FOR SELECT USING (is_active = TRUE AND expires_at > NOW());

-- Create RLS policies for test_share_access
CREATE POLICY "Users can view their own test share access" ON public.test_share_access
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert test share access" ON public.test_share_access
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.test_shares TO authenticated;
GRANT ALL ON public.test_shares TO anon;
GRANT ALL ON public.test_share_access TO authenticated;
GRANT ALL ON public.test_share_access TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_test_shares_updated_at
    BEFORE UPDATE ON public.test_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_test_shares_updated_at();

-- Create function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_test_shares()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE public.test_shares 
    SET is_active = FALSE 
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get share statistics
CREATE OR REPLACE FUNCTION get_test_share_statistics(user_uuid UUID)
RETURNS TABLE (
    total_shares BIGINT,
    active_shares BIGINT,
    total_views BIGINT,
    popular_tests JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ts.*) as total_shares,
        COUNT(ts.*) FILTER (WHERE ts.is_active = TRUE AND ts.expires_at > NOW()) as active_shares,
        COALESCE(COUNT(tsa.*), 0) as total_views,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'test_name', ts.test_name,
                    'share_count', COUNT(ts.*)
                ) ORDER BY COUNT(ts.*) DESC
            ) FILTER (WHERE ts.test_name IS NOT NULL),
            '[]'::jsonb
        ) as popular_tests
    FROM public.test_shares ts
    LEFT JOIN public.test_share_access tsa ON ts.share_code = tsa.share_code
    WHERE ts.created_by = user_uuid
    GROUP BY ts.created_by;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION cleanup_expired_test_shares() TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_share_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_share_statistics(UUID) TO anon;
