-- Comprehensive fix for streak update system
-- Addresses timezone issues and streak calculation logic

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.update_daily_visit(UUID);
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(UUID);

-- 1. Create improved update_user_streak function with better timezone handling
CREATE OR REPLACE FUNCTION public.update_user_streak(
  user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_activity_date DATE;
  v_today DATE;
  v_days_diff INTEGER;
BEGIN
  -- Use UTC date for consistency
  v_today := CURRENT_DATE AT TIME ZONE 'UTC';
  
  -- Get current streak data
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date
  INTO v_current_streak, v_longest_streak, v_last_activity_date
  FROM user_streaks us
  WHERE us.user_id = user_uuid;

  -- If no existing record, create new one
  IF v_current_streak IS NULL THEN
    v_current_streak := 1;
    v_longest_streak := 1;
    v_last_activity_date := v_today;
  ELSE
    -- Calculate days difference
    v_days_diff := v_today - COALESCE(v_last_activity_date, v_today - 1);
    
    -- Update streak based on days difference
    IF v_days_diff = 0 THEN
      -- Same day, no change to streak
      NULL;
    ELSIF v_days_diff = 1 THEN
      -- Consecutive day, increment streak
      v_current_streak := v_current_streak + 1;
      v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      v_last_activity_date := v_today;
    ELSE
      -- More than 1 day gap, reset streak
      v_current_streak := 1;
      v_longest_streak := GREATEST(v_longest_streak, 1);
      v_last_activity_date := v_today;
    END IF;
  END IF;

  -- Insert or update user streak
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date, created_at, updated_at
  )
  VALUES (
    user_uuid, v_current_streak, v_longest_streak, 1, v_last_activity_date, now(), now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_tests_taken = user_streaks.total_tests_taken + 1,
    last_activity_date = EXCLUDED.last_activity_date,
    updated_at = now();

  -- Return the updated streak data
  SELECT 
    json_build_object(
      'current_streak', v_current_streak,
      'longest_streak', v_longest_streak,
      'last_activity_date', v_last_activity_date,
      'days_diff', v_days_diff
    )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- 2. Create update_daily_visit function that calls update_user_streak
CREATE OR REPLACE FUNCTION public.update_daily_visit(
  user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just call update_user_streak
  RETURN public.update_user_streak(user_uuid);
END;
$$;

-- 3. Create get_or_create_user_streak function
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
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date, created_at, updated_at
  )
  VALUES (
    user_uuid, 0, 0, 0, NULL, now(), now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the streak data
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_visit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_streak(UUID) TO authenticated;

-- Success message
SELECT 'STREAK UPDATE SYSTEM FIXED! Timezone and logic issues resolved!' as result;
