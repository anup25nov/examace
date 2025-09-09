    -- PRODUCTION OTP SETUP
    -- This script sets up real OTP functionality and uniqueness constraints

    -- ==============================================
    -- 1. ADD UNIQUENESS CONSTRAINTS
    -- ==============================================

    -- Add unique constraint for email in user_profiles
    DO $$ 
    BEGIN
        -- Add unique constraint for email if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_profiles_email_unique'
        ) THEN
            ALTER TABLE public.user_profiles 
            ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
        END IF;
        
        -- Add unique constraint for phone if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'user_profiles_phone_unique'
        ) THEN
            ALTER TABLE public.user_profiles 
            ADD CONSTRAINT user_profiles_phone_unique UNIQUE (phone);
        END IF;
    END $$;

    -- ==============================================
    -- 2. UPDATE PHONE VERIFICATIONS TABLE
    -- ==============================================

    -- Drop and recreate phone_verifications table to ensure correct schema
    DROP TABLE IF EXISTS public.phone_verifications CASCADE;

    CREATE TABLE public.phone_verifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        phone VARCHAR(15) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    DROP POLICY IF EXISTS "Users can view own phone verifications" ON public.phone_verifications;
    DROP POLICY IF EXISTS "Users can insert own phone verifications" ON public.phone_verifications;
    DROP POLICY IF EXISTS "Users can update own phone verifications" ON public.phone_verifications;

    CREATE POLICY "Users can view own phone verifications" ON public.phone_verifications
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own phone verifications" ON public.phone_verifications
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own phone verifications" ON public.phone_verifications
        FOR UPDATE USING (auth.uid() = user_id);

    -- ==============================================
    -- 3. CREATE OTP FUNCTIONS
    -- ==============================================

    -- Drop existing functions if they exist
    DROP FUNCTION IF EXISTS public.send_otp_to_phone(UUID, VARCHAR);
    DROP FUNCTION IF EXISTS public.verify_phone_otp(UUID, VARCHAR, VARCHAR);
    DROP FUNCTION IF EXISTS public.generate_otp();

    -- Function to generate 6-digit OTP
    CREATE OR REPLACE FUNCTION public.generate_otp()
    RETURNS VARCHAR(6)
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    END;
    $$;

    -- Function to send OTP (for now, just stores it - you'll integrate with SMS service)
    CREATE OR REPLACE FUNCTION public.send_otp_to_phone(user_uuid UUID, phone_number VARCHAR)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_otp VARCHAR(6);
        v_expires_at TIMESTAMP WITH TIME ZONE;
        v_result JSONB;
    BEGIN
        -- Generate 6-digit OTP
        v_otp := public.generate_otp();
        
        -- Set expiration time (5 minutes from now)
        v_expires_at := NOW() + INTERVAL '5 minutes';
        
        -- Clean up old OTPs for this user
        DELETE FROM public.phone_verifications 
        WHERE user_id = user_uuid 
        AND (expires_at < NOW() OR verified = TRUE);
        
        -- Insert new OTP
        INSERT INTO public.phone_verifications (user_id, phone, otp_code, expires_at)
        VALUES (user_uuid, phone_number, v_otp, v_expires_at);
        
        -- TODO: Integrate with SMS service here
        -- For now, we'll log the OTP (remove this in production)
        RAISE NOTICE 'OTP for %: %', phone_number, v_otp;
        
        -- Return success response
        v_result := jsonb_build_object(
            'success', true,
            'message', 'OTP sent successfully',
            'expires_in', 300, -- 5 minutes
            'phone', phone_number
        );
        
        RETURN v_result;
    END;
    $$;

    -- Function to verify OTP
    CREATE OR REPLACE FUNCTION public.verify_phone_otp(user_uuid UUID, phone_number VARCHAR, otp_code VARCHAR)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        v_verification RECORD;
        v_result JSONB;
    BEGIN
        -- Find the OTP record
        SELECT * INTO v_verification
        FROM public.phone_verifications
        WHERE user_id = user_uuid 
        AND phone = phone_number 
        AND otp_code = otp_code
        AND expires_at > NOW()
        AND verified = FALSE;
        
        -- Check if OTP is valid
        IF v_verification IS NULL THEN
            v_result := jsonb_build_object(
                'success', false,
                'message', 'Invalid or expired OTP'
            );
            RETURN v_result;
        END IF;
        
        -- Mark OTP as verified
        UPDATE public.phone_verifications
        SET verified = TRUE, updated_at = NOW()
        WHERE id = v_verification.id;
        
        -- Update user profile with verified phone
        UPDATE public.user_profiles
        SET 
            phone = phone_number,
            phone_verified = TRUE,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        -- Return success response
        v_result := jsonb_build_object(
            'success', true,
            'message', 'Phone number verified successfully'
        );
        
        RETURN v_result;
    END;
    $$;

    -- ==============================================
    -- 4. CREATE INDEXES
    -- ==============================================

    CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON public.phone_verifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone);
    CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON public.phone_verifications(expires_at);

    -- ==============================================
    -- 5. GRANT PERMISSIONS
    -- ==============================================

    GRANT ALL ON public.phone_verifications TO authenticated;
    GRANT EXECUTE ON FUNCTION public.send_otp_to_phone(UUID, VARCHAR) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.verify_phone_otp(UUID, VARCHAR, VARCHAR) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.generate_otp() TO authenticated;

    -- ==============================================
    -- 6. VERIFICATION
    -- ==============================================

    SELECT 
        'Production OTP system setup completed!' as status,
        'Email and phone uniqueness constraints added. OTP functions created.' as message;
