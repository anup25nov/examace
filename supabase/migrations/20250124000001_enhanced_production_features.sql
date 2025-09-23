-- Enhanced Production Features Migration
-- This migration adds tables and functions for production-ready features

-- 1. Create test_states table for test state recovery
CREATE TABLE IF NOT EXISTS test_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    exam_id VARCHAR(50) NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    test_type VARCHAR(20) NOT NULL,
    test_id VARCHAR(100) NOT NULL,
    current_question INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    time_left INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    flagged_questions INTEGER[] DEFAULT '{}',
    selected_language VARCHAR(10) DEFAULT 'english',
    is_completed BOOLEAN DEFAULT FALSE,
    state_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for test_states
CREATE INDEX IF NOT EXISTS idx_test_states_user_id ON test_states(user_id);
CREATE INDEX IF NOT EXISTS idx_test_states_exam_section ON test_states(exam_id, section_id);
CREATE INDEX IF NOT EXISTS idx_test_states_test_info ON test_states(test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_test_states_updated_at ON test_states(updated_at);

-- 2. Create payment_rollbacks table for payment rollback tracking
CREATE TABLE IF NOT EXISTS payment_rollbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    message TEXT,
    restored_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_rollbacks
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_user_id ON payment_rollbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_payment_id ON payment_rollbacks(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_rollbacks_created_at ON payment_rollbacks(created_at);

-- 3. Create performance_metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20) NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- 4. Create function to rollback payment transaction
CREATE OR REPLACE FUNCTION rollback_payment_transaction(
    p_payment_id UUID,
    p_user_id UUID,
    p_plan_id VARCHAR(50),
    p_reason TEXT
)
RETURNS TABLE(
    rollback_id UUID,
    restored_data JSONB
) AS $$
DECLARE
    payment_record RECORD;
    membership_record RECORD;
    rollback_id UUID;
    restored_data JSONB;
BEGIN
    -- Get payment record
    SELECT * INTO payment_record
    FROM membership_transactions
    WHERE id = p_payment_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found';
    END IF;

    -- Get membership record
    SELECT * INTO membership_record
    FROM user_memberships
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

    -- Start transaction
    BEGIN
        -- Update payment status to cancelled
        UPDATE membership_transactions
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = p_payment_id;

        -- Deactivate membership if exists
        IF FOUND THEN
            UPDATE user_memberships
            SET status = 'cancelled',
                updated_at = NOW()
            WHERE id = membership_record.id;
        END IF;

        -- Restore user profile to free plan
        UPDATE user_profiles
        SET membership_plan = 'free',
            membership_status = 'inactive',
            membership_expiry = NULL,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- Create rollback record
        INSERT INTO payment_rollbacks (
            payment_id, user_id, plan_id, amount, reason, success, message
        ) VALUES (
            p_payment_id, p_user_id, p_plan_id, payment_record.amount, p_reason, TRUE, 'Payment rollback completed successfully'
        ) RETURNING id INTO rollback_id;

        -- Prepare restored data
        restored_data := jsonb_build_object(
            'original_plan', 'free',
            'membership_cancelled', membership_record.id IS NOT NULL,
            'rollback_timestamp', NOW()
        );

        RETURN QUERY SELECT rollback_id, restored_data;

    EXCEPTION
        WHEN OTHERS THEN
            -- Log rollback failure
            INSERT INTO payment_rollbacks (
                payment_id, user_id, plan_id, amount, reason, success, message
            ) VALUES (
                p_payment_id, p_user_id, p_plan_id, payment_record.amount, p_reason, FALSE, SQLERRM
            );
            
            RAISE EXCEPTION 'Rollback failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to clean up old test states
CREATE OR REPLACE FUNCTION cleanup_old_test_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete test states older than 7 days
    DELETE FROM test_states
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get test recovery statistics
CREATE OR REPLACE FUNCTION get_test_recovery_stats(p_user_id UUID)
RETURNS TABLE(
    total_incomplete INTEGER,
    recent_recoveries INTEGER,
    average_recovery_time DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_incomplete,
        COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END)::INTEGER as recent_recoveries,
        COALESCE(AVG(time_left), 0) as average_recovery_time
    FROM test_states
    WHERE user_id = p_user_id 
    AND is_completed = FALSE
    AND updated_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get performance metrics summary
CREATE OR REPLACE FUNCTION get_performance_metrics_summary(
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
    metric_name VARCHAR(100),
    avg_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    min_value DECIMAL(10,4),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.metric_name,
        AVG(pm.metric_value) as avg_value,
        MAX(pm.metric_value) as max_value,
        MIN(pm.metric_value) as min_value,
        COUNT(*) as count
    FROM performance_metrics pm
    WHERE pm.created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY pm.metric_name
    ORDER BY avg_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_states TO authenticated;
GRANT SELECT, INSERT ON payment_rollbacks TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;

GRANT EXECUTE ON FUNCTION rollback_payment_transaction(UUID, UUID, VARCHAR(50), TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_test_states() TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_recovery_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_metrics_summary(INTEGER) TO authenticated;

-- 9. Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_old_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up old test states (run every 1000 inserts)
    IF (SELECT COUNT(*) FROM test_states) % 1000 = 0 THEN
        PERFORM cleanup_old_test_states();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_old_data_trigger
    AFTER INSERT ON test_states
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_old_data();

-- 10. Add RLS policies
ALTER TABLE test_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_rollbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Test states policies
CREATE POLICY "Users can manage their own test states" ON test_states
    FOR ALL USING (user_id = auth.uid());

-- Payment rollbacks policies
CREATE POLICY "Users can view their own rollbacks" ON payment_rollbacks
    FOR SELECT USING (user_id = auth.uid());

-- Performance metrics policies (read-only for users)
CREATE POLICY "Users can view performance metrics" ON performance_metrics
    FOR SELECT USING (true);

-- 11. Create view for test recovery dashboard
CREATE OR REPLACE VIEW test_recovery_dashboard AS
SELECT 
    ts.user_id,
    up.phone,
    ts.exam_id,
    ts.section_id,
    ts.test_type,
    ts.test_id,
    ts.current_question,
    ts.time_left,
    ts.is_completed,
    ts.updated_at as last_activity,
    EXTRACT(EPOCH FROM (NOW() - ts.updated_at))/3600 as hours_since_activity
FROM test_states ts
JOIN user_profiles up ON ts.user_id = up.id
WHERE ts.is_completed = FALSE
ORDER BY ts.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON test_recovery_dashboard TO authenticated;

-- 12. Create function to get system health metrics
CREATE OR REPLACE FUNCTION get_system_health_metrics()
RETURNS TABLE(
    metric_name TEXT,
    metric_value DECIMAL(10,4),
    status TEXT,
    threshold DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT 
            'error_rate' as metric_name,
            (COUNT(CASE WHEN success = FALSE THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) as metric_value,
            CASE 
                WHEN (COUNT(CASE WHEN success = FALSE THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) > 10 THEN 'critical'
                WHEN (COUNT(CASE WHEN success = FALSE THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100) > 5 THEN 'warning'
                ELSE 'healthy'
            END as status,
            10.0 as threshold
        FROM security_audit_log
        WHERE created_at > NOW() - INTERVAL '1 hour'
        
        UNION ALL
        
        SELECT 
            'avg_response_time' as metric_name,
            AVG(metric_value) as metric_value,
            CASE 
                WHEN AVG(metric_value) > 5000 THEN 'critical'
                WHEN AVG(metric_value) > 2000 THEN 'warning'
                ELSE 'healthy'
            END as status,
            2000.0 as threshold
        FROM performance_metrics
        WHERE metric_name LIKE 'api_%' 
        AND created_at > NOW() - INTERVAL '1 hour'
        
        UNION ALL
        
        SELECT 
            'active_test_sessions' as metric_name,
            COUNT(*)::DECIMAL as metric_value,
            CASE 
                WHEN COUNT(*) > 1000 THEN 'critical'
                WHEN COUNT(*) > 500 THEN 'warning'
                ELSE 'healthy'
            END as status,
            500.0 as threshold
        FROM test_states
        WHERE is_completed = FALSE
        AND updated_at > NOW() - INTERVAL '1 hour'
    )
    SELECT * FROM metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_system_health_metrics() TO authenticated;
