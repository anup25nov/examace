-- REFERRAL SYSTEM SETUP
-- Secure referral system with user mapping and earnings

-- ==============================================
-- 1. CREATE REFERRAL TABLES
-- ==============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.referral_mappings CASCADE;
DROP TABLE IF EXISTS public.referral_earnings CASCADE;
DROP TABLE IF EXISTS public.referral_transactions CASCADE;

-- Create referral_mappings table
CREATE TABLE public.referral_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id) -- Each user can only be referred once
);

-- Create referral_earnings table
CREATE TABLE public.referral_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID, -- Reference to payment/membership transaction
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL, -- Configurable percentage (e.g., 50.00 for 50%)
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create referral_transactions table for audit trail
CREATE TABLE public.referral_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- signup, purchase, membership
    amount DECIMAL(10,2) NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    metadata JSONB, -- Additional transaction details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ENABLE RLS
-- ==============================================

ALTER TABLE public.referral_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. CREATE RLS POLICIES
-- ==============================================

-- Referral mappings policies
CREATE POLICY "Users can view own referral mappings" ON public.referral_mappings
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can insert own referral mappings" ON public.referral_mappings
    FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- Referral earnings policies
CREATE POLICY "Users can view own referral earnings" ON public.referral_earnings
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can manage referral earnings" ON public.referral_earnings
    FOR ALL USING (true); -- System functions can manage all records

-- Referral transactions policies
CREATE POLICY "Users can view own referral transactions" ON public.referral_transactions
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can manage referral transactions" ON public.referral_transactions
    FOR ALL USING (true); -- System functions can manage all records

-- ==============================================
-- 4. CREATE REFERRAL FUNCTIONS
-- ==============================================

-- Function to create referral mapping
CREATE OR REPLACE FUNCTION public.create_referral_mapping(
    referred_user_id UUID,
    referral_code VARCHAR(20)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id UUID;
    v_result JSONB;
BEGIN
    -- Find the referrer by referral code
    SELECT id INTO v_referrer_id
    FROM public.user_profiles
    WHERE referral_code = create_referral_mapping.referral_code;
    
    IF v_referrer_id IS NULL THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Invalid referral code'
        );
        RETURN v_result;
    END IF;
    
    -- Check if user is trying to refer themselves
    IF v_referrer_id = referred_user_id THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Cannot refer yourself'
        );
        RETURN v_result;
    END IF;
    
    -- Check if user is already referred
    IF EXISTS (SELECT 1 FROM public.referral_mappings WHERE referred_id = referred_user_id) THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'User is already referred'
        );
        RETURN v_result;
    END IF;
    
    -- Create referral mapping
    INSERT INTO public.referral_mappings (referrer_id, referred_id, referral_code)
    VALUES (v_referrer_id, referred_user_id, referral_code);
    
    -- Log the transaction
    INSERT INTO public.referral_transactions (referrer_id, referred_id, transaction_type, amount, referral_code)
    VALUES (v_referrer_id, referred_user_id, 'signup', 0.00, referral_code);
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Referral mapping created successfully',
        'referrer_id', v_referrer_id
    );
    
    RETURN v_result;
END;
$$;

-- Function to process referral earnings
CREATE OR REPLACE FUNCTION public.process_referral_earnings(
    referred_user_id UUID,
    transaction_amount DECIMAL(10,2),
    transaction_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referrer_id UUID;
    v_referral_code VARCHAR(20);
    v_earnings_amount DECIMAL(10,2);
    v_percentage DECIMAL(5,2) := 50.00; -- Configurable: 50% for first purchase
    v_result JSONB;
BEGIN
    -- Get referrer information
    SELECT rm.referrer_id, rm.referral_code
    INTO v_referrer_id, v_referral_code
    FROM public.referral_mappings rm
    WHERE rm.referred_id = referred_user_id;
    
    IF v_referrer_id IS NULL THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'No referrer found for this user'
        );
        RETURN v_result;
    END IF;
    
    -- Check if earnings already processed for this transaction
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.referral_earnings 
        WHERE transaction_id = process_referral_earnings.transaction_id
    ) THEN
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Earnings already processed for this transaction'
        );
        RETURN v_result;
    END IF;
    
    -- Calculate earnings (50% of transaction amount)
    v_earnings_amount := (transaction_amount * v_percentage) / 100.00;
    
    -- Create referral earnings record
    INSERT INTO public.referral_earnings (
        referrer_id, 
        referred_id, 
        transaction_id, 
        amount, 
        percentage, 
        status
    )
    VALUES (
        v_referrer_id, 
        referred_user_id, 
        transaction_id, 
        v_earnings_amount, 
        v_percentage, 
        'pending'
    );
    
    -- Update referrer's total earnings in user_profiles
    UPDATE public.user_profiles
    SET 
        referral_earnings = COALESCE(referral_earnings, 0) + v_earnings_amount,
        total_referrals = COALESCE(total_referrals, 0) + 1,
        updated_at = NOW()
    WHERE id = v_referrer_id;
    
    -- Log the transaction
    INSERT INTO public.referral_transactions (
        referrer_id, 
        referred_id, 
        transaction_type, 
        amount, 
        referral_code,
        metadata
    )
    VALUES (
        v_referrer_id, 
        referred_user_id, 
        'purchase', 
        v_earnings_amount, 
        v_referral_code,
        jsonb_build_object(
            'transaction_amount', transaction_amount,
            'percentage', v_percentage,
            'transaction_id', transaction_id
        )
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Referral earnings processed successfully',
        'referrer_id', v_referrer_id,
        'earnings_amount', v_earnings_amount
    );
    
    RETURN v_result;
END;
$$;

-- Function to get user's referral code
CREATE OR REPLACE FUNCTION public.get_user_referral_code(user_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral_code VARCHAR(20);
BEGIN
    SELECT referral_code INTO v_referral_code
    FROM public.user_profiles
    WHERE id = user_id;
    
    RETURN v_referral_code;
END;
$$;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral_code VARCHAR(20);
    v_counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate referral code: first 3 chars of user_id + random 4 digits
        v_referral_code := UPPER(SUBSTRING(user_id::TEXT, 1, 3)) || 
                          LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if code is unique
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = v_referral_code) THEN
            EXIT;
        END IF;
        
        v_counter := v_counter + 1;
        IF v_counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN v_referral_code;
END;
$$;

-- ==============================================
-- 5. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_referral_mappings_referrer ON public.referral_mappings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_mappings_referred ON public.referral_mappings(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_mappings_code ON public.referral_mappings(referral_code);

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred ON public.referral_earnings(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_status ON public.referral_earnings(status);

CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON public.referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred ON public.referral_transactions(referred_id);

-- ==============================================
-- 6. GRANT PERMISSIONS
-- ==============================================

GRANT ALL ON public.referral_mappings TO authenticated;
GRANT ALL ON public.referral_earnings TO authenticated;
GRANT ALL ON public.referral_transactions TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_referral_mapping(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_earnings(UUID, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_referral_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_code(UUID) TO authenticated;

-- ==============================================
-- 7. VERIFICATION
-- ==============================================

SELECT 
    'Referral system setup completed!' as status,
    'All tables, functions, and policies have been created.' as message;
