-- Fix plan_name being null in payments table
-- Update existing records with null plan_name

UPDATE payments 
SET plan_name = CASE 
  WHEN plan_id = 'pro' THEN 'Pro Plan'
  WHEN plan_id = 'pro_plus' THEN 'Pro Plus Plan'
  WHEN plan_id = 'free' THEN 'Free Plan'
  ELSE plan_id
END
WHERE plan_name IS NULL;

-- Add constraint to prevent future null plan_name
ALTER TABLE payments 
ALTER COLUMN plan_name SET NOT NULL;

-- Add default value for plan_name based on plan_id
CREATE OR REPLACE FUNCTION set_plan_name_from_plan_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_name IS NULL THEN
    NEW.plan_name := CASE 
      WHEN NEW.plan_id = 'pro' THEN 'Pro Plan'
      WHEN NEW.plan_id = 'pro_plus' THEN 'Pro Plus Plan'
      WHEN NEW.plan_id = 'free' THEN 'Free Plan'
      ELSE NEW.plan_id
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set plan_name
DROP TRIGGER IF EXISTS set_plan_name_trigger ON payments;
CREATE TRIGGER set_plan_name_trigger
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_plan_name_from_plan_id();
