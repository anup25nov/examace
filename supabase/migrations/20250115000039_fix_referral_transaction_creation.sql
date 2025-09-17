-- Fix referral transaction creation to ensure proper referrer_id
-- This migration ensures referral transactions are created with correct referrer_id

-- Step 1: Create a function to properly create referral transactions
CREATE OR REPLACE FUNCTION create_referral_transaction(
  p_referrer_id UUID,
  p_referred_id UUID,
  p_referral_code TEXT,
  p_amount DECIMAL(10,2),
  p_transaction_type TEXT DEFAULT 'membership',
  p_membership_purchased BOOLEAN DEFAULT true,
  p_first_membership_only BOOLEAN DEFAULT true
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  transaction_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  transaction_id_val UUID;
  commission_amount_val DECIMAL(10,2);
BEGIN
  -- Calculate commission amount (50% of membership amount)
  commission_amount_val := p_amount * 0.50;
  
  -- Generate transaction ID
  transaction_id_val := gen_random_uuid();
  
  -- Insert referral transaction
  INSERT INTO referral_transactions (
    id,
    referrer_id,
    referred_id,
    referral_code,
    amount,
    transaction_type,
    status,
    commission_amount,
    commission_status,
    membership_purchased,
    first_membership_only,
    created_at,
    updated_at
  ) VALUES (
    transaction_id_val,
    p_referrer_id,
    p_referred_id,
    p_referral_code,
    p_amount,
    p_transaction_type,
    'completed',
    commission_amount_val,
    'pending',
    p_membership_purchased,
    p_first_membership_only,
    NOW(),
    NOW()
  );
  
  RETURN QUERY SELECT true, 'Referral transaction created successfully', transaction_id_val;
END;
$$;

-- Step 2: Create a function to fix existing referral transactions with missing referrer_id
CREATE OR REPLACE FUNCTION fix_referral_transactions()
RETURNS TABLE(
  fixed_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  fixed_count_val INTEGER := 0;
  transaction_record RECORD;
  referrer_id_val UUID;
BEGIN
  -- Fix referral transactions with missing referrer_id
  FOR transaction_record IN
    SELECT 
      rt.id,
      rt.referred_id,
      rt.referral_code,
      rt.amount,
      rt.commission_amount
    FROM referral_transactions rt
    WHERE rt.referrer_id IS NULL
      AND rt.referral_code IS NOT NULL
  LOOP
    -- Find referrer by referral code
    SELECT user_id INTO referrer_id_val
    FROM referral_codes
    WHERE code = transaction_record.referral_code
    LIMIT 1;
    
    -- Update transaction with correct referrer_id
    IF referrer_id_val IS NOT NULL THEN
      UPDATE referral_transactions
      SET 
        referrer_id = referrer_id_val,
        updated_at = NOW()
      WHERE id = transaction_record.id;
      
      fixed_count_val := fixed_count_val + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT fixed_count_val, 'Fixed ' || fixed_count_val || ' referral transactions';
END;
$$;

-- Step 3: Run the fix function
SELECT * FROM fix_referral_transactions();

-- Step 4: Create a trigger to automatically create referral transactions when payments are made
CREATE OR REPLACE FUNCTION create_referral_transaction_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  referrer_id_val UUID;
  referral_code_val TEXT;
  plan_amount_val DECIMAL(10,2);
BEGIN
  -- Only process completed payments
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Find referrer through user_profiles
  SELECT 
    up.referred_by,
    rc.code
  INTO 
    referral_code_val,
    referral_code_val
  FROM user_profiles up
  LEFT JOIN referral_codes rc ON up.referred_by = rc.code
  WHERE up.id = NEW.user_id
    AND up.referred_by IS NOT NULL;
  
  -- If no referral found, return
  IF referral_code_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get referrer_id
  SELECT user_id INTO referrer_id_val
  FROM referral_codes
  WHERE code = referral_code_val
  LIMIT 1;
  
  -- If referrer not found, return
  IF referrer_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate plan amount
  plan_amount_val := NEW.amount;
  
  -- Create referral transaction
  PERFORM create_referral_transaction(
    referrer_id_val,
    NEW.user_id,
    referral_code_val,
    plan_amount_val,
    'membership',
    true,
    true
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_referral_transaction_on_payment ON payments;

-- Create trigger
CREATE TRIGGER trigger_create_referral_transaction_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_transaction_on_payment();
