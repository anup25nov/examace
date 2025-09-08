-- Referral System Database Schema
-- Run this in your Supabase SQL editor after the membership schema

-- 1. Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    purchase_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage INTEGER NOT NULL DEFAULT 50,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
    purchase_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create referral_payouts table
CREATE TABLE IF NOT EXISTS referral_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    payment_method VARCHAR(50), -- bank_transfer, upi, wallet
    payment_details JSONB, -- bank account, UPI ID, etc.
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status);

-- 5. Enable RLS on new tables
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- Referral codes policies
CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view referrals they made" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals made to them" ON referrals
    FOR SELECT USING (auth.uid() = referee_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON referrals
    FOR UPDATE WITH CHECK (true);

-- Referral payouts policies
CREATE POLICY "Users can view their own payouts" ON referral_payouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payout requests" ON referral_payouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payouts" ON referral_payouts
    FOR UPDATE WITH CHECK (true);

-- 7. Create functions for referral management

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: EXAM + 6 random characters
        new_code := 'EXAM' || upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(user_uuid UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    new_code VARCHAR(20);
    existing_code VARCHAR(20);
BEGIN
    -- Check if user already has an active referral code
    SELECT code INTO existing_code
    FROM referral_codes
    WHERE user_id = user_uuid AND is_active = true
    LIMIT 1;
    
    -- If user already has a code, return it
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;
    
    -- Generate new code
    new_code := generate_referral_code();
    
    -- Insert new referral code
    INSERT INTO referral_codes (user_id, code, is_active)
    VALUES (user_uuid, new_code, true);
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral
CREATE OR REPLACE FUNCTION process_referral(
    referee_uuid UUID,
    referral_code_param VARCHAR(20),
    purchase_amount_param DECIMAL(10,2),
    purchase_id_param VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    referrer_uuid UUID;
    commission_amount DECIMAL(10,2);
    commission_percentage INTEGER := 50;
    existing_referral UUID;
BEGIN
    -- Find referrer by code
    SELECT user_id INTO referrer_uuid
    FROM referral_codes
    WHERE code = referral_code_param AND is_active = true;
    
    -- If referrer not found, return false
    IF referrer_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user is trying to refer themselves
    IF referrer_uuid = referee_uuid THEN
        RETURN FALSE;
    END IF;
    
    -- Check if this referee has already been referred by this referrer
    SELECT id INTO existing_referral
    FROM referrals
    WHERE referrer_id = referrer_uuid AND referee_id = referee_uuid;
    
    -- If already referred, return false
    IF existing_referral IS NOT NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate commission
    commission_amount := (purchase_amount_param * commission_percentage) / 100;
    
    -- Create referral record
    INSERT INTO referrals (
        referrer_id,
        referee_id,
        referral_code,
        purchase_amount,
        commission_amount,
        commission_percentage,
        status,
        purchase_id
    ) VALUES (
        referrer_uuid,
        referee_uuid,
        referral_code_param,
        purchase_amount_param,
        commission_amount,
        commission_percentage,
        'pending',
        purchase_id_param
    );
    
    -- Update referral code stats
    UPDATE referral_codes
    SET 
        total_referrals = total_referrals + 1,
        total_earnings = total_earnings + commission_amount,
        updated_at = NOW()
    WHERE id = (
        SELECT id FROM referral_codes 
        WHERE code = referral_code_param AND is_active = true
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user referral stats
CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
    total_referrals INTEGER,
    total_earnings DECIMAL(10,2),
    pending_earnings DECIMAL(10,2),
    paid_earnings DECIMAL(10,2),
    referral_code VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(rc.total_referrals, 0)::INTEGER,
        COALESCE(rc.total_earnings, 0),
        COALESCE(SUM(CASE WHEN r.status = 'pending' THEN r.commission_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN r.status = 'paid' THEN r.commission_amount ELSE 0 END), 0),
        COALESCE(rc.code, '')
    FROM referral_codes rc
    LEFT JOIN referrals r ON rc.user_id = r.referrer_id
    WHERE rc.user_id = user_uuid AND rc.is_active = true
    GROUP BY rc.id, rc.total_referrals, rc.total_earnings, rc.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR(255),
    total_referrals INTEGER,
    total_earnings DECIMAL(10,2),
    rank_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.user_id,
        up.email,
        rc.total_referrals,
        rc.total_earnings,
        ROW_NUMBER() OVER (ORDER BY rc.total_earnings DESC)::INTEGER as rank_position
    FROM referral_codes rc
    JOIN user_profiles up ON rc.user_id = up.id
    WHERE rc.is_active = true
    ORDER BY rc.total_earnings DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request payout
CREATE OR REPLACE FUNCTION request_referral_payout(
    user_uuid UUID,
    amount_param DECIMAL(10,2),
    payment_method_param VARCHAR(50),
    payment_details_param JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    pending_earnings DECIMAL(10,2);
    min_payout DECIMAL(10,2) := 100.00;
BEGIN
    -- Get user's pending earnings
    SELECT COALESCE(SUM(commission_amount), 0) INTO pending_earnings
    FROM referrals
    WHERE referrer_id = user_uuid AND status = 'pending';
    
    -- Check if user has enough pending earnings
    IF pending_earnings < amount_param THEN
        RETURN FALSE;
    END IF;
    
    -- Check minimum payout amount
    IF amount_param < min_payout THEN
        RETURN FALSE;
    END IF;
    
    -- Create payout request
    INSERT INTO referral_payouts (
        user_id,
        amount,
        status,
        payment_method,
        payment_details
    ) VALUES (
        user_uuid,
        amount_param,
        'pending',
        payment_method_param,
        payment_details_param
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create triggers for automatic updates

-- Apply updated_at triggers
CREATE TRIGGER update_referral_codes_updated_at 
    BEFORE UPDATE ON referral_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_payouts_updated_at 
    BEFORE UPDATE ON referral_payouts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON referral_codes TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON referral_payouts TO authenticated;

-- 10. Create views for easy querying

-- View for user referral summary
CREATE OR REPLACE VIEW user_referral_summary AS
SELECT 
    up.id as user_id,
    up.email,
    rc.code as referral_code,
    rc.total_referrals,
    rc.total_earnings,
    COALESCE(SUM(CASE WHEN r.status = 'pending' THEN r.commission_amount ELSE 0 END), 0) as pending_earnings,
    COALESCE(SUM(CASE WHEN r.status = 'paid' THEN r.commission_amount ELSE 0 END), 0) as paid_earnings,
    rc.created_at as code_created_at
FROM user_profiles up
LEFT JOIN referral_codes rc ON up.id = rc.user_id AND rc.is_active = true
LEFT JOIN referrals r ON rc.user_id = r.referrer_id
WHERE up.id = auth.uid()
GROUP BY up.id, up.email, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;

-- Grant access to the view
GRANT SELECT ON user_referral_summary TO authenticated;

-- 11. Sample queries for testing

-- Create referral code for user
-- SELECT create_user_referral_code(auth.uid());

-- Process a referral
-- SELECT process_referral('referee-user-id', 'EXAM123', 30.00, 'payment-id-123');

-- Get user referral stats
-- SELECT * FROM get_user_referral_stats(auth.uid());

-- Get referral leaderboard
-- SELECT * FROM get_referral_leaderboard(10);

-- Request payout
-- SELECT request_referral_payout(auth.uid(), 150.00, 'upi', '{"upi_id": "user@paytm"}');

-- Get user referral summary
-- SELECT * FROM user_referral_summary;
