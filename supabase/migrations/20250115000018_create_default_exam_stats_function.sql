-- Create function to initialize default exam stats for new users

-- 1. Create function to create all default exam stats for a user
CREATE OR REPLACE FUNCTION create_all_default_exam_stats(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  stats_created INTEGER
) AS $$
DECLARE
  exam_record RECORD;
  stats_count INTEGER := 0;
BEGIN
  -- Loop through all available exams and create default stats
  FOR exam_record IN 
    SELECT DISTINCT exam_id FROM (
      VALUES 
        ('ssc-cgl'),
        ('ssc-mts'),
        ('bank-po'),
        ('railway'),
        ('airforce')
    ) AS exams(exam_id)
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
  
  RETURN QUERY SELECT true, 'Default exam stats created successfully', stats_count;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default exam stats: ' || SQLERRM, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create function to create default exam stats for a specific exam
CREATE OR REPLACE FUNCTION create_default_exam_stats(p_user_id UUID, p_exam_id VARCHAR(50))
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create function to initialize user streak
CREATE OR REPLACE FUNCTION create_default_user_streak(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Insert default user streak
  INSERT INTO user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_activity_date,
    last_visit_date,
    total_tests_taken,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    0, -- current_streak
    0, -- longest_streak
    NULL, -- last_activity_date
    NULL, -- last_visit_date
    0, -- total_tests_taken
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN QUERY SELECT true, 'Default user streak created';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error creating default user streak: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create comprehensive user initialization function
CREATE OR REPLACE FUNCTION initialize_new_user(p_user_id UUID, p_phone TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  profile_created BOOLEAN,
  referral_code_created BOOLEAN,
  exam_stats_created BOOLEAN,
  streak_created BOOLEAN
) AS $$
DECLARE
  profile_result BOOLEAN := false;
  referral_result BOOLEAN := false;
  stats_result BOOLEAN := false;
  streak_result BOOLEAN := false;
  error_message TEXT := '';
BEGIN
  -- 1. Create user profile
  BEGIN
    INSERT INTO user_profiles (id, phone, created_at, updated_at)
    VALUES (p_user_id, p_phone, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      phone = EXCLUDED.phone,
      updated_at = NOW();
    profile_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Profile error: ' || SQLERRM || '; ';
  END;
  
  -- 2. Create referral code
  BEGIN
    INSERT INTO referral_codes (user_id, code, total_referrals, total_earnings)
    VALUES (
      p_user_id, 
      UPPER(SUBSTRING(MD5(p_user_id::TEXT) FROM 1 FOR 8)), 
      0, 
      0.00
    )
    ON CONFLICT (user_id) DO NOTHING;
    referral_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Referral error: ' || SQLERRM || '; ';
  END;
  
  -- 3. Create default exam stats
  BEGIN
    PERFORM create_all_default_exam_stats(p_user_id);
    stats_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Stats error: ' || SQLERRM || '; ';
  END;
  
  -- 4. Create user streak
  BEGIN
    PERFORM create_default_user_streak(p_user_id);
    streak_result := true;
  EXCEPTION
    WHEN OTHERS THEN
      error_message := error_message || 'Streak error: ' || SQLERRM || '; ';
  END;
  
  -- Return results
  IF profile_result AND referral_result AND stats_result AND streak_result THEN
    RETURN QUERY SELECT true, 'User initialized successfully', profile_result, referral_result, stats_result, streak_result;
  ELSE
    RETURN QUERY SELECT false, 'Partial initialization: ' || error_message, profile_result, referral_result, stats_result, streak_result;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION create_all_default_exam_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_exam_stats(UUID, VARCHAR(50)) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_new_user(UUID, TEXT) TO authenticated;
