-- Fix Dashboard API Issues
-- This migration fixes the RPC functions causing 400 errors

-- 1. Fix get_user_messages function - the table has 'content' column, not 'message'
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
        COALESCE(um.message_type, 'info') as message_type,
        um.title,
        um.content as message,  -- Use 'content' column instead of 'message'
        um.is_read,
        um.created_at
    FROM user_messages um
    WHERE um.user_id = user_uuid
    ORDER BY um.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_comprehensive_referral_stats function - fix ambiguous referral_code column
CREATE OR REPLACE FUNCTION get_comprehensive_referral_stats(user_uuid UUID)
RETURNS TABLE(
    referral_code VARCHAR(20),
    total_referrals INTEGER,
    total_commissions_earned DECIMAL(10,2),
    paid_commissions DECIMAL(10,2),
    pending_commissions DECIMAL(10,2),
    cancelled_commissions DECIMAL(10,2),
    active_referrals INTEGER,
    completed_referrals INTEGER,
    pending_referrals INTEGER,
    referral_link TEXT,
    code_created_at TIMESTAMP WITH TIME ZONE,
    last_referral_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rc.code as referral_code,  -- Explicitly reference rc.code
        COALESCE(rc.total_referrals, 0)::INTEGER as total_referrals,
        COALESCE(rc.total_earnings, 0.00) as total_commissions_earned,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'paid' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as paid_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'pending' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as pending_commissions,
        COALESCE(SUM(CASE WHEN rc_comm.status = 'refunded' THEN rc_comm.commission_amount ELSE 0 END), 0.00) as cancelled_commissions,
        COUNT(CASE WHEN rt.status = 'pending' THEN 1 END)::INTEGER as active_referrals,
        COUNT(CASE WHEN rt.status = 'completed' THEN 1 END)::INTEGER as completed_referrals,
        COUNT(CASE WHEN rt.status = 'pending' AND rt.membership_purchased = false THEN 1 END)::INTEGER as pending_referrals,
        CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
        rc.created_at as code_created_at,
        MAX(rt.created_at) as last_referral_date
    FROM referral_codes rc
    LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
    LEFT JOIN referral_commissions rc_comm ON rt.referred_id = rc_comm.referred_id
    WHERE rc.user_id = user_uuid
    GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add message_type column to user_messages table if it doesn't exist
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'info';

-- 4. Update existing records to have message_type
UPDATE user_messages 
SET message_type = 'info' 
WHERE message_type IS NULL;

-- 5. Create a comprehensive user data function to reduce API calls
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID)
RETURNS TABLE(
    profile JSONB,
    membership JSONB,
    referral_stats JSONB
) AS $$
DECLARE
    profile_data JSONB;
    membership_data JSONB;
    referral_stats_data JSONB;
BEGIN
    -- Get user profile
    SELECT to_jsonb(up.*) INTO profile_data
    FROM user_profiles up
    WHERE up.id = user_uuid;
    
    -- Get active membership
    SELECT to_jsonb(um.*) INTO membership_data
    FROM user_memberships um
    WHERE um.user_id = user_uuid 
    AND um.status = 'active' 
    AND um.end_date > NOW()
    ORDER BY um.created_at DESC
    LIMIT 1;
    
    -- Get referral stats
    SELECT to_jsonb(rs.*) INTO referral_stats_data
    FROM (
        SELECT 
            rc.code as referral_code,
            COALESCE(rc.total_referrals, 0) as total_referrals,
            COALESCE(rc.total_earnings, 0.00) as total_earnings,
            COUNT(rt.id) as active_referrals
        FROM referral_codes rc
        LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
        WHERE rc.user_id = user_uuid
        GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings
    ) rs;
    
    RETURN QUERY SELECT profile_data, membership_data, referral_stats_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
