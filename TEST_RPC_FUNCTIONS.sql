-- ==============================================
-- TEST RPC FUNCTIONS TO VERIFY THEY'RE WORKING
-- ==============================================

-- Test 1: Check if update_exam_stats_properly is working
-- First, let's see what data exists
SELECT 'BEFORE update_exam_stats_properly' as test_phase;
SELECT * FROM public.exam_stats WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- Test 2: Check if submitindividualtestscore is working
SELECT 'BEFORE submitindividualtestscore' as test_phase;
SELECT * FROM public.individual_test_scores WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- Test 3: Check if update_user_streak is working
SELECT 'BEFORE update_user_streak' as test_phase;
SELECT * FROM public.user_streaks LIMIT 5;

-- Test 4: Check test_completions table
SELECT 'BEFORE test_completions check' as test_phase;
SELECT * FROM public.test_completions WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- ==============================================
-- MANUAL TEST OF RPC FUNCTIONS
-- ==============================================

-- Test update_exam_stats_properly (replace with actual user_id)
-- SELECT public.update_exam_stats_properly('660edf9c-fcad-41a3-8f27-4a496413899f'::UUID, 'ssc-cgl', 85);

-- Test submitindividualtestscore (replace with actual user_id)
-- SELECT public.submitindividualtestscore('660edf9c-fcad-41a3-8f27-4a496413899f'::UUID, 'ssc-cgl', 'mock', 'mock-test-1', 85);

-- Test update_user_streak (replace with actual user_id)
-- SELECT public.update_user_streak('660edf9c-fcad-41a3-8f27-4a496413899f'::UUID);

-- ==============================================
-- VERIFY DATA AFTER TESTS
-- ==============================================

-- Check exam_stats after update
SELECT 'AFTER update_exam_stats_properly' as test_phase;
SELECT * FROM public.exam_stats WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- Check individual_test_scores after update
SELECT 'AFTER submitindividualtestscore' as test_phase;
SELECT * FROM public.individual_test_scores WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- Check user_streaks after update
SELECT 'AFTER update_user_streak' as test_phase;
SELECT * FROM public.user_streaks LIMIT 5;

-- Check test_completions after update
SELECT 'AFTER test_completions check' as test_phase;
SELECT * FROM public.test_completions WHERE exam_id = 'ssc-cgl' LIMIT 5;

-- ==============================================
-- SUMMARY QUERIES
-- ==============================================

-- Count records in each table
SELECT 'RECORD COUNTS' as summary;
SELECT 'exam_stats' as table_name, COUNT(*) as count FROM public.exam_stats
UNION ALL
SELECT 'individual_test_scores' as table_name, COUNT(*) as count FROM public.individual_test_scores
UNION ALL
SELECT 'user_streaks' as table_name, COUNT(*) as count FROM public.user_streaks
UNION ALL
SELECT 'test_completions' as table_name, COUNT(*) as count FROM public.test_completions;

-- Check for any recent updates (last 24 hours)
SELECT 'RECENT UPDATES (last 24 hours)' as summary;
SELECT 'exam_stats' as table_name, COUNT(*) as count FROM public.exam_stats WHERE updated_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'individual_test_scores' as table_name, COUNT(*) as count FROM public.individual_test_scores WHERE updated_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'user_streaks' as table_name, COUNT(*) as count FROM public.user_streaks WHERE updated_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'test_completions' as table_name, COUNT(*) as count FROM public.test_completions WHERE updated_at > NOW() - INTERVAL '24 hours';
