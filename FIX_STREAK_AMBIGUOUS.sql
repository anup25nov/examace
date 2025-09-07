-- Fix ambiguous column reference in get_or_create_user_streak function

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(UUID);

-- Create the fixed function with explicit table aliases
CREATE OR REPLACE FUNCTION public.get_or_create_user_streak(
  user_uuid UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_tests_taken INTEGER,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date
  )
  VALUES (
    user_uuid, 0, 0, 0, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the streak data with explicit table alias
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.current_streak,
    us.longest_streak,
    us.total_tests_taken,
    us.last_activity_date,
    us.created_at,
    us.updated_at
  FROM user_streaks us
  WHERE us.user_id = user_uuid;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_user_streak(UUID) TO authenticated;

-- Success message
SELECT 'STREAK FUNCTION FIXED! Ambiguous column reference resolved!' as result;
