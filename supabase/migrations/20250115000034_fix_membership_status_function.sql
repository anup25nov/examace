-- Fix membership status function to work with both old and new payment systems
-- This function checks both user_memberships (old) and memberships (new) tables

CREATE OR REPLACE FUNCTION public.get_user_membership_status(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result JSONB;
    v_old_membership RECORD;
    v_new_membership RECORD;
    v_plan_name TEXT;
    v_mock_tests INTEGER;
BEGIN
    -- Check old system (user_memberships + membership_plans)
    SELECT 
        um.plan_id,
        um.end_date,
        um.status,
        mp.name as plan_name,
        mp.mock_tests
    INTO v_old_membership
    FROM user_profiles up
    LEFT JOIN user_memberships um ON up.id = um.user_id AND um.status = 'active'
    LEFT JOIN membership_plans mp ON um.plan_id = mp.id
    WHERE up.id = user_uuid;

    -- Check new system (memberships table)
    SELECT 
        m.plan,
        m.end_date,
        m.mocks_used,
        CASE 
            WHEN m.plan = 'pro' THEN 'Pro Plan'
            WHEN m.plan = 'pro_plus' THEN 'Pro Plus Plan'
            ELSE 'Unknown Plan'
        END as plan_name,
        CASE 
            WHEN m.plan = 'pro' THEN 3
            WHEN m.plan = 'pro_plus' THEN 5
            ELSE 0
        END as mock_tests
    INTO v_new_membership
    FROM memberships m
    WHERE m.user_id = user_uuid;

    -- Determine which membership is active and more recent
    IF v_old_membership.plan_id IS NOT NULL AND v_old_membership.end_date > NOW() THEN
        -- Old system membership is active
        v_plan_name := v_old_membership.plan_name;
        v_mock_tests := v_old_membership.mock_tests;
        
        SELECT json_build_object(
            'has_active_membership', true,
            'current_plan', v_old_membership.plan_id,
            'expires_at', v_old_membership.end_date,
            'days_remaining', EXTRACT(DAY FROM (v_old_membership.end_date - NOW()))::INTEGER,
            'tests_available', v_mock_tests,
            'plan_name', v_plan_name,
            'system', 'old'
        ) INTO v_result;
        
    ELSIF v_new_membership.plan IS NOT NULL AND v_new_membership.end_date > NOW() THEN
        -- New system membership is active
        v_plan_name := v_new_membership.plan_name;
        v_mock_tests := v_new_membership.mock_tests;
        
        SELECT json_build_object(
            'has_active_membership', true,
            'current_plan', v_new_membership.plan,
            'expires_at', v_new_membership.end_date,
            'days_remaining', EXTRACT(DAY FROM (v_new_membership.end_date - NOW()))::INTEGER,
            'tests_available', v_mock_tests,
            'plan_name', v_plan_name,
            'system', 'new'
        ) INTO v_result;
        
    ELSE
        -- No active membership
        SELECT json_build_object(
            'has_active_membership', false,
            'current_plan', 'free',
            'expires_at', null,
            'days_remaining', 0,
            'tests_available', 0,
            'plan_name', 'Free Plan',
            'system', 'none'
        ) INTO v_result;
    END IF;

    RETURN COALESCE(v_result, json_build_object(
        'has_active_membership', false,
        'current_plan', 'free',
        'expires_at', null,
        'days_remaining', 0,
        'tests_available', 0,
        'plan_name', 'Free Plan',
        'system', 'none'
    ));
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_membership_status(uuid) TO authenticated, anon;
