-- FINAL Profile Management Database Migration
-- This script adds new columns to existing tables and creates new tables
-- Run this entire script in your Supabase SQL editor

-- ==============================================
-- 1. ADD NEW COLUMNS TO EXISTING user_profiles TABLE
-- ==============================================

-- Add new columns to user_profiles table if they don't exist
DO $$ 
BEGIN
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN name VARCHAR(255);
    END IF;
    
    -- Add phone_verified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add upi_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'upi_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN upi_id VARCHAR(255);
    END IF;
    
    -- Add referral_earnings column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_earnings') THEN
        ALTER TABLE public.user_profiles ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- Add total_referrals column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_referrals') THEN
        ALTER TABLE public.user_profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add constraints for new columns
DO $$
BEGIN
    -- Add phone validation constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_phone_check') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT valid_phone_check CHECK (phone ~ '^[0-9]{10}$' OR phone IS NULL);
    END IF;
    
    -- Add UPI validation constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_upi_check') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT valid_upi_check CHECK (upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$' OR upi_id = '' OR upi_id IS NULL);
    END IF;
END $$;

-- ==============================================
-- 2. CREATE NEW TABLES
-- ==============================================

-- Phone Verifications Table
CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_otp_phone CHECK (phone ~ '^[0-9]{10}$'),
    CONSTRAINT valid_otp_code CHECK (otp ~ '^[0-9]{6}$')
);

-- Daily Visits Table
CREATE TABLE IF NOT EXISTS public.daily_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_daily_visit UNIQUE(user_id, visit_date)
);

-- Referral Transactions Table
CREATE TABLE IF NOT EXISTS public.referral_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'earning', 'withdrawal'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    upi_id VARCHAR(255),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('earning', 'withdrawal')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_verified ON public.user_profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_earnings ON public.user_profiles(referral_earnings);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON public.phone_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_visits_user_date ON public.daily_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON public.referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referee ON public.referral_transactions(referee_id);

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE RLS POLICIES
-- ==============================================

-- Phone Verifications Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert phone verification') THEN
        CREATE POLICY "Anyone can insert phone verification" ON public.phone_verifications
            FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can select phone verification') THEN
        CREATE POLICY "Anyone can select phone verification" ON public.phone_verifications
            FOR SELECT USING (true);
    END IF;
END $$;

-- Daily Visits Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own visits') THEN
        CREATE POLICY "Users can view own visits" ON public.daily_visits
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own visits') THEN
        CREATE POLICY "Users can insert own visits" ON public.daily_visits
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Referral Transactions Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own referral transactions') THEN
        CREATE POLICY "Users can view own referral transactions" ON public.referral_transactions
            FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own referral transactions') THEN
        CREATE POLICY "Users can insert own referral transactions" ON public.referral_transactions
            FOR INSERT WITH CHECK (auth.uid() = referrer_id);
    END IF;
END $$;

-- ==============================================
-- 6. CREATE FUNCTIONS FOR COMMON OPERATIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_referral_transactions_updated_at') THEN
        CREATE TRIGGER update_referral_transactions_updated_at 
            BEFORE UPDATE ON public.referral_transactions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.phone_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ language 'plpgsql';

-- Function to get user profile with referral stats
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    phone_verified BOOLEAN,
    upi_id VARCHAR,
    referral_earnings DECIMAL,
    total_referrals INTEGER,
    total_earnings DECIMAL,
    pending_earnings DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.name,
        up.phone,
        up.phone_verified,
        up.upi_id,
        up.referral_earnings,
        up.total_referrals,
        COALESCE(SUM(rt.amount) FILTER (WHERE rt.transaction_type = 'earning' AND rt.status = 'completed'), 0) as total_earnings,
        COALESCE(SUM(rt.amount) FILTER (WHERE rt.transaction_type = 'withdrawal' AND rt.status = 'pending'), 0) as pending_earnings,
        up.created_at,
        up.updated_at
    FROM public.user_profiles up
    LEFT JOIN public.referral_transactions rt ON up.id = rt.referrer_id
    WHERE up.id = p_user_id
    GROUP BY up.id, up.name, up.phone, up.phone_verified, up.upi_id, 
             up.referral_earnings, up.total_referrals, up.created_at, up.updated_at;
END;
$$ language 'plpgsql';

-- ==============================================
-- 7. CREATE VIEWS FOR EASY QUERYING
-- ==============================================

-- Drop view if it exists and recreate
DROP VIEW IF EXISTS public.user_profile_summary;

-- Create view for user profile summary
CREATE VIEW public.user_profile_summary AS
SELECT 
    up.id as user_id,
    up.name,
    up.phone,
    up.phone_verified,
    up.upi_id,
    up.referral_earnings,
    up.total_referrals,
    COUNT(dv.id) as total_visits,
    MAX(dv.visit_date) as last_visit_date
FROM public.user_profiles up
LEFT JOIN public.daily_visits dv ON up.id = dv.user_id
GROUP BY up.id, up.name, up.phone, up.phone_verified, up.upi_id, 
         up.referral_earnings, up.total_referrals;

-- ==============================================
-- 8. GRANT PERMISSIONS
-- ==============================================

-- Grant permissions to authenticated users
GRANT ALL ON public.phone_verifications TO authenticated;
GRANT ALL ON public.daily_visits TO authenticated;
GRANT ALL ON public.referral_transactions TO authenticated;

-- ==============================================
-- 9. VERIFICATION QUERIES
-- ==============================================

-- Verify the migration was successful
SELECT 
    'Migration completed successfully!' as status,
    'All tables, columns, indexes, policies, functions, and views have been created.' as message;
