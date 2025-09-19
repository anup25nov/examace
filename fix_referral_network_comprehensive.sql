-- Comprehensive fix for get_referral_network_detailed function
-- Run this in your Supabase SQL Editor

DROP FUNCTION IF EXISTS get_referral_network_detailed(UUID);

CREATE OR REPLACE FUNCTION get_referral_network_detailed(user_uuid UUID)
RETURNS TABLE (
  referred_user_id UUID,
  referred_phone_masked TEXT,
  signup_date TIMESTAMP WITH TIME ZONE,
  referral_status TEXT,
  commission_status TEXT,
  commission_amount DECIMAL(10,2),
  membership_plan TEXT,
  membership_amount DECIMAL(10,2),
  membership_date TIMESTAMP WITH TIME ZONE,
  is_first_membership BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.referred_id,
    CASE 
      WHEN LENGTH(up.phone) >= 10 THEN 
        (SUBSTRING(up.phone, 1, 3) || '****' || SUBSTRING(up.phone, LENGTH(up.phone) - 2))::TEXT
      ELSE up.phone::TEXT
    END as referred_phone_masked,
    up.created_at,
    rt.status::TEXT as referral_status,
    COALESCE(rc.status, 'pending')::TEXT as commission_status,
    COALESCE(rc.commission_amount, 0.00) as commission_amount,
    -- Get membership plan from user_memberships or user_profiles
    COALESCE(
      um.plan::TEXT, 
      up.membership_plan::TEXT, 
      'none'
    ) as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    -- Get membership date from user_memberships or commission creation
    COALESCE(
      um.start_date, 
      rc.created_at, 
      up.created_at
    ) as membership_date,
    -- Use first_membership_only from referral_transactions
    COALESCE(rt.first_membership_only, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  LEFT JOIN user_memberships um ON um.user_id = rt.referred_id
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated;

-- Test the function
SELECT * FROM get_referral_network_detailed('fbc97816-07ed-4e21-bc45-219dbfdc4cec');
