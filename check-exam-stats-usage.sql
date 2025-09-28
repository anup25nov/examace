-- Check if exam_stats table is used by RPC functions
-- Run this in your Supabase SQL Editor

-- 1. Check if exam_stats table exists and has data
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'exam_stats';

-- 2. Check if any RPC functions reference exam_stats
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments,
    CASE 
        WHEN prosrc LIKE '%exam_stats%' THEN 'References exam_stats'
        ELSE 'No exam_stats reference'
    END as exam_stats_usage
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (prosrc LIKE '%exam_stats%' OR proname LIKE '%exam%')
ORDER BY proname;

-- 3. Check for any triggers on exam_stats
SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef,
    tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname = 'exam_stats';

-- 4. Check for any views that use exam_stats
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
AND definition LIKE '%exam_stats%';

-- 5. Check table size and row count
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    (SELECT COUNT(*) FROM exam_stats) as row_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'exam_stats';

-- 6. Check for any foreign key references to exam_stats
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (ccu.table_name = 'exam_stats' OR tc.table_name = 'exam_stats');
