-- Create proper referral and membership service infrastructure

-- First update the user_profiles table to support full functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20);

-- Create referral_transactions table for tracking payments
CREATE TABLE IF NOT EXISTS referral_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'commission', -- commission, bonus, penalty
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processed, failed
    description TEXT,
    payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership_transactions table for better tracking
CREATE TABLE IF NOT EXISTS membership_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    membership_id UUID REFERENCES user_memberships(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    commission_paid DECIMAL(10,2) DEFAULT 0,
    referral_code_used VARCHAR(20),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE referral_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_transactions
CREATE POLICY "Users can view their referral transactions" ON referral_transactions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert referral transactions" ON referral_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referral transactions" ON referral_transactions
    FOR UPDATE USING (true);

-- RLS policies for membership_transactions
CREATE POLICY "Users can view their membership transactions" ON membership_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert membership transactions" ON membership_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update membership transactions" ON membership_transactions
    FOR UPDATE USING (true);

-- Improved referral processing function
CREATE OR REPLACE FUNCTION process_membership_purchase(
    user_uuid UUID,
    plan_id_param VARCHAR(20),
    amount_param DECIMAL(10,2),
    payment_id_param VARCHAR(100),
    referral_code_used VARCHAR(20) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_membership_id UUID;
    v_referrer_id UUID;
    v_commission_amount DECIMAL(10,2) := 0;
    v_plan_details RECORD;
    v_result JSONB;
BEGIN
    -- Get plan details
    SELECT * INTO v_plan_details FROM membership_plans WHERE id = plan_id_param;
    
    IF v_plan_details IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid plan');
    END IF;

    -- Create membership
    INSERT INTO user_memberships (
        user_id, plan_id, status, start_date, end_date, payment_id
    ) VALUES (
        user_uuid, 
        plan_id_param, 
        'active', 
        NOW(), 
        NOW() + INTERVAL '1 day' * v_plan_details.duration_days,
        payment_id_param
    ) RETURNING id INTO v_membership_id;

    -- Update user profile
    UPDATE user_profiles 
    SET 
        membership_plan = plan_id_param,
        membership_status = 'active',
        membership_expiry = NOW() + INTERVAL '1 day' * v_plan_details.duration_days,
        updated_at = NOW()
    WHERE id = user_uuid;

    -- Process referral if code provided
    IF referral_code_used IS NOT NULL THEN
        -- Find referrer
        SELECT user_id INTO v_referrer_id 
        FROM referral_codes 
        WHERE code = referral_code_used AND is_active = true;

        IF v_referrer_id IS NOT NULL AND v_referrer_id != user_uuid THEN
            -- Calculate commission (10% of purchase)
            v_commission_amount := amount_param * 0.10;
            
            -- Create referral transaction
            INSERT INTO referral_transactions (
                referrer_id, referee_id, transaction_type, amount, 
                description, payment_id
            ) VALUES (
                v_referrer_id, user_uuid, 'commission', v_commission_amount,
                'Commission from ' || plan_id_param || ' plan purchase', payment_id_param
            );

            -- Update referral code stats
            UPDATE referral_codes 
            SET 
                total_referrals = total_referrals + 1,
                total_earnings = total_earnings + v_commission_amount,
                updated_at = NOW()
            WHERE user_id = v_referrer_id AND is_active = true;
        END IF;
    END IF;

    -- Record membership transaction
    INSERT INTO membership_transactions (
        user_id, membership_id, amount, commission_paid, 
        referral_code_used, transaction_id
    ) VALUES (
        user_uuid, v_membership_id, amount_param, v_commission_amount,
        referral_code_used, payment_id_param
    );

    -- Return success with details
    SELECT json_build_object(
        'success', true,
        'membership_id', v_membership_id,
        'plan_id', plan_id_param,
        'commission_paid', v_commission_amount,
        'expires_at', NOW() + INTERVAL '1 day' * v_plan_details.duration_days
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive referral stats
CREATE OR REPLACE FUNCTION get_referral_dashboard(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT json_build_object(
        'referral_code', COALESCE(rc.code, ''),
        'total_referrals', COALESCE(rc.total_referrals, 0),
        'total_earnings', COALESCE(rc.total_earnings, 0),
        'pending_earnings', COALESCE((
            SELECT SUM(amount) FROM referral_transactions 
            WHERE referrer_id = user_uuid AND status = 'pending'
        ), 0),
        'paid_earnings', COALESCE((
            SELECT SUM(amount) FROM referral_transactions 
            WHERE referrer_id = user_uuid AND status = 'processed'
        ), 0),
        'recent_referrals', COALESCE((
            SELECT json_agg(json_build_object(
                'referee_email', up.email,
                'amount', rt.amount,
                'created_at', rt.created_at,
                'status', rt.status
            )) FROM referral_transactions rt
            JOIN user_profiles up ON rt.referee_id = up.id
            WHERE rt.referrer_id = user_uuid
            ORDER BY rt.created_at DESC
            LIMIT 10
        ), '[]'::json)
    ) INTO v_result
    FROM referral_codes rc
    WHERE rc.user_id = user_uuid AND rc.is_active = true;

    -- If no referral code exists, create one
    IF v_result IS NULL THEN
        INSERT INTO referral_codes (user_id, code) 
        VALUES (user_uuid, generate_referral_code())
        RETURNING json_build_object(
            'referral_code', code,
            'total_referrals', 0,
            'total_earnings', 0,
            'pending_earnings', 0,
            'paid_earnings', 0,
            'recent_referrals', '[]'::json
        ) INTO v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check membership status with proper caching
CREATE OR REPLACE FUNCTION get_user_membership_status(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT json_build_object(
        'has_active_membership', CASE 
            WHEN um.status = 'active' AND um.end_date > NOW() THEN true 
            ELSE false 
        END,
        'current_plan', COALESCE(um.plan_id, 'free'),
        'expires_at', um.end_date,
        'days_remaining', CASE 
            WHEN um.status = 'active' AND um.end_date > NOW() 
            THEN EXTRACT(DAY FROM (um.end_date - NOW()))::INTEGER
            ELSE 0 
        END,
        'tests_available', COALESCE(mp.mock_tests, 0),
        'plan_name', COALESCE(mp.name, 'Free Plan')
    ) INTO v_result
    FROM user_profiles up
    LEFT JOIN user_memberships um ON up.id = um.user_id AND um.status = 'active'
    LEFT JOIN membership_plans mp ON um.plan_id = mp.id
    WHERE up.id = user_uuid;

    RETURN COALESCE(v_result, json_build_object(
        'has_active_membership', false,
        'current_plan', 'free',
        'expires_at', null,
        'days_remaining', 0,
        'tests_available', 0,
        'plan_name', 'Free Plan'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referee ON referral_transactions(referee_id);
CREATE INDEX IF NOT EXISTS idx_membership_transactions_user ON membership_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);

-- Add triggers for updated_at
CREATE TRIGGER update_referral_transactions_updated_at 
    BEFORE UPDATE ON referral_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data for development
UPDATE membership_plans SET 
    mock_tests = 500,
    features = '["500+ PYQ Sets", "100+ Mock Tests", "Detailed Solutions", "Performance Analytics", "45+ Years of Papers (2024-2016)", "Expert Analysis", "Rank Tracking"]'
WHERE id = 'basic';

UPDATE membership_plans SET 
    mock_tests = 1000,
    features = '["1000+ PYQ Sets", "200+ Mock Tests", "Detailed Solutions", "Performance Analytics", "45+ Years of Papers (2024-2016)", "Expert Analysis", "Rank Tracking", "Priority Support", "Study Materials"]'
WHERE id = 'premium';

UPDATE membership_plans SET 
    mock_tests = 2000,
    features = '["2000+ PYQ Sets", "500+ Mock Tests", "Detailed Solutions", "Performance Analytics", "45+ Years of Papers (2024-2016)", "Expert Analysis", "Rank Tracking", "24/7 Support", "Premium Study Materials", "Personal Mentor", "Exam Strategies"]'
WHERE id = 'pro';