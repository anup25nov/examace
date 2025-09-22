-- Fix All Database Issues
-- Run this in Supabase SQL Editor

-- 1. Fix exam_stats check constraint
ALTER TABLE exam_stats DROP CONSTRAINT IF EXISTS check_exam_id_valid;

-- 2. Create missing referral_commissions table
CREATE TABLE IF NOT EXISTS referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES user_profiles(id),
    referred_id UUID NOT NULL REFERENCES user_profiles(id),
    commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create missing referral_transactions table
CREATE TABLE IF NOT EXISTS referral_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES user_profiles(id),
    referred_id UUID NOT NULL REFERENCES user_profiles(id),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_id ON referral_commissions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_id ON referral_transactions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);

-- 5. Grant permissions
GRANT ALL ON referral_commissions TO authenticated;
GRANT ALL ON referral_transactions TO authenticated;

-- 6. Drop existing functions first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_user_referral_earnings(UUID);
DROP FUNCTION IF EXISTS get_user_referral_earnings(uuid);
DROP FUNCTION IF EXISTS get_comprehensive_referral_stats(UUID);
DROP FUNCTION IF EXISTS get_comprehensive_referral_stats(uuid);
DROP FUNCTION IF EXISTS get_user_messages(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_messages(uuid, integer);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID);
DROP FUNCTION IF EXISTS get_unread_message_count(uuid);
DROP FUNCTION IF EXISTS mark_message_as_read(UUID, UUID);
DROP FUNCTION IF EXISTS mark_message_as_read(uuid, uuid);

-- 7. Create missing functions
CREATE OR REPLACE FUNCTION get_user_referral_earnings(user_uuid UUID)
RETURNS TABLE(
    total_earnings DECIMAL,
    pending_earnings DECIMAL,
    paid_earnings DECIMAL,
    total_referrals INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(rc.commission_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'pending' THEN rc.commission_amount ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'paid' THEN rc.commission_amount ELSE 0 END), 0) as paid_earnings,
        COUNT(DISTINCT rc.referred_id)::INTEGER as total_referrals
    FROM referral_commissions rc
    WHERE rc.referrer_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_comprehensive_referral_stats(user_uuid UUID)
RETURNS TABLE(
    total_referrals INTEGER,
    active_referrals INTEGER,
    total_earnings DECIMAL,
    pending_earnings DECIMAL,
    paid_earnings DECIMAL,
    referral_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT rc.referred_id)::INTEGER as total_referrals,
        COUNT(DISTINCT CASE WHEN rc.status = 'pending' OR rc.status = 'paid' THEN rc.referred_id END)::INTEGER as active_referrals,
        COALESCE(SUM(rc.commission_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'pending' THEN rc.commission_amount ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN rc.status = 'paid' THEN rc.commission_amount ELSE 0 END), 0) as paid_earnings,
        (SELECT referral_code FROM user_profiles WHERE id = user_uuid) as referral_code
    FROM referral_commissions rc
    WHERE rc.referrer_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create user_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    message_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create message functions
CREATE OR REPLACE FUNCTION get_user_messages(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    message_type VARCHAR(50),
    title TEXT,
    message TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        um.message_type,
        um.title,
        um.message,
        um.is_read,
        um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO unread_count
    FROM user_messages
    WHERE user_id = user_uuid AND is_read = FALSE;
    
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_messages
    SET is_read = TRUE
    WHERE id = message_id AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant function permissions
GRANT EXECUTE ON FUNCTION get_user_referral_earnings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comprehensive_referral_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read(UUID, UUID) TO authenticated;

-- 11. Grant table permissions
GRANT ALL ON user_messages TO authenticated;
