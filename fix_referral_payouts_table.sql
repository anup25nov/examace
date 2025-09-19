-- Fix referral_payouts table and policies
-- Run this in your Supabase SQL Editor

-- 1. First, let's check the current structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'referral_payouts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add account_details column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'account_details'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN account_details TEXT;
  END IF;
  
  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN payment_method VARCHAR(50);
  END IF;
  
  -- Add admin_notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN admin_notes TEXT;
  END IF;
  
  -- Add approved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add approved_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN approved_by UUID REFERENCES user_profiles(id);
  END IF;
  
  -- Add rejected_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add rejected_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN rejected_by UUID REFERENCES user_profiles(id);
  END IF;
  
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_payouts' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE referral_payouts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payouts" ON referral_payouts;
DROP POLICY IF EXISTS "Users can create their own payout requests" ON referral_payouts;

-- 4. Create policies (without IF NOT EXISTS)
CREATE POLICY "Users can view their own payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payout requests" ON referral_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Test the table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'referral_payouts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test the withdrawal function
SELECT * FROM request_commission_withdrawal(
  'fbc97816-07ed-4e21-bc45-219dbfdc4cec',
  0.30,
  'bank_transfer',
  'Test Bank Account: 1234567890'
);
