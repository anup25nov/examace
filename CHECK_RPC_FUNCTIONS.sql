-- ==============================================
-- CHECK IF RPC FUNCTIONS EXIST
-- ==============================================

-- Check if create_default_exam_stats exists
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name = 'create_default_exam_stats';

-- Check if create_all_default_exam_stats exists
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name = 'create_all_default_exam_stats';

-- Check if get_or_create_exam_stats exists
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name = 'get_or_create_exam_stats';

-- Check all exam-related RPC functions
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%exam%' OR routine_name LIKE '%stats%'
ORDER BY routine_name;

-- ==============================================
-- CHECK CURRENT EXAM_STATS DATA
-- ==============================================

-- Check if there's any data in exam_stats table
SELECT COUNT(*) as total_records FROM public.exam_stats;

-- Check exam_stats for a specific user (replace with your user_id)
SELECT * FROM public.exam_stats WHERE user_id = '660edf9c-fcad-41a3-8f27-4a496413899f';

-- Check exam_stats structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exam_stats' AND table_schema = 'public'
ORDER BY ordinal_position;
