-- Membership System Database Schema
-- Run this in your Supabase SQL editor

-- 1. Update user_profiles table to include membership and phone fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS membership_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS membership_status VARCHAR(20) DEFAULT 'inactive';

-- 2. Create user_memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, cancelled
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
    payment_method VARCHAR(50) NOT NULL, -- upi, card, qr
    razorpay_payment_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create membership_plans table (reference data)
CREATE TABLE IF NOT EXISTS membership_plans (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    mock_tests INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default membership plans
INSERT INTO membership_plans (id, name, description, price, original_price, mock_tests, duration_days, features) VALUES
('basic', 'Basic Plan', 'Perfect for getting started', 30.00, 50.00, 10, 30, '["10 Mock Tests", "Detailed Solutions", "Performance Analytics", "30 Days Access", "Email Support"]'),
('premium', 'Premium Plan', 'Most popular choice', 49.00, 99.00, 25, 60, '["25 Mock Tests", "Detailed Solutions", "Performance Analytics", "60 Days Access", "Priority Support", "Study Materials", "Progress Tracking"]'),
('pro', 'Pro Plan', 'Maximum value for serious learners', 99.00, 199.00, 50, 90, '["50 Mock Tests", "Detailed Solutions", "Performance Analytics", "90 Days Access", "24/7 Support", "Study Materials", "Progress Tracking", "Personalized Recommendations", "Exam Strategies"]')
ON CONFLICT (id) DO NOTHING;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date ON user_memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_plan ON user_profiles(membership_plan);

-- 7. Create RLS policies for security

-- Enable RLS on new tables
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

-- User memberships policies
CREATE POLICY "Users can view their own memberships" ON user_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships" ON user_memberships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" ON user_memberships
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Membership plans policies (read-only for users)
CREATE POLICY "Anyone can view active membership plans" ON membership_plans
    FOR SELECT USING (is_active = true);

-- 8. Create functions for membership management

-- Function to check if user has active membership
CREATE OR REPLACE FUNCTION has_active_membership(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_memberships 
        WHERE user_id = user_uuid 
        AND status = 'active' 
        AND end_date > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current membership
CREATE OR REPLACE FUNCTION get_user_membership(user_uuid UUID)
RETURNS TABLE (
    membership_id UUID,
    plan_id VARCHAR(20),
    status VARCHAR(20),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        um.plan_id,
        um.status,
        um.start_date,
        um.end_date,
        GREATEST(0, EXTRACT(DAY FROM (um.end_date - NOW()))::INTEGER) as days_remaining
    FROM user_memberships um
    WHERE um.user_id = user_uuid 
    AND um.status = 'active'
    AND um.end_date > NOW()
    ORDER BY um.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to mock tests
CREATE OR REPLACE FUNCTION has_mock_test_access(user_uuid UUID, required_tests INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan_id VARCHAR(20);
    plan_mock_tests INTEGER;
BEGIN
    -- Get user's current plan
    SELECT um.plan_id INTO user_plan_id
    FROM user_memberships um
    WHERE um.user_id = user_uuid 
    AND um.status = 'active'
    AND um.end_date > NOW()
    ORDER BY um.created_at DESC
    LIMIT 1;
    
    -- If no active membership, return false
    IF user_plan_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get plan details
    SELECT mp.mock_tests INTO plan_mock_tests
    FROM membership_plans mp
    WHERE mp.id = user_plan_id;
    
    -- Check if user has access to required tests
    RETURN plan_mock_tests >= required_tests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old memberships
CREATE OR REPLACE FUNCTION expire_old_memberships()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_memberships 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'active' 
    AND end_date <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Update user profiles for expired memberships
    UPDATE user_profiles 
    SET membership_status = 'expired', updated_at = NOW()
    WHERE id IN (
        SELECT user_id FROM user_memberships 
        WHERE status = 'expired' 
        AND updated_at > NOW() - INTERVAL '1 minute'
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create triggers for automatic updates

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_user_memberships_updated_at 
    BEFORE UPDATE ON user_memberships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_plans_updated_at 
    BEFORE UPDATE ON membership_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create a scheduled job to expire memberships (if using pg_cron)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('expire-memberships', '0 0 * * *', 'SELECT expire_old_memberships();');

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT SELECT ON membership_plans TO authenticated;

-- 12. Create a view for user membership summary
CREATE OR REPLACE VIEW user_membership_summary AS
SELECT 
    up.id as user_id,
    up.email,
    up.phone,
    up.membership_plan,
    up.membership_status,
    up.membership_expiry,
    um.id as membership_id,
    um.plan_id,
    um.status as membership_status_detail,
    um.start_date,
    um.end_date,
    mp.name as plan_name,
    mp.price as plan_price,
    mp.mock_tests,
    mp.duration_days,
    GREATEST(0, EXTRACT(DAY FROM (um.end_date - NOW()))::INTEGER) as days_remaining,
    CASE 
        WHEN um.status = 'active' AND um.end_date > NOW() THEN true
        ELSE false
    END as is_active
FROM user_profiles up
LEFT JOIN user_memberships um ON up.id = um.user_id AND um.status = 'active'
LEFT JOIN membership_plans mp ON um.plan_id = mp.id
WHERE up.id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_membership_summary TO authenticated;

-- 13. Sample queries for testing

-- Check if user has active membership
-- SELECT has_active_membership(auth.uid());

-- Get user's current membership details
-- SELECT * FROM get_user_membership(auth.uid());

-- Check if user has access to 25 mock tests
-- SELECT has_mock_test_access(auth.uid(), 25);

-- Get user's membership summary
-- SELECT * FROM user_membership_summary;

-- Get all active memberships
-- SELECT * FROM user_memberships WHERE status = 'active' AND end_date > NOW();

-- Get payment history for a user
-- SELECT * FROM payments WHERE user_id = auth.uid() ORDER BY created_at DESC;
