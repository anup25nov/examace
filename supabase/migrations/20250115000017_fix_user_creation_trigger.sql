-- Fix user creation trigger to handle phone authentication properly

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create a more robust handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile with proper error handling
  BEGIN
    INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
    VALUES (new.id, new.phone, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      updated_at = now();
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth user creation
      RAISE WARNING 'Failed to create user profile for %: %', new.id, SQLERRM;
      RETURN new;
  END;
  
  -- Create referral code with error handling
  BEGIN
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      new.id, 
      UPPER(SUBSTRING(MD5(new.id::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth user creation
      RAISE WARNING 'Failed to create referral code for %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Also create a function to manually create user profile if needed
CREATE OR REPLACE FUNCTION create_user_profile_if_missing(user_uuid UUID, user_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_uuid) THEN
    -- Create user profile
    INSERT INTO user_profiles (id, phone, created_at, updated_at)
    VALUES (user_uuid, user_phone, now(), now());
    
    -- Create referral code
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      user_uuid, 
      UPPER(SUBSTRING(MD5(user_uuid::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile_if_missing(UUID, TEXT) TO authenticated;
