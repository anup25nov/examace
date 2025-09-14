-- Clean up duplicate user profiles and ensure proper constraints

-- 1. First, let's see what's causing the duplicate key issue
-- The issue might be that we're trying to insert a user_profile that already exists
-- Let's make the handle_new_user function more robust

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if the user doesn't already exist
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Also create a function to safely get or create user profile
CREATE OR REPLACE FUNCTION get_or_create_user_profile(user_uuid UUID, user_phone TEXT)
RETURNS TABLE (
  id UUID,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Try to insert, ignore if exists
  INSERT INTO user_profiles (id, phone, created_at, updated_at)
  VALUES (user_uuid, user_phone, now(), now())
  ON CONFLICT (id) DO NOTHING;
  
  -- Return the user profile
  RETURN QUERY
  SELECT up.id, up.phone, up.created_at, up.updated_at
  FROM user_profiles up
  WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_user_profile(UUID, TEXT) TO authenticated;
