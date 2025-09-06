-- Fix RPC function parameter mismatches
-- Run this script in your Supabase SQL Editor

-- Drop and recreate update_exam_stats_properly with correct parameters
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(uuid,text,integer,text);
DROP FUNCTION IF EXISTS public.update_exam_stats_properly(uuid,text,integer);

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

-- Drop and recreate submitindividualtestscore with correct parameter order
DROP FUNCTION IF EXISTS public.submitindividualtestscore(uuid,text,text,text,integer);

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
  INSERT INTO individual_test_scores (user_id, exam_id, test_type, test_id, score, rank, total_participants)
  VALUES (p_user_id, p_exam_id, p_test_type, p_test_id, p_score, v_rank, v_total_participants)
  ON CONFLICT (user_id, exam_id, test_type, test_id) 
  DO UPDATE SET
    score = EXCLUDED.score,
    rank = EXCLUDED.rank,
    total_participants = EXCLUDED.total_participants,
    completed_at = now();
  
  RETURN jsonb_build_object(
    'score', p_score,
    'rank', v_rank,
    'total_participants', v_total_participants
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_exam_stats_properly(uuid,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submitindividualtestscore(uuid,text,text,text,integer) TO authenticated;

-- Note: The test_completions table has a unique constraint on (user_id, exam_id, test_type, test_id, topic_id)
-- Make sure your application code uses the correct onConflict clause:
-- onConflict: 'user_id,exam_id,test_type,test_id,topic_id'

-- Test the functions to make sure they work
-- You can uncomment these lines to test:
-- SELECT public.update_exam_stats_properly('00000000-0000-0000-0000-000000000000'::uuid, 'test-exam', 85);
-- SELECT public.submitindividualtestscore('00000000-0000-0000-0000-000000000000'::uuid, 'test-exam', 'mock', 'test-1', 85);
