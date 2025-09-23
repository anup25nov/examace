-- Fix exam_stats table columns and create_all_default_exam_stats function
-- This migration addresses the column mismatch issue

-- First, let's check if we need to add the missing columns to exam_stats
DO $$
BEGIN
    -- Add total_tests_taken column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'total_tests_taken'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN total_tests_taken INTEGER DEFAULT 0;
    END IF;

    -- Add other missing columns that might be referenced in the function
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'total_score'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN total_score INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'total_time_taken'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN total_time_taken INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'average_time_per_question'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN average_time_per_question NUMERIC(5,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'accuracy_percentage'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN accuracy_percentage NUMERIC(5,2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_stats' 
        AND column_name = 'percentile'
    ) THEN
        ALTER TABLE exam_stats ADD COLUMN percentile NUMERIC(5,2) DEFAULT 0.00;
    END IF;
END $$;

-- Update the create_all_default_exam_stats function to only create stats for exams the user has attempted
CREATE OR REPLACE FUNCTION "public"."create_all_default_exam_stats"("p_user_id" "uuid") 
RETURNS TABLE("success" boolean, "message" "text", "stats_created" integer)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  exam_record RECORD;
  stats_count INTEGER := 0;
  attempted_exams TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get list of exams the user has actually attempted
  SELECT ARRAY_AGG(DISTINCT exam_id) INTO attempted_exams
  FROM test_completions 
  WHERE user_id = p_user_id;
  
  -- If no exams attempted, return early
  IF attempted_exams IS NULL OR array_length(attempted_exams, 1) IS NULL THEN
    RETURN QUERY SELECT true, 'No exams attempted yet, no stats created', 0;
    RETURN;
  END IF;
  
  -- Loop through only attempted exams and create default stats
  FOR exam_record IN 
    SELECT DISTINCT exam_id FROM unnest(attempted_exams) AS exam_id
  LOOP
    -- Insert default exam stats for this exam
    INSERT INTO exam_stats (
      user_id,
      exam_id,
      total_tests_taken,
      total_score,
      average_score,
      best_score,
      total_time_taken,
      average_time_per_question,
      accuracy_percentage,
      rank,
      percentile,
      last_test_date,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      exam_record.exam_id,
      0, -- total_tests_taken
      0, -- total_score
      0.00, -- average_score
      0, -- best_score
      0, -- total_time_taken
      0.00, -- average_time_per_question
      0.00, -- accuracy_percentage
      0, -- rank
      0.00, -- percentile
      NULL, -- last_test_date
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, exam_id) DO NOTHING;
    
    stats_count := stats_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT true, 'Default exam stats created for attempted exams', stats_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default exam stats: ' || SQLERRM, 0;
END;
$$;

-- Also update the create_default_exam_stats function to use correct column names
CREATE OR REPLACE FUNCTION "public"."create_default_exam_stats"("p_user_id" "uuid", "p_exam_id" character varying) 
RETURNS TABLE("success" boolean, "message" "text")
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
  -- Insert default exam stats for the specific exam
  INSERT INTO exam_stats (
    user_id,
    exam_id,
    total_tests_taken,
    total_score,
    average_score,
    best_score,
    total_time_taken,
    average_time_per_question,
    accuracy_percentage,
    rank,
    percentile,
    last_test_date,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_exam_id,
    0, -- total_tests_taken
    0, -- total_score
    0.00, -- average_score
    0, -- best_score
    0, -- total_time_taken
    0.00, -- average_time_per_question
    0.00, -- accuracy_percentage
    0, -- rank
    0.00, -- percentile
    NULL, -- last_test_date
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, exam_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Default exam stats created for ' || p_exam_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default exam stats: ' || SQLERRM;
END;
$$;
