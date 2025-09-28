-- Supabase Table Triggers Analysis Query
-- Run this in your Supabase SQL Editor to check for all triggers

-- Check for all triggers in the public schema
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
ORDER BY tablename, triggername;

-- Check for trigger functions
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname LIKE '%trigger%'
ORDER BY p.proname;

-- Check for specific trigger types
SELECT 
    schemaname,
    tablename,
    triggername,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        WHEN tgtype & 4 = 4 THEN 'AFTER'
        ELSE 'INSTEAD OF'
    END as trigger_timing,
    CASE 
        WHEN tgtype & 1 = 1 THEN 'INSERT'
        WHEN tgtype & 2 = 2 THEN 'UPDATE' 
        WHEN tgtype & 4 = 4 THEN 'DELETE'
        ELSE 'UNKNOWN'
    END as trigger_event,
    tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY tablename, triggername;
