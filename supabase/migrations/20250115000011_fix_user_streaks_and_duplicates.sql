-- Fix user_streaks table and handle duplicate key issues

-- 1. Add last_visit_date column to user_streaks table
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS last_visit_date DATE;

-- 2. Update the update_daily_visit function to use correct column names
CREATE OR REPLACE FUNCTION update_daily_visit(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update user streak for daily visit
  INSERT INTO user_streaks (user_id, last_visit_date, current_streak, longest_streak)
  VALUES (user_uuid, CURRENT_DATE, 1, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_visit_date = CURRENT_DATE,
    current_streak = CASE 
      WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_visit_date = CURRENT_DATE 
      THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_visit_date = CURRENT_DATE - INTERVAL '1 day' 
        THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_visit_date = CURRENT_DATE 
        THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix duplicate key issue by handling existing user_profiles
-- First, let's check if there are any duplicate user_profiles and clean them up
DO $$
BEGIN
  -- Delete duplicate user_profiles, keeping only the latest one
  DELETE FROM user_profiles 
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
      FROM user_profiles
    ) t 
    WHERE rn > 1
  );
  
  -- If there are still issues, we might need to handle auth.users conflicts
  -- This will be handled by the trigger function
END $$;

-- 4. Ensure the handle_new_user trigger function handles duplicates properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile, ignoring conflicts (user already exists)
  INSERT INTO public.user_profiles (id, phone, created_at, updated_at)
  VALUES (new.id, new.phone, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_daily_visit(UUID) TO authenticated;
