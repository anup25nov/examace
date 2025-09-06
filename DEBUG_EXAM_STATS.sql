-- ==============================================
-- DEBUG EXAM_STATS TABLE
-- ==============================================

-- Check current data in exam_stats table
SELECT 'CURRENT EXAM_STATS DATA' as debug_info;
SELECT * FROM public.exam_stats ORDER BY created_at DESC;

-- Check for specific user (replace with your actual user_id)
SELECT 'USER SPECIFIC DATA' as debug_info;
SELECT * FROM public.exam_stats WHERE user_id = '660edf9c-fcad-41a3-8f27-4a496413899f';

-- Check count of records
SELECT 'RECORD COUNT' as debug_info;
SELECT COUNT(*) as total_records FROM public.exam_stats;

-- Check if there are any records for specific exams
SELECT 'EXAM BREAKDOWN' as debug_info;
SELECT exam_id, COUNT(*) as count FROM public.exam_stats GROUP BY exam_id;

-- Check recent activity
SELECT 'RECENT ACTIVITY' as debug_info;
SELECT exam_id, total_tests, best_score, average_score, last_test_date, created_at 
FROM public.exam_stats 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check for any errors in the table
SELECT 'TABLE STRUCTURE CHECK' as debug_info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'exam_stats' AND table_schema = 'public'
ORDER BY ordinal_position;
