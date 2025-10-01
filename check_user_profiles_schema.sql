-- Check user_profiles table schema
-- Run this in Supabase SQL Editor

-- Show all columns in user_profiles table
SELECT 
    'USER_PROFILES COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
