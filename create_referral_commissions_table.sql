-- Create referral_commissions table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- 1. Check if table exists
SELECT '=== CHECKING REFERRAL_COMMISSIONS TABLE ===' as step;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'referral_commissions';

-- 2. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_id ON referral_commissions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_created_at ON referral_commissions(created_at);

-- 4. Add RLS policies
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own commissions" ON referral_commissions;
DROP POLICY IF EXISTS "Service role can manage all commissions" ON referral_commissions;

-- Policy for users to view their own commissions
CREATE POLICY "Users can view their own commissions" ON referral_commissions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Policy for service role to manage all commissions
CREATE POLICY "Service role can manage all commissions" ON referral_commissions
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Check final table structure
SELECT '=== FINAL TABLE STRUCTURE ===' as step;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'referral_commissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Referral commissions table created successfully!' as status;
