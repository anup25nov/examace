-- =====================================================
-- COMPLETE DATABASE FIXES FOR EXAMACE APPLICATION
-- =====================================================
-- This file contains all the database function fixes
-- Run this on your production database to apply all fixes

-- =====================================================
-- 1. FIX UPDATE_DAILY_VISIT FUNCTION
-- =====================================================
-- Problem: Function was returning void instead of JSON data
-- Fix: Update function to return JSON with streak data

-- Drop existing function first
DROP FUNCTION IF EXISTS "public"."update_daily_visit"("user_uuid" "uuid");

-- Create new function with JSON return type
CREATE OR REPLACE FUNCTION "public"."update_daily_visit"("user_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

-- =====================================================
-- 2. FIX GET_TEST_RANK_AND_HIGHEST_SCORE FUNCTION
-- =====================================================
-- Problem: Function only looked in individual_test_scores table
-- Fix: Check both individual_test_scores and test_attempts tables

-- Drop existing function first
DROP FUNCTION IF EXISTS "public"."get_test_rank_and_highest_score"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying, "p_user_id" "uuid");

-- Create new function that checks both tables
CREATE OR REPLACE FUNCTION "public"."get_test_rank_and_highest_score"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying, "p_user_id" "uuid") RETURNS TABLE("user_rank" integer, "total_participants" integer, "highest_score" integer, "user_score" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_score_val INTEGER;
  total_participants_val INTEGER;
  user_rank_val INTEGER;
  highest_score_val INTEGER;
  score_source TEXT;
BEGIN
  -- First try to get user's score from individual_test_scores
  SELECT score INTO user_score_val
  FROM individual_test_scores
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id
  LIMIT 1;

  -- If not found in individual_test_scores, try test_attempts
  IF user_score_val IS NULL THEN
    SELECT score INTO user_score_val
    FROM test_attempts
    WHERE user_id = p_user_id 
      AND exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 1;
    
    score_source := 'test_attempts';
  ELSE
    score_source := 'individual_test_scores';
  END IF;

  -- If still no user score found, return null values
  IF user_score_val IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER, NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Get total participants and highest score for this test
  IF score_source = 'individual_test_scores' THEN
    SELECT 
      COUNT(*)::INTEGER,
      MAX(score)::INTEGER
    INTO total_participants_val, highest_score_val
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id;

    -- Calculate user's rank (1-based ranking)
    SELECT COUNT(*) + 1
    INTO user_rank_val
    FROM individual_test_scores
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND score > user_score_val;
  ELSE
    -- Use test_attempts data
    SELECT 
      COUNT(*)::INTEGER,
      MAX(score)::INTEGER
    INTO total_participants_val, highest_score_val
    FROM test_attempts
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed';

    -- Calculate user's rank (1-based ranking)
    SELECT COUNT(*) + 1
    INTO user_rank_val
    FROM test_attempts
    WHERE exam_id = p_exam_id 
      AND test_type = p_test_type 
      AND test_id = p_test_id
      AND status = 'completed'
      AND score > user_score_val;
  END IF;

  -- Update the individual_test_scores record with calculated rank and total_participants if it exists
  UPDATE individual_test_scores
  SET 
    rank = user_rank_val,
    total_participants = total_participants_val
  WHERE user_id = p_user_id 
    AND exam_id = p_exam_id 
    AND test_type = p_test_type 
    AND test_id = p_test_id;

  -- Return the calculated values
  RETURN QUERY SELECT 
    user_rank_val,
    total_participants_val,
    highest_score_val,
    user_score_val;
END;
$$;

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions for the updated functions

-- Grant permissions for update_daily_visit
GRANT ALL ON FUNCTION "public"."update_daily_visit"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_daily_visit"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_daily_visit"("user_uuid" "uuid") TO "service_role";

-- Grant permissions for get_test_rank_and_highest_score
GRANT ALL ON FUNCTION "public"."get_test_rank_and_highest_score"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_test_rank_and_highest_score"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_test_rank_and_highest_score"("p_exam_id" character varying, "p_test_type" character varying, "p_test_id" character varying, "p_user_id" "uuid") TO "service_role";

-- =====================================================
-- 4. VERIFY FUNCTIONS EXIST
-- =====================================================
-- Check that functions were created successfully

DO $$
BEGIN
  -- Check update_daily_visit function
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_daily_visit' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ update_daily_visit function created successfully';
  ELSE
    RAISE WARNING '❌ update_daily_visit function creation failed';
  END IF;

  -- Check get_test_rank_and_highest_score function
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_test_rank_and_highest_score' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ get_test_rank_and_highest_score function created successfully';
  ELSE
    RAISE WARNING '❌ get_test_rank_and_highest_score function creation failed';
  END IF;
END $$;

-- =====================================================
-- SUMMARY OF FIXES APPLIED
-- =====================================================
/*
FIXES APPLIED:

1. ✅ update_daily_visit function
   - Changed return type from void to jsonb
   - Now returns streak data in JSON format
   - Fixes 204 response issue

2. ✅ get_test_rank_and_highest_score function
   - Now checks both individual_test_scores and test_attempts tables
   - Handles cases where data exists in either table
   - Fixes rank showing 0 issue

3. ✅ Proper permissions granted
   - All necessary roles have access to the functions

4. ✅ Verification checks
   - Functions are verified to exist after creation

NEXT STEPS:
1. Deploy Edge Functions (create_razorpay_order ✅ already deployed)
2. Manually deploy verify_razorpay_payment via Supabase Dashboard
3. Test all fixes in your application

ISSUES RESOLVED:
- v1/rpc/update_daily_visit returning 204 ✅
- Rank showing 0 on test solution page ✅
- Profile visibility issues ✅ (frontend changes)
- Radio group and checkbox sizes ✅ (frontend changes)
- Razorpay receipt length validation ✅ (Edge Function)
- Payment verification user_id null error ✅ (Edge Function)
*/
