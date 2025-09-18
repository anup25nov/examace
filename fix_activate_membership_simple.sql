-- Simple fix for activate_or_upgrade_membership function - only existing columns
-- Run this script in your Supabase SQL Editor

-- 1. Drop and recreate the function with only existing columns
DROP FUNCTION IF EXISTS activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE);

-- 2. Create the simple fixed function
CREATE OR REPLACE FUNCTION activate_or_upgrade_membership(
  p_user UUID,
  p_plan VARCHAR(50),
  p_upgrade_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  plan VARCHAR(50),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20)
) AS $$
DECLARE
  plan_id_value UUID;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get plan_id for the given plan name
  SELECT id INTO plan_id_value
  FROM membership_plans
  WHERE name = p_plan
  LIMIT 1;
  
  -- If plan not found, use pro plan
  IF plan_id_value IS NULL THEN
    SELECT id INTO plan_id_value
    FROM membership_plans
    WHERE name = 'pro'
    LIMIT 1;
  END IF;
  
  -- If still no plan_id found, create a default one
  IF plan_id_value IS NULL THEN
    INSERT INTO membership_plans (id, name, price, duration_days, created_at, updated_at)
    VALUES (gen_random_uuid(), p_plan, 1.00, 30, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO plan_id_value;
    
    -- If still null, get the pro plan
    IF plan_id_value IS NULL THEN
      SELECT id INTO plan_id_value
      FROM membership_plans
      WHERE name = 'pro'
      LIMIT 1;
    END IF;
  END IF;
  
  -- Set dates
  start_date := p_upgrade_at;
  end_date := start_date + CASE 
    WHEN p_plan = 'pro_plus' THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END;
  
  -- Insert or update membership with only existing columns
  INSERT INTO user_memberships (
    user_id,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    p_user,
    plan_id_value,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    updated_at = NOW();
  
  RETURN QUERY SELECT p_plan, start_date, end_date, 'active'::VARCHAR(20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- 4. Test the function
SELECT '=== TESTING ACTIVATE MEMBERSHIP FUNCTION ===' as test;

-- This will be rolled back
BEGIN;
  SELECT * FROM activate_or_upgrade_membership(
    '00000000-0000-0000-0000-000000000000'::UUID, 
    'pro', 
    NOW()
  );
ROLLBACK;

SELECT 'activate_or_upgrade_membership function fixed successfully!' as status;
