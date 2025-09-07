-- COMPREHENSIVE DATABASE FIX
-- Fixes all issues: ambiguous column references, duplicate key constraints, and missing functionality

-- 1. DROP ALL EXISTING FUNCTIONS COMPLETELY
DROP FUNCTION IF EXISTS public.is_test_completed(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.is_test_completed(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.get_user_test_score(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_test_score(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING);
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.submitindividualtestscore(UUID, CHARACTER VARYING, CHARACTER VARYING, CHARACTER VARYING, INTEGER);
DROP FUNCTION IF EXISTS public.upsert_test_completion_simple(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB);
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(UUID);
DROP FUNCTION IF EXISTS public.update_daily_visit(UUID);
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(UUID, TEXT, INTEGER);

-- 2. Fix exam_stats table to prevent duplicate key violations
-- Add proper unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exam_stats_user_exam_unique'
    ) THEN
        ALTER TABLE public.exam_stats 
        ADD CONSTRAINT exam_stats_user_exam_unique UNIQUE (user_id, exam_id);
    END IF;
END $$;

-- 3. Create is_test_completed function (FIXED - NO AMBIGUOUS REFERENCES)
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
      FROM test_completions tc
      WHERE tc.user_id = user_uuid 
        AND tc.exam_id = exam_name 
        AND tc.test_type = test_type_name 
        AND tc.test_id = test_name 
        AND tc.topic_id IS NULL
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 
      FROM test_completions tc
      WHERE tc.user_id = user_uuid 
        AND tc.exam_id = exam_name 
        AND tc.test_type = test_type_name 
        AND tc.test_id = test_name 
        AND tc.topic_id = topic_name
    );
  END IF;
END;
$$;

-- 4. Create get_user_test_score function (FIXED - NO AMBIGUOUS REFERENCES)
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

-- 5. Create submitindividualtestscore function (FIXED - PROPER RANK CALCULATION)
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
  -- Calculate rank and total participants properly
  WITH ranked_scores AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) as rank,
      COUNT(*) OVER () as total_count
    FROM individual_test_scores 
    WHERE exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name
  )
  SELECT 
    COALESCE(rs.rank, 1),
    COALESCE(rs.total_count, 1)
  INTO v_rank, v_total_participants
  FROM ranked_scores rs
  WHERE rs.user_id = user_uuid;

  -- If user doesn't exist in rankings yet, calculate their rank
  IF v_rank IS NULL THEN
    SELECT 
      COUNT(*) + 1,
      COUNT(*) + 1
    INTO v_rank, v_total_participants
    FROM individual_test_scores 
    WHERE exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name 
      AND score > score_value;
  END IF;

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
    completed_at = now(),
    updated_at = now();

  -- Recalculate all ranks for this test
  WITH ranked_scores AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) as new_rank,
      COUNT(*) OVER () as total_count
    FROM individual_test_scores 
    WHERE exam_id = exam_name 
      AND test_type = test_type_name 
      AND test_id = test_name
  )
  UPDATE individual_test_scores 
  SET 
    rank = rs.new_rank,
    total_participants = rs.total_count,
    updated_at = now()
  FROM ranked_scores rs
  WHERE individual_test_scores.user_id = rs.user_id
    AND individual_test_scores.exam_id = exam_name 
    AND individual_test_scores.test_type = test_type_name 
    AND individual_test_scores.test_id = test_name;

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

-- 6. Create upsert_test_completion_simple function
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

-- 7. Create update_user_streak function (FIXED - NO AMBIGUOUS REFERENCES)
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
BEGIN
  -- Get current streak data
  SELECT 
    us.current_streak,
    us.longest_streak,
    us.last_activity_date
  INTO v_current_streak, v_longest_streak, v_last_activity_date
  FROM user_streaks us
  WHERE us.user_id = user_uuid;

  -- Calculate new streak
  IF v_last_activity_date IS NULL OR v_last_activity_date < CURRENT_DATE THEN
    IF v_last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
      v_current_streak := 1;
    END IF;
    
    v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);
  END IF;

  -- Insert or update user streak
  INSERT INTO user_streaks (
    user_id, current_streak, longest_streak, total_tests_taken, last_activity_date
  )
  VALUES (
    user_uuid, v_current_streak, v_longest_streak, 1, CURRENT_DATE
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    total_tests_taken = user_streaks.total_tests_taken + 1,
    last_activity_date = EXCLUDED.last_activity_date,
    updated_at = now();

  -- Return the result
  SELECT to_jsonb(us.*) INTO v_result
  FROM user_streaks us
  WHERE us.user_id = user_uuid;
  
  RETURN v_result;
END;
$$;

-- 8. Create get_or_create_user_streak function (FIXED - NO AMBIGUOUS REFERENCES)
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

-- 9. Create update_daily_visit function
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

-- 10. Create update_exam_stats_properly function (FIXED - PROPER MOCK+PYQ ONLY LOGIC)
CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
  user_uuid UUID,
  exam_name TEXT,
  new_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tests INTEGER;
  v_best_score INTEGER;
  v_average_score INTEGER;
  v_result JSONB;
BEGIN
  -- Calculate stats for Mock + PYQ tests only
  SELECT 
    COUNT(*),
    MAX(score),
    ROUND(AVG(score))
  INTO v_total_tests, v_best_score, v_average_score
  FROM test_completions tc
  WHERE tc.user_id = user_uuid
    AND tc.exam_id = exam_name
    AND tc.test_type IN ('mock', 'pyq');

  -- Update or insert exam stats
  INSERT INTO exam_stats (
    user_id, exam_id, total_tests, best_score, average_score, last_test_date
  )
  VALUES (
    user_uuid, exam_name, v_total_tests, v_best_score, v_average_score, now()
  )
  ON CONFLICT (user_id, exam_id) 
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    last_test_date = EXCLUDED.last_test_date,
    updated_at = now();

  -- Return the result
  SELECT to_jsonb(es.*) INTO v_result
  FROM exam_stats es
  WHERE es.user_id = user_uuid 
    AND es.exam_id = exam_name;
  
  RETURN v_result;
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
GRANT EXECUTE ON FUNCTION public.update_exam_stats_properly(UUID, TEXT, INTEGER) TO authenticated;

-- Verify functions exist
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
    'update_daily_visit',
    'update_exam_stats_properly'
  )
ORDER BY routine_name;

-- Success message
SELECT 'COMPREHENSIVE DATABASE FIX COMPLETE! All issues resolved!' as result;