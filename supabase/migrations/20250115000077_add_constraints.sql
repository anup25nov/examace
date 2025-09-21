-- Add Constraints Migration
-- This migration adds constraints after data cleanup

-- 1. Add constraints to prevent future exam record issues
ALTER TABLE exam_stats 
ADD CONSTRAINT check_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

-- 2. Add similar constraints to other tables
ALTER TABLE test_completions 
ADD CONSTRAINT check_test_completions_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

ALTER TABLE test_attempts 
ADD CONSTRAINT check_test_attempts_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

ALTER TABLE individual_test_scores 
ADD CONSTRAINT check_individual_test_scores_exam_id_valid 
CHECK (exam_id IN ('ssc-cgl', 'ssc-chsl', 'ssc-mts', 'ssc-cpo', 'airforce', 'navy', 'army'));

-- 3. Create analysis functions
CREATE OR REPLACE FUNCTION get_table_usage()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    can_drop BOOLEAN,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.n_live_tup,
        CASE 
            WHEN t.n_live_tup = 0 THEN true
            WHEN t.tablename IN ('question_images', 'admin_users') AND t.n_live_tup < 5 THEN true
            ELSE false
        END as can_drop,
        CASE 
            WHEN t.n_live_tup = 0 THEN 'Empty table'
            WHEN t.tablename = 'question_images' AND t.n_live_tup < 5 THEN 'Unused feature table'
            WHEN t.tablename = 'admin_users' AND t.n_live_tup < 5 THEN 'Unused admin table'
            ELSE 'Table in use'
        END::TEXT as reason
    FROM pg_stat_user_tables t
    ORDER BY t.n_live_tup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_table_usage() TO authenticated;
