-- Add Missing Columns to user_profiles
-- Run this in Supabase SQL Editor

-- Add total_referral_earnings column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS total_referral_earnings numeric(10,2) DEFAULT 0;

-- Add other referral-related columns if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referred_by text,
ADD COLUMN IF NOT EXISTS referral_code_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS referral_code_used text,
ADD COLUMN IF NOT EXISTS referral_applied_at timestamp with time zone;

-- Add comments
COMMENT ON COLUMN public.user_profiles.total_referral_earnings IS 'Total earnings from referrals';
COMMENT ON COLUMN public.user_profiles.referred_by IS 'Referral code used by this user';
COMMENT ON COLUMN public.user_profiles.referral_code_applied IS 'Whether user has applied a referral code';
COMMENT ON COLUMN public.user_profiles.referral_code_used IS 'The referral code this user used';
COMMENT ON COLUMN public.user_profiles.referral_applied_at IS 'When the referral code was applied';

-- Update existing records to have default values
UPDATE public.user_profiles 
SET 
    total_referral_earnings = 0,
    referral_code_applied = false
WHERE total_referral_earnings IS NULL;

-- Success message
SELECT 'Missing columns added to user_profiles! ✅' as message;
