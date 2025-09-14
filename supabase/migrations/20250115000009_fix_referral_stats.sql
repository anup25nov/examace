-- Fix referral stats function issues

-- Drop and recreate the function with correct data types and URL
DROP FUNCTION IF EXISTS get_user_referral_stats(UUID);

CREATE OR REPLACE FUNCTION get_user_referral_stats(user_uuid UUID)
RETURNS TABLE (
  referral_code VARCHAR(20),
  total_referrals INTEGER,
  total_earnings DECIMAL(10,2),
  pending_earnings DECIMAL(10,2),
  paid_earnings DECIMAL(10,2),
  referral_link TEXT,
  code_created_at TIMESTAMP WITH TIME ZONE,
  last_referral_date TIMESTAMP WITH TIME ZONE,
  active_referrals BIGINT,
  completed_referrals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.code as referral_code,
    COALESCE(rc.total_referrals, 0) as total_referrals,
    COALESCE(rc.total_earnings, 0) as total_earnings,
    COALESCE(rc.total_earnings - COALESCE(SUM(rp.amount), 0), 0) as pending_earnings,
    COALESCE(SUM(rp.amount), 0) as paid_earnings,
    CONCAT('https://examace-smoky.vercel.app/auth?ref=', rc.code) as referral_link,
    rc.created_at as code_created_at,
    MAX(rt.created_at) as last_referral_date,
    COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as active_referrals,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as completed_referrals
  FROM referral_codes rc
  LEFT JOIN referral_transactions rt ON rc.user_id = rt.referrer_id
  LEFT JOIN referral_payouts rp ON rc.user_id = rp.user_id AND rp.status = 'completed'
  WHERE rc.user_id = user_uuid
  GROUP BY rc.id, rc.code, rc.total_referrals, rc.total_earnings, rc.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_referral_stats(UUID) TO authenticated;
