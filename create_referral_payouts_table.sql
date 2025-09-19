-- Create referral_payouts table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'referral_payouts'
) as table_exists;

-- Create referral_payouts table
CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL,
  account_details TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  admin_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES user_profiles(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_payouts_user_id ON referral_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_status ON referral_payouts(status);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_created_at ON referral_payouts(created_at);

-- Enable RLS
ALTER TABLE referral_payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own payouts" ON referral_payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own payout requests" ON referral_payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON referral_payouts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the table
SELECT 'referral_payouts table created successfully' as status;
