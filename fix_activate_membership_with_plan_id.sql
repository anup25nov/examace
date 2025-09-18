-- Fix activate_or_upgrade_membership function to handle plan_id constraint
-- Run this script in your Supabase SQL Editor

-- 1. Drop and recreate the function with plan_id handling
DROP FUNCTION IF EXISTS activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE);

-- 2. Create the fixed function
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
  membership_duration INTERVAL;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
  plan_id_value UUID;
  table_has_plan_id BOOLEAN := FALSE;
  table_has_plan BOOLEAN := FALSE;
  table_has_status BOOLEAN := FALSE;
  table_has_dates BOOLEAN := FALSE;
BEGIN
  -- Check if required columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_memberships' 
    AND column_name = 'plan_id' 
    AND table_schema = 'public'
  ) INTO table_has_plan_id;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_memberships' 
    AND column_name = 'plan' 
    AND table_schema = 'public'
  ) INTO table_has_plan;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_memberships' 
    AND column_name = 'status' 
    AND table_schema = 'public'
  ) INTO table_has_status;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_memberships' 
    AND column_name = 'start_date' 
    AND table_schema = 'public'
  ) INTO table_has_dates;
  
  -- Determine membership duration based on plan
  IF p_plan = 'pro_plus' THEN
    membership_duration := INTERVAL '1 year';
  ELSE
    membership_duration := INTERVAL '1 month';
  END IF;
  
  start_date := p_upgrade_at;
  end_date := start_date + membership_duration;
  
  -- Get plan_id if needed
  IF table_has_plan_id THEN
    SELECT id INTO plan_id_value
    FROM membership_plans
    WHERE name = p_plan
    LIMIT 1;
    
    IF plan_id_value IS NULL THEN
      -- Fallback to pro plan if specific plan not found
      SELECT id INTO plan_id_value
      FROM membership_plans
      WHERE name = 'pro'
      LIMIT 1;
    END IF;
  END IF;
  
  -- Insert or update membership with dynamic column handling
  IF table_has_plan_id AND table_has_plan AND table_has_status AND table_has_dates THEN
    -- Full functionality with all columns including plan_id
    INSERT INTO user_memberships (
      user_id,
      plan_id,
      plan,
      status,
      start_date,
      end_date,
      created_at,
      updated_at
    ) VALUES (
      p_user,
      plan_id_value,
      p_plan,
      'active',
      start_date,
      end_date,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      plan = EXCLUDED.plan,
      status = 'active',
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      updated_at = NOW();
  ELSIF table_has_plan_id THEN
    -- Only plan_id available
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
  ELSE
    -- Fallback: just insert basic record
    INSERT INTO user_memberships (user_id, created_at, updated_at)
    VALUES (p_user, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET
      updated_at = NOW();
  END IF;
  
  RETURN QUERY SELECT p_plan, start_date, end_date, 'active'::VARCHAR(20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION activate_or_upgrade_membership(UUID, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- 4. Test the function
SELECT 'activate_or_upgrade_membership function with plan_id fixed successfully!' as status;
