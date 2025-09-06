-- Add phone field to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.create_default_exam_stats(uuid,text);
DROP FUNCTION IF EXISTS public.create_all_default_exam_stats(uuid);
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(uuid,text,integer,text);
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(uuid);
DROP FUNCTION IF EXISTS public.submitindividualtestscore(uuid,text,text,text,integer);
DROP FUNCTION IF EXISTS public.update_daily_visit(uuid);

-- Create missing database functions
CREATE OR REPLACE FUNCTION public.create_default_exam_stats(p_user_id UUID, p_exam_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank)
  VALUES (p_user_id, p_exam_id, 0, 0, 0, 0)
  ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_all_default_exam_stats(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default stats for all exam types
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score, rank)
  VALUES 
    (p_user_id, 'ssc-cgl', 0, 0, 0, 0),
    (p_user_id, 'ssc-mts', 0, 0, 0, 0),
    (p_user_id, 'bank-po', 0, 0, 0, 0),
    (p_user_id, 'railway', 0, 0, 0, 0),
    (p_user_id, 'airforce', 0, 0, 0, 0)
  ON CONFLICT (user_id, exam_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_exam_stats_properly(
  user_uuid UUID,
  exam_name TEXT,
  new_score INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO exam_stats (user_id, exam_id, total_tests, best_score, average_score)
  VALUES (user_uuid, exam_name, 1, new_score, new_score)
  ON CONFLICT (user_id, exam_id) 
  DO UPDATE SET
    total_tests = exam_stats.total_tests + 1,
    best_score = GREATEST(exam_stats.best_score, new_score),
    average_score = (exam_stats.average_score * exam_stats.total_tests + new_score) / (exam_stats.total_tests + 1),
    last_test_date = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_user_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER, total_tests_taken INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_tests_taken)
  VALUES (p_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN QUERY
  SELECT us.current_streak, us.longest_streak, us.total_tests_taken
  FROM user_streaks us
  WHERE us.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submitindividualtestscore(
  p_user_id UUID,
  p_exam_id TEXT,
  p_test_type TEXT,
  p_test_id TEXT,
  p_score INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rank INTEGER := 1;
  v_total_participants INTEGER := 1;
BEGIN
  INSERT INTO individual_test_scores (user_id, exam_id, test_id, test_type, score, rank, total_participants)
  VALUES (p_user_id, p_exam_id, p_test_id, p_test_type, p_score, v_rank, v_total_participants);
  
  RETURN jsonb_build_object(
    'score', p_score,
    'rank', v_rank,
    'total_participants', v_total_participants
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_daily_visit(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_tests_taken, last_activity_date)
  VALUES (p_user_id, 1, 1, 0, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(user_streaks.longest_streak, 
      CASE 
        WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
        ELSE 1
      END),
    last_activity_date = CURRENT_DATE,
    updated_at = now();
END;
$$;