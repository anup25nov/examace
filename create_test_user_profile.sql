-- Create Test User Profile for Referral Testing
-- Run this in Supabase SQL Editor

-- First, let's check the actual schema
SELECT 
    'USER_PROFILES COLUMNS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create a test user profile for the referred user
INSERT INTO public.user_profiles (
    id,
    phone,
    name,
    email
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '+919999999999',
    'Test Referred User',
    'test-referred@example.com'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Verify the user profile was created
SELECT 
    'TEST USER PROFILE CREATED:' as status,
    id,
    name,
    phone,
    email,
    created_at
FROM public.user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Success message
SELECT 'Test user profile created successfully! ✅' as message;