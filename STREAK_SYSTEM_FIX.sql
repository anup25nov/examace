-- STREAK SYSTEM FIX
-- This script fixes the streak logic and integrates with daily visits

-- ==============================================
-- 1. CREATE OR REPLACE USER STREAKS TABLE
-- ==============================================

-- Create user_streaks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_tests_taken INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON public.user_streaks;

CREATE POLICY "Users can view own streaks" ON public.user_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- 2. CREATE STREAK FUNCTIONS
-- ==============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_user_streak_from_visit(UUID);
DROP FUNCTION IF EXISTS public.get_or_create_user_streak(UUID);
DROP FUNCTION IF EXISTS public.update_daily_visit_and_streak(UUID);

-- Function to update user streak based on daily visits
CREATE OR REPLACE FUNCTION public.update_user_streak_from_visit(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_current_streak INTEGER := 0;
    v_longest_streak INTEGER := 0;
    v_total_tests INTEGER := 0;
    v_last_activity_date DATE;
    v_today DATE := CURRENT_DATE;
    v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
    v_days_consecutive INTEGER := 0;
BEGIN
    -- Get current streak data
    SELECT 
        current_streak,
        longest_streak,
        total_tests_taken,
        last_activity_date
    INTO v_current_streak, v_longest_streak, v_total_tests, v_last_activity_date
    FROM public.user_streaks
    WHERE user_id = user_uuid;

    -- If no streak record exists, create one
    IF v_current_streak IS NULL THEN
        v_current_streak := 1;
        v_longest_streak := 1;
        v_total_tests := 1;
        v_last_activity_date := v_today;
    ELSE
        -- Check if user already has activity today
        IF v_last_activity_date = v_today THEN
            -- Already counted today, just return current data
            SELECT to_jsonb(us.*) INTO v_result
            FROM public.user_streaks us
            WHERE us.user_id = user_uuid;
            RETURN v_result;
        END IF;

        -- Calculate consecutive days from daily_visits table
        SELECT COUNT(*) INTO v_days_consecutive
        FROM public.daily_visits
        WHERE user_id = user_uuid
        AND visit_date >= v_today - INTERVAL '30 days'  -- Check last 30 days
        ORDER BY visit_date DESC;

        -- If last activity was yesterday, increment streak
        IF v_last_activity_date = v_yesterday THEN
            v_current_streak := v_current_streak + 1;
        ELSE
            -- Streak broken, reset to 1
            v_current_streak := 1;
        END IF;

        -- Update longest streak if current is higher
        IF v_current_streak > v_longest_streak THEN
            v_longest_streak := v_current_streak;
        END IF;

        v_total_tests := v_total_tests + 1;
        v_last_activity_date := v_today;
    END IF;

    -- Insert or update user streak
    INSERT INTO public.user_streaks (
        user_id, 
        current_streak, 
        longest_streak, 
        total_tests_taken, 
        last_activity_date
    )
    VALUES (
        user_uuid, 
        v_current_streak, 
        v_longest_streak, 
        v_total_tests, 
        v_last_activity_date
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = EXCLUDED.longest_streak,
        total_tests_taken = EXCLUDED.total_tests_taken,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at = NOW();

    -- Return the result
    SELECT to_jsonb(us.*) INTO v_result
    FROM public.user_streaks us
    WHERE us.user_id = user_uuid;
    
    RETURN v_result;
END;
$$;

-- Function to get or create user streak
CREATE OR REPLACE FUNCTION public.get_or_create_user_streak(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    current_streak INTEGER,
    longest_streak INTEGER,
    total_tests_taken INTEGER,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- First, update streak based on daily visits
    PERFORM public.update_user_streak_from_visit(user_uuid);
    
    -- Then return the streak data
    RETURN QUERY
    SELECT 
        us.id,
        us.user_id,
        us.current_streak,
        us.longest_streak,
        us.total_tests_taken,
        us.last_activity_date,
        us.created_at,
        us.updated_at
    FROM public.user_streaks us
    WHERE us.user_id = user_uuid;
END;
$$;

-- Function to update streak when user visits
CREATE OR REPLACE FUNCTION public.update_daily_visit_and_streak(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Insert daily visit
    INSERT INTO public.daily_visits (user_id, visit_date)
    VALUES (user_uuid, v_today)
    ON CONFLICT (user_id, visit_date) DO NOTHING;
    
    -- Update streak
    SELECT public.update_user_streak_from_visit(user_uuid) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- ==============================================
-- 3. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);

-- ==============================================
-- 4. GRANT PERMISSIONS
-- ==============================================

GRANT ALL ON public.user_streaks TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak_from_visit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_visit_and_streak(UUID) TO authenticated;

-- ==============================================
-- 5. VERIFICATION
-- ==============================================

SELECT 
    'Streak system setup completed!' as status,
    'All functions, tables, and policies have been created.' as message;
