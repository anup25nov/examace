-- Fix get_user_referral_earnings function to include pending commissions
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS get_user_referral_earnings(UUID);

CREATE OR REPLACE FUNCTION get_user_referral_earnings(user_uuid UUID)
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
    COALESCE(rc.total_referrals, 0) as total_referrals,
    -- Total earnings = pending + paid commissions
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status IN ('pending', 'completed', 'paid')), 
      0.00
    ) as total_earnings,
    -- Pending earnings = pending + completed commissions (ready for withdrawal)
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status IN ('pending', 'completed')), 
      0.00
    ) as pending_earnings,
    -- Paid earnings = withdrawn commissions
    COALESCE(
      (SELECT SUM(commission_amount) 
       FROM referral_commissions 
       WHERE referrer_id = user_uuid AND status = 'withdrawn'), 
      0.00
    ) as paid_earnings,
    rc.code as referral_code
  FROM referral_codes rc
  WHERE rc.user_id = user_uuid AND rc.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_referral_earnings(UUID) TO authenticated;

-- Test the function
SELECT * FROM get_user_referral_earnings('fbc97816-07ed-4e21-bc45-219dbfdc4cec');
