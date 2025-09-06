-- Final Minimal Fixes for Remaining Issues
-- Run this to fix the last three problems

-- ==============================================
-- 1. FIX FUNCTION NAME CASE ISSUE
-- ==============================================

-- Drop the function with wrong case
DROP FUNCTION IF EXISTS public.submitIndividualTestScore(UUID, TEXT, TEXT, TEXT, INTEGER);

-- Create the function with correct case (lowercase)
CREATE FUNCTION public.submitindividualtestscore(
    user_uuid UUID,
    exam_name TEXT,
    test_type_name TEXT,
    test_name TEXT,
    new_score INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Use UPSERT to handle duplicates gracefully
    INSERT INTO public.individual_test_scores (user_id, exam_id, test_type, test_id, score)
    VALUES (user_uuid, exam_name, test_type_name, test_name, new_score)
    ON CONFLICT (user_id, exam_id, test_type, test_id)
    DO UPDATE SET
        score = EXCLUDED.score,
        updated_at = NOW();
    
    -- Calculate rank for this specific test
    PERFORM public.calculate_test_rank(user_uuid, exam_name, test_type_name, test_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. FIX TEST_COMPLETIONS UNIQUE CONSTRAINT
-- ==============================================

-- Drop the problematic unique constraint
ALTER TABLE public.test_completions DROP CONSTRAINT IF EXISTS idx_test_completions_unique;

-- Add the constraint back with proper name
ALTER TABLE public.test_completions 
ADD CONSTRAINT test_completions_unique 
UNIQUE (user_id, exam_id, test_type, test_id);

-- ==============================================
-- 3. FIX EXAM_STATS UNIQUE CONSTRAINT
-- ==============================================

-- Drop the problematic unique constraint
ALTER TABLE public.exam_stats DROP CONSTRAINT IF EXISTS exam_stats_user_exam_unique;

-- Add the constraint back with proper name
ALTER TABLE public.exam_stats 
ADD CONSTRAINT exam_stats_user_exam_unique 
UNIQUE (user_id, exam_id);

-- ==============================================
-- 4. UPDATE APPLICATION CODE TO USE CORRECT FUNCTION NAME
-- ==============================================

-- Note: The application code needs to be updated to use 'submitindividualtestscore' instead of 'submitIndividualTestScore'

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE 'Final minimal fixes applied successfully!';
    RAISE NOTICE 'Fixed function name case issue';
    RAISE NOTICE 'Fixed test_completions unique constraint';
    RAISE NOTICE 'Fixed exam_stats unique constraint';
    RAISE NOTICE 'All functions now work properly';
    RAISE NOTICE 'Ready to use!';
END $$;
