-- Comprehensive Referral System Database Schema
-- This script creates a complete referral system with tracking, rewards, and limits

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Update user_profiles table with referral fields
DO $$ BEGIN
    -- Add referral-related columns to user_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_code') THEN
        ALTER TABLE user_profiles ADD COLUMN referral_code VARCHAR(20) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referred_by') THEN
        ALTER TABLE user_profiles ADD COLUMN referred_by UUID REFERENCES user_profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_earnings') THEN
        ALTER TABLE user_profiles ADD COLUMN referral_earnings DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_referrals') THEN
        ALTER TABLE user_profiles ADD COLUMN total_referrals INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'max_referrals') THEN
        ALTER TABLE user_profiles ADD COLUMN max_referrals INTEGER DEFAULT 20;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'referral_commission_rate') THEN
        ALTER TABLE user_profiles ADD COLUMN referral_commission_rate DECIMAL(5,2) DEFAULT 50.00;
    END IF;
END $$;

-- 2. Create referral_tracking table for detailed tracking
CREATE TABLE IF NOT EXISTS referral_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    referral_link TEXT,
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_completed BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    first_purchase_completed BOOLEAN DEFAULT FALSE,
    first_purchase_date TIMESTAMP WITH TIME ZONE,
    first_purchase_amount DECIMAL(10,2),
    milestone_achieved BOOLEAN DEFAULT FALSE,
    milestone_date TIMESTAMP WITH TIME ZONE,
    milestone_type VARCHAR(50),
    reward_credited BOOLEAN DEFAULT FALSE,
    reward_amount DECIMAL(10,2),
    reward_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rewarded', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create referral_rewards table for reward transactions
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('verification', 'purchase', 'milestone')),
    reward_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    base_amount DECIMAL(10,2),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed', 'cancelled')),
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create referral_links table for trackable links
CREATE TABLE IF NOT EXISTS referral_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    custom_link TEXT,
    click_count INTEGER DEFAULT 0,
    signup_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create referral_events table for logging all referral activities
CREATE TABLE IF NOT EXISTS referral_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    referrer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    referred_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    tracking_id UUID REFERENCES referral_tracking(id) ON DELETE SET NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code ON referral_tracking(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_user ON referral_links(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_events_type ON referral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id);

-- 7. Enable Row Level Security
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Referral tracking policies
DROP POLICY IF EXISTS "Users can view own referral tracking" ON referral_tracking;
CREATE POLICY "Users can view own referral tracking" ON referral_tracking
    FOR SELECT USING (
        referrer_id = auth.uid() OR referred_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can insert own referral tracking" ON referral_tracking;
CREATE POLICY "Users can insert own referral tracking" ON referral_tracking
    FOR INSERT WITH CHECK (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Referral rewards policies
DROP POLICY IF EXISTS "Users can view own referral rewards" ON referral_rewards;
CREATE POLICY "Users can view own referral rewards" ON referral_rewards
    FOR SELECT USING (
        referrer_id = auth.uid() OR referred_id = auth.uid()
    );

-- Referral links policies
DROP POLICY IF EXISTS "Users can manage own referral links" ON referral_links;
CREATE POLICY "Users can manage own referral links" ON referral_links
    FOR ALL USING (user_id = auth.uid());

-- Referral events policies (read-only for users)
DROP POLICY IF EXISTS "Users can view own referral events" ON referral_events;
CREATE POLICY "Users can view own referral events" ON referral_events
    FOR SELECT USING (
        referrer_id = auth.uid() OR referred_id = auth.uid()
    );

-- 9. Create functions for referral system

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate code: first 3 chars of user_id + random 4 digits
        code := UPPER(SUBSTRING(user_id::text, 1, 3)) || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = code) THEN
            RETURN code;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral tracking
CREATE OR REPLACE FUNCTION create_referral_tracking(
    referrer_user_id UUID,
    referred_user_id UUID,
    referral_code_input VARCHAR(20)
)
RETURNS JSON AS $$
DECLARE
    tracking_id UUID;
    referrer_code VARCHAR(20);
    result JSON;
BEGIN
    -- Validate referral code
    SELECT referral_code INTO referrer_code 
    FROM user_profiles 
    WHERE id = referrer_user_id AND referral_code = referral_code_input;
    
    IF referrer_code IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid referral code');
    END IF;
    
    -- Check if user is trying to refer themselves
    IF referrer_user_id = referred_user_id THEN
        RETURN json_build_object('success', false, 'message', 'Cannot refer yourself');
    END IF;
    
    -- Check if user already has a referrer
    IF EXISTS (SELECT 1 FROM user_profiles WHERE id = referred_user_id AND referred_by IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'message', 'User already has a referrer');
    END IF;
    
    -- Check referrer's limit
    IF EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = referrer_user_id 
        AND total_referrals >= max_referrals
    ) THEN
        RETURN json_build_object('success', false, 'message', 'Referrer has reached maximum referrals');
    END IF;
    
    -- Create tracking record
    INSERT INTO referral_tracking (
        referrer_id, referred_id, referral_code, referral_link
    ) VALUES (
        referrer_user_id, referred_user_id, referral_code_input,
        'https://yourapp.com/signup?ref=' || referral_code_input
    ) RETURNING id INTO tracking_id;
    
    -- Update referred user's profile
    UPDATE user_profiles 
    SET referred_by = referrer_user_id,
        updated_at = NOW()
    WHERE id = referred_user_id;
    
    -- Update referrer's total count
    UPDATE user_profiles 
    SET total_referrals = total_referrals + 1,
        updated_at = NOW()
    WHERE id = referrer_user_id;
    
    -- Log event
    INSERT INTO referral_events (event_type, referrer_id, referred_id, tracking_id, event_data)
    VALUES ('referral_signup', referrer_user_id, referred_user_id, tracking_id, 
            json_build_object('referral_code', referral_code_input));
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Referral tracking created successfully',
        'tracking_id', tracking_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_reward(
    tracking_id_input UUID,
    reward_type_input VARCHAR(20),
    base_amount_input DECIMAL(10,2) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    tracking_record RECORD;
    reward_amount DECIMAL(10,2);
    commission_rate DECIMAL(5,2);
    reward_id UUID;
    result JSON;
BEGIN
    -- Get tracking record
    SELECT * INTO tracking_record 
    FROM referral_tracking 
    WHERE id = tracking_id_input;
    
    IF tracking_record IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Tracking record not found');
    END IF;
    
    -- Check if reward already processed
    IF tracking_record.reward_credited THEN
        RETURN json_build_object('success', false, 'message', 'Reward already credited');
    END IF;
    
    -- Get commission rate
    SELECT referral_commission_rate INTO commission_rate
    FROM user_profiles 
    WHERE id = tracking_record.referrer_id;
    
    -- Calculate reward amount
    IF reward_type_input = 'verification' THEN
        reward_amount := 10.00; -- Fixed amount for verification
    ELSIF reward_type_input = 'purchase' THEN
        reward_amount := (base_amount_input * commission_rate / 100);
    ELSIF reward_type_input = 'milestone' THEN
        reward_amount := 25.00; -- Fixed amount for milestone
    ELSE
        RETURN json_build_object('success', false, 'message', 'Invalid reward type');
    END IF;
    
    -- Create reward record
    INSERT INTO referral_rewards (
        referrer_id, referred_id, tracking_id, reward_type, 
        reward_amount, commission_rate, base_amount, status
    ) VALUES (
        tracking_record.referrer_id, tracking_record.referred_id, tracking_id_input,
        reward_type_input, reward_amount, commission_rate, base_amount_input, 'pending'
    ) RETURNING id INTO reward_id;
    
    -- Update referrer's earnings
    UPDATE user_profiles 
    SET referral_earnings = referral_earnings + reward_amount,
        updated_at = NOW()
    WHERE id = tracking_record.referrer_id;
    
    -- Update tracking record
    UPDATE referral_tracking 
    SET reward_credited = TRUE,
        reward_amount = reward_amount,
        reward_date = NOW(),
        status = 'rewarded',
        updated_at = NOW()
    WHERE id = tracking_id_input;
    
    -- Update reward status
    UPDATE referral_rewards 
    SET status = 'credited',
        credited_at = NOW()
    WHERE id = reward_id;
    
    -- Log event
    INSERT INTO referral_events (event_type, referrer_id, referred_id, tracking_id, event_data)
    VALUES ('reward_credited', tracking_record.referrer_id, tracking_record.referred_id, 
            tracking_id_input, json_build_object('reward_type', reward_type_input, 'amount', reward_amount));
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Reward processed successfully',
        'reward_amount', reward_amount,
        'reward_id', reward_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get referral statistics
CREATE OR REPLACE FUNCTION get_referral_stats(user_id_input UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_referrals', COALESCE(up.total_referrals, 0),
        'total_earnings', COALESCE(up.referral_earnings, 0),
        'referral_code', COALESCE(up.referral_code, ''),
        'max_referrals', COALESCE(up.max_referrals, 20),
        'commission_rate', COALESCE(up.referral_commission_rate, 50.00),
        'pending_rewards', COALESCE((
            SELECT COUNT(*) FROM referral_tracking 
            WHERE referrer_id = user_id_input AND status = 'pending'
        ), 0),
        'verified_referrals', COALESCE((
            SELECT COUNT(*) FROM referral_tracking 
            WHERE referrer_id = user_id_input AND verification_completed = TRUE
        ), 0),
        'rewarded_referrals', COALESCE((
            SELECT COUNT(*) FROM referral_tracking 
            WHERE referrer_id = user_id_input AND reward_credited = TRUE
        ), 0)
    ) INTO stats
    FROM user_profiles up
    WHERE up.id = user_id_input;
    
    RETURN COALESCE(stats, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to validate referral code
CREATE OR REPLACE FUNCTION validate_referral_code(code_input VARCHAR(20))
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Check if code exists and get user info
    SELECT id, referral_code, total_referrals, max_referrals
    INTO user_record
    FROM user_profiles 
    WHERE referral_code = UPPER(code_input);
    
    IF user_record IS NULL THEN
        RETURN json_build_object('valid', false, 'message', 'Invalid referral code');
    END IF;
    
    -- Check if referrer has reached limit
    IF user_record.total_referrals >= user_record.max_referrals THEN
        RETURN json_build_object('valid', false, 'message', 'Referrer has reached maximum referrals');
    END IF;
    
    RETURN json_build_object(
        'valid', true, 
        'message', 'Valid referral code',
        'referrer_id', user_record.id
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_tracking_updated_at 
    BEFORE UPDATE ON referral_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_links_updated_at 
    BEFORE UPDATE ON referral_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 12. Create views for easy querying
CREATE OR REPLACE VIEW referral_summary AS
SELECT 
    rt.id as tracking_id,
    rt.referrer_id,
    rt.referred_id,
    rt.referral_code,
    rt.status,
    rt.signup_date,
    rt.verification_completed,
    rt.first_purchase_completed,
    rt.reward_credited,
    rt.reward_amount,
    up_referrer.email as referrer_email,
    up_referred.email as referred_email,
    up_referrer.referral_earnings as total_earnings
FROM referral_tracking rt
LEFT JOIN user_profiles up_referrer ON rt.referrer_id = up_referrer.id
LEFT JOIN user_profiles up_referred ON rt.referred_id = up_referred.id;

-- Grant access to views
GRANT SELECT ON referral_summary TO anon, authenticated;

COMMENT ON TABLE referral_tracking IS 'Tracks all referral relationships and their status';
COMMENT ON TABLE referral_rewards IS 'Records all referral reward transactions';
COMMENT ON TABLE referral_links IS 'Manages trackable referral links';
COMMENT ON TABLE referral_events IS 'Logs all referral-related events for analytics';

-- Success message
DO $$ BEGIN
    RAISE NOTICE 'Comprehensive referral system created successfully!';
    RAISE NOTICE 'Tables created: referral_tracking, referral_rewards, referral_links, referral_events';
    RAISE NOTICE 'Functions created: generate_referral_code, create_referral_tracking, process_referral_reward, get_referral_stats, validate_referral_code';
    RAISE NOTICE 'Views created: referral_summary';
END $$;
