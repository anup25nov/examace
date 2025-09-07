-- URGENT FINAL FIX - Resolves PGRST203 and missing green ticks/scores
-- This script completely removes all function conflicts and ensures proper functionality

-- 1. DROP ALL EXISTING FUNCTIONS COMPLETELY (including all variations)
DROP FUNCTION IF EXISTS public.is_test_completed(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.is_test_completed(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.is_test_completed(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_test_score(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_test_score(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING, INTEGER);
DROP FUNCTION IF EXISTS public.upsert_test_completion_simple(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB);
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(UUID);
DROP FUNCTION IF EXISTS public.update_daily_visit(UUID);

-- 2. Create is_test_completed function (SINGLE VERSION - NO OVERLOADING)
CREATE OR REPLACE FUNCTION public.is_test_completed(
  user_uuid UUID,
  exam_name TEXT,
  test_type_name TEXT,
  test_name TEXT,
  topic_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle NULL topic_name properly
  IF topic_name IS NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM test_completions 
      WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type = test_type_name 
        AND test_id = test_name 
        AND topic_id IS NULL
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 
      FROM test_completions 
      WHERE user_id = user_uuid 
        AND exam_id = exam_name 
        AND test_type = test_type_name 
        AND test_id = test_name 
        AND topic_id = topic_name
    );
  END IF;
END;
$$;

-- 3. Create get_user_test_score function (SINGLE VERSION - NO OVERLOADING)
CREATE OR REPLACE FUNCTION public.get_user_test_score(
  user_uuid UUID,
  exam_name TEXT,
  test_type_name TEXT,
  test_name TEXT
)
RETURNS TABLE(
  score INTEGER,
  rank INTEGER,
  total_participants INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    its.score,
    its.rank,
    its.total_participants
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
END;
$$;

-- 4. Create submitindividualtestscore function (SINGLE VERSION - NO OVERLOADING)
CREATE OR REPLACE FUNCTION public.submitindividualtestscore(
  user_uuid UUID,
  exam_name TEXT,
  test_type_name TEXT,
  test_name TEXT,
  score_value INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank INTEGER;
  v_total_participants INTEGER;
  v_result JSONB;
BEGIN
  -- Calculate rank and total participants
  SELECT 
    COUNT(*) + 1,
    COUNT(*) + 1
  INTO v_rank, v_total_participants
  FROM individual_test_scores 
  WHERE exam_id = exam_name 
    AND test_type = test_type_name 
    AND test_id = test_name 
    AND score > score_value;

  -- Insert or update the score
  INSERT INTO individual_test_scores (
    user_id, exam_id, test_type, test_id, score, rank, total_participants
  )
  VALUES (
    user_uuid, exam_name, test_type_name, test_name, score_value, v_rank, v_total_participants
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    rank = EXCLUDED.rank,
    total_participants = EXCLUDED.total_participants,
    completed_at = now();

  -- Return the result
  SELECT to_jsonb(its.*) INTO v_result
  FROM individual_test_scores its
  WHERE its.user_id = user_uuid 
    AND its.exam_id = exam_name 
    AND its.test_type = test_type_name 
    AND its.test_id = test_name;
  
  RETURN v_result;
END;
$$;

-- 5. Create upsert_test_completion_simple function
CREATE OR REPLACE FUNCTION public.upsert_test_completion_simple(
  p_user_id UUID,
  p_exam_id TEXT,
  p_test_type TEXT,
  p_test_id TEXT,
  p_topic_id TEXT DEFAULT NULL,
  p_score INTEGER DEFAULT 0,
  p_total_questions INTEGER DEFAULT 0,
  p_correct_answers INTEGER DEFAULT 0,
  p_time_taken INTEGER DEFAULT 0,
  p_answers JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert or update test completion
  INSERT INTO test_completions (
    user_id, exam_id, test_type, test_id, topic_id, 
    score, total_questions, correct_answers, time_taken, answers
  )
  VALUES (
    p_user_id, p_exam_id, p_test_type, p_test_id, p_topic_id,
    p_score, p_total_questions, p_correct_answers, p_time_taken, p_answers
  )
  ON CONFLICT (user_id, exam_id, test_type, test_id, topic_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    total_questions = EXCLUDED.total_questions,
    correct_answers = EXCLUDED.correct_answers,
    time_taken = EXCLUDED.time_taken,
    answers = EXCLUDED.answers,
    completed_at = now();
  
  -- Return the result
  SELECT to_jsonb(tc.*) INTO v_result
  FROM test_completions tc
  WHERE tc.user_id = p_user_id 
    AND tc.exam_id = p_exam_id 
    AND tc.test_type = p_test_type 
    AND tc.test_id = p_test_id 
    AND (tc.topic_id = p_topic_id OR (tc.topic_id IS NULL AND p_topic_id IS NULL));
  
  RETURN v_result;
END;
$$;

-- 6. Create update_user_streak function
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
BEGIN
  -- Insert or update user streak
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, last_activity_date
  )
  VALUES (
    user_uuid, 1, 1, CURRENT_DATE
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
      WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
        WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = CURRENT_DATE;

  -- Return the result
  SELECT to_jsonb(us.*) INTO v_result
  FROM user_streaks us
  WHERE us.user_id = user_uuid;
  
  RETURN v_result;
END;
$$;

-- 7. Create get_or_create_user_streak function
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

-- 8. Create update_daily_visit function
CREATE OR REPLACE FUNCTION public.update_daily_visit(
  user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update user streak (same logic as update_user_streak)
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, last_activity_date
  )
  VALUES (
    user_uuid, 1, 1, CURRENT_DATE
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
      WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
        WHEN user_streaks.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = CURRENT_DATE;

  -- Return success
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_test_completed(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_test_score(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_test_completion_simple(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_visit(UUID) TO authenticated;

-- Verify functions exist (should return 7 functions)
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'is_test_completed',
    'get_user_test_score', 
    'submitindividualtestscore',
    'upsert_test_completion_simple',
    'update_user_streak',
    'get_or_create_user_streak',
    'update_daily_visit'
  )
ORDER BY routine_name;

-- Success message
SELECT 'URGENT FIX COMPLETE! All function conflicts resolved!' as result;
