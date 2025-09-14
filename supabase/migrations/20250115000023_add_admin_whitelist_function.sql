-- Add function to whitelist admin users
CREATE OR REPLACE FUNCTION add_admin_user(
  admin_user_id UUID,
  target_user_id UUID,
  admin_role VARCHAR(50) DEFAULT 'admin'
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person adding is already an admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Insert the new admin user
  INSERT INTO admin_users (user_id, role, created_by)
  VALUES (target_user_id, admin_role, admin_user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to remove admin access
CREATE OR REPLACE FUNCTION remove_admin_user(
  admin_user_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the person removing is already an admin
  IF NOT is_admin(admin_user_id) THEN
    RETURN false;
  END IF;
  
  -- Deactivate the admin user
  UPDATE admin_users
  SET is_active = false, updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_admin_user(UUID, UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_user(UUID, UUID) TO authenticated;

-- Insert a default admin user (replace with actual user ID)
-- This should be run manually with a real user ID
-- INSERT INTO admin_users (user_id, role, is_active) 
-- VALUES ('your-user-id-here', 'super_admin', true);
