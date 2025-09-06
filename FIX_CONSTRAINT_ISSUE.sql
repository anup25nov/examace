-- Fix the constraint issue for test_completions table
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what constraints actually exist
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

-- 3. If there's a problematic unique index, we might need to drop and recreate it
-- First, let's see if we can identify the problematic index
SELECT 
  i.relname as index_name,
  a.attname as column_name,
  ix.indisunique as is_unique,
  ix.indisprimary as is_primary
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname = 'test_completions'
  AND ix.indisunique = true;

-- 4. If the constraint is causing issues, we can try to drop and recreate it
-- WARNING: This will drop the existing constraint/index
-- Uncomment the lines below if needed:

-- DROP INDEX IF EXISTS idx_test_completions_unique;

-- 5. Create a proper unique constraint that handles NULL values correctly
-- This creates a unique constraint that treats NULL values as distinct
-- ALTER TABLE test_completions 
-- ADD CONSTRAINT test_completions_unique 
-- UNIQUE (user_id, exam_id, test_type, test_id, topic_id);

-- 6. Alternative: Create a partial unique index that handles NULLs properly
-- This is often better for handling NULL values in unique constraints
-- CREATE UNIQUE INDEX test_completions_unique_partial 
-- ON test_completions (user_id, exam_id, test_type, test_id, topic_id)
-- WHERE topic_id IS NOT NULL;

-- CREATE UNIQUE INDEX test_completions_unique_null 
-- ON test_completions (user_id, exam_id, test_type, test_id)
-- WHERE topic_id IS NULL;

-- 7. Or create a single unique index that handles NULLs properly
-- CREATE UNIQUE INDEX test_completions_unique_proper
-- ON test_completions (user_id, exam_id, test_type, test_id, COALESCE(topic_id, ''));

-- 8. Check the current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'test_completions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
