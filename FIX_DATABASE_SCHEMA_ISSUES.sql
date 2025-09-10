-- Fix Database Schema Issues
-- This script fixes the missing columns and schema issues

-- 1. Add missing columns to payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Update existing payments records to have updated_at
UPDATE public.payments 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. Create index on updated_at for better performance
CREATE INDEX IF NOT EXISTS idx_payments_updated_at ON public.payments(updated_at);

-- 4. Fix referral_codes table structure (if needed)
-- Check if referral_codes table exists and has correct structure
DO $$ 
BEGIN
    -- Add missing columns to referral_codes if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_codes' AND column_name = 'is_active') THEN
        ALTER TABLE public.referral_codes ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_codes' AND column_name = 'created_at') THEN
        ALTER TABLE public.referral_codes ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_codes' AND column_name = 'updated_at') THEN
        ALTER TABLE public.referral_codes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. Update existing referral_codes records
UPDATE public.referral_codes 
SET is_active = true 
WHERE is_active IS NULL;

UPDATE public.referral_codes 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE public.referral_codes 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON public.referral_codes(is_active);

-- 7. Add RLS policies if they don't exist
DO $$ 
BEGIN
    -- Payments table RLS policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view their own payments') THEN
        CREATE POLICY "Users can view their own payments" ON public.payments
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert their own payments') THEN
        CREATE POLICY "Users can insert their own payments" ON public.payments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update their own payments') THEN
        CREATE POLICY "Users can update their own payments" ON public.payments
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Referral codes table RLS policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can view their own referral codes') THEN
        CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can insert their own referral codes') THEN
        CREATE POLICY "Users can insert their own referral codes" ON public.referral_codes
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can update their own referral codes') THEN
        CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.referral_codes TO authenticated;

-- 9. Success message
SELECT 'Database schema issues fixed successfully!' as message;
