-- Fix referral network to properly show membership information
-- This migration ensures that membership information is properly displayed in the referral network

-- 1. Update the get_referral_network_detailed function to better handle membership display
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
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    -- Check multiple sources for membership plan
    CASE 
      WHEN m.plan IS NOT NULL AND m.end_date > NOW() THEN m.plan::TEXT
      WHEN up.membership_plan IS NOT NULL AND up.membership_status = 'active' THEN up.membership_plan::TEXT
      WHEN um.plan_id IS NOT NULL AND um.status = 'active' AND um.end_date > NOW() THEN um.plan_id::TEXT
      ELSE 'none'::TEXT
    END as membership_plan,
    COALESCE(rc.membership_amount, 0.00) as membership_amount,
    CASE 
      WHEN m.start_date IS NOT NULL THEN m.start_date
      WHEN rc.created_at IS NOT NULL THEN rc.created_at
      WHEN up.created_at IS NOT NULL THEN up.created_at
      ELSE NOW()
    END as membership_date,
    COALESCE(rc.is_first_membership, false) as is_first_membership
  FROM referral_transactions rt
  LEFT JOIN user_profiles up ON rt.referred_id = up.id
  LEFT JOIN referral_commissions rc ON rt.referred_id = rc.referred_id
  LEFT JOIN memberships m ON m.user_id = rt.referred_id AND m.end_date > NOW()
  LEFT JOIN user_memberships um ON um.user_id = rt.referred_id AND um.status = 'active' AND um.end_date > NOW()
  WHERE rt.referrer_id = user_uuid
  ORDER BY up.created_at DESC;
END;$$;

-- 2. Create a function to sync membership data to user profiles
CREATE OR REPLACE FUNCTION sync_membership_to_profile(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  membership_record RECORD;
  profile_record RECORD;
BEGIN
  -- Get the latest active membership
  SELECT * INTO membership_record
  FROM memberships
  WHERE user_id = p_user_id AND end_date > NOW()
  ORDER BY start_date DESC
  LIMIT 1;
  
  -- Get current profile
  SELECT * INTO profile_record
  FROM user_profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update profile with membership info
  IF membership_record.plan IS NOT NULL THEN
    UPDATE user_profiles
    SET 
      membership_plan = membership_record.plan,
      membership_status = 'active',
      membership_expiry = membership_record.end_date,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_referral_network_detailed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_membership_to_profile(UUID) TO authenticated;

-- 4. Create a trigger to automatically sync membership data to profiles
CREATE OR REPLACE FUNCTION trigger_sync_membership_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync membership data to user profile when membership is created/updated
  PERFORM sync_membership_to_profile(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on memberships table
DROP TRIGGER IF EXISTS sync_membership_to_profile_trigger ON memberships;
CREATE TRIGGER sync_membership_to_profile_trigger
  AFTER INSERT OR UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_membership_to_profile();
