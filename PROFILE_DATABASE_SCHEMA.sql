-- Profile Management Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(15),
    phone_verified BOOLEAN DEFAULT FALSE,
    upi_id VARCHAR(255),
    referral_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_profile UNIQUE(user_id),
    CONSTRAINT valid_phone CHECK (phone ~ '^[0-9]{10}$'),
    CONSTRAINT valid_upi CHECK (upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$' OR upi_id = '')
);

-- 2. Phone Verifications Table
CREATE TABLE IF NOT EXISTS phone_verifications (
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

-- 3. Daily Visits Table
CREATE TABLE IF NOT EXISTS daily_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_daily_visit UNIQUE(user_id, visit_date)
);

-- 4. Referral Transactions Table
CREATE TABLE IF NOT EXISTS referral_transactions (
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

-- 5. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_visits_user_date ON daily_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referee ON referral_transactions(referee_id);

-- 6. Create RLS (Row Level Security) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Phone Verifications Policies
CREATE POLICY "Anyone can insert phone verification" ON phone_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select phone verification" ON phone_verifications
    FOR SELECT USING (true);

-- Daily Visits Policies
CREATE POLICY "Users can view own visits" ON daily_visits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits" ON daily_visits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referral Transactions Policies
CREATE POLICY "Users can view own referral transactions" ON referral_transactions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can insert own referral transactions" ON referral_transactions
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- 7. Create Functions for Common Operations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_transactions_updated_at 
    BEFORE UPDATE ON referral_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_verifications 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ language 'plpgsql';

-- Function to get user profile with referral stats
CREATE OR REPLACE FUNCTION get_user_profile_with_stats(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
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
        up.user_id,
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
    FROM user_profiles up
    LEFT JOIN referral_transactions rt ON up.user_id = rt.referrer_id
    WHERE up.user_id = p_user_id
    GROUP BY up.id, up.user_id, up.name, up.phone, up.phone_verified, up.upi_id, 
             up.referral_earnings, up.total_referrals, up.created_at, up.updated_at;
END;
$$ language 'plpgsql';

-- 8. Create Views for Easy Querying

-- View for user profile summary
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
    up.user_id,
    up.name,
    up.phone,
    up.phone_verified,
    up.upi_id,
    up.referral_earnings,
    up.total_referrals,
    COUNT(dv.id) as total_visits,
    MAX(dv.visit_date) as last_visit_date
FROM user_profiles up
LEFT JOIN daily_visits dv ON up.user_id = dv.user_id
GROUP BY up.user_id, up.name, up.phone, up.phone_verified, up.upi_id, 
         up.referral_earnings, up.total_referrals;

-- 9. Sample Data (Optional - for testing)
-- INSERT INTO user_profiles (user_id, name, phone, phone_verified, referral_earnings, total_referrals)
-- VALUES 
--     ('your-user-id-here', 'John Doe', '9876543210', true, 500.00, 5),
--     ('another-user-id-here', 'Jane Smith', '9876543211', false, 0.00, 0);

-- 10. Grant Permissions (if needed)
-- GRANT ALL ON user_profiles TO authenticated;
-- GRANT ALL ON phone_verifications TO authenticated;
-- GRANT ALL ON daily_visits TO authenticated;
-- GRANT ALL ON referral_transactions TO authenticated;
