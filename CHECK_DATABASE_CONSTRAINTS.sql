-- Check actual database constraints for test_completions table
-- Run this in your Supabase SQL Editor to see what constraints actually exist

-- 1. Check all constraints on test_completions table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'test_completions'::regclass;

-- 2. Check all indexes on test_completions table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'test_completions';

-- 3. Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'test_completions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there are any unique indexes
SELECT 
  i.relname as index_name,
  a.attname as column_name,
  ix.indisunique as is_unique
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'test_completions'
  AND ix.indisunique = true;
