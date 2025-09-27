-- Fix Foreign Key Constraint Issue
-- Remove unnecessary foreign key constraint from user_profiles table
-- We don't need a separate users table since user_profiles contains all user data

-- Drop the foreign key constraint that references non-existent users table
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_id_fkey' 
        AND table_name = 'user_profiles'
    ) THEN
        -- Drop the foreign key constraint
        ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_id_fkey;
        RAISE NOTICE 'Foreign key constraint user_profiles_id_fkey dropped successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint user_profiles_id_fkey does not exist';
    END IF;
END $$;

-- Ensure user_profiles table has proper RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profiles table
CREATE POLICY "Users can view their own profiles" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
