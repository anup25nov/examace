-- Fix update_all_test_ranks function to resolve ambiguous column reference
-- The issue is that total_participants is both a variable name and a column name

CREATE OR REPLACE FUNCTION "public"."update_all_test_ranks"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying) 
RETURNS "void"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  test_record RECORD;
  current_rank INTEGER;
  total_participants_count INTEGER; -- Renamed variable to avoid ambiguity
BEGIN
  -- Get total participants for this test
  SELECT COUNT(*) INTO total_participants_count
  FROM individual_test_scores
  WHERE exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Update ranks for all participants in this test
  current_rank := 1;
  FOR test_record IN
    SELECT user_id, score
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
    ORDER BY score DESC, completed_at ASC
  LOOP
    UPDATE individual_test_scores
    SET 
      rank = current_rank,
      total_participants = total_participants_count -- Use the renamed variable
    WHERE user_id = test_record.user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id;
    
    current_rank := current_rank + 1;
  END LOOP;
END;
$$;
