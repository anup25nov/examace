-- Fix Table Structure Issues
-- Run this in Supabase SQL Editor

-- 1. Fix user_messages table structure
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'info';

-- Update existing records to have message_type
UPDATE user_messages 
SET message_type = 'info' 
WHERE message_type IS NULL;

-- 2. Ensure test_attempts table has proper structure
-- Check if test_attempts table exists and has required columns
DO $$
BEGIN
    -- Create test_attempts table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_attempts') THEN
        CREATE TABLE test_attempts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES user_profiles(id),
            exam_id VARCHAR(50) NOT NULL,
            test_type VARCHAR(20) NOT NULL,
            test_id VARCHAR(100) NOT NULL,
            score INTEGER DEFAULT 0,
            total_questions INTEGER DEFAULT 0,
            correct_answers INTEGER DEFAULT 0,
            time_taken INTEGER DEFAULT 0,
            answers JSONB,
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) DEFAULT 'in_progress',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'started_at') THEN
        ALTER TABLE test_attempts ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'status') THEN
        ALTER TABLE test_attempts ADD COLUMN status VARCHAR(20) DEFAULT 'in_progress';
    END IF;
END $$;

-- 3. Ensure user_memberships table has proper structure
DO $$
BEGIN
    -- Create user_memberships table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_memberships') THEN
        CREATE TABLE user_memberships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES user_profiles(id),
            plan_id UUID REFERENCES membership_plans(id),
            status VARCHAR(20) DEFAULT 'active',
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            end_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Make plan_id nullable if it's not already
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_memberships' AND column_name = 'plan_id' AND is_nullable = 'NO') THEN
        ALTER TABLE user_memberships ALTER COLUMN plan_id DROP NOT NULL;
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam_id ON test_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON user_messages(is_read);

-- 5. Grant permissions
GRANT ALL ON test_attempts TO authenticated;
GRANT ALL ON user_memberships TO authenticated;
GRANT ALL ON user_messages TO authenticated;

-- 6. Insert sample data for testing (optional - remove if not needed)
-- This will help with the 0 rows issue
INSERT INTO test_attempts (user_id, exam_id, test_type, test_id, score, total_questions, correct_answers, time_taken, status, completed_at)
VALUES (
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'ssc-cgl',
    'mock',
    'test-1',
    85,
    10,
    8,
    1200,
    'completed',
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert sample membership data with a valid plan_id
-- First, ensure we have a membership plan
INSERT INTO membership_plans (id, name, price, duration_months, features, is_active)
VALUES (
    'free-plan-id',
    'Free Plan',
    0,
    0,
    '["Basic access to free tests"]',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_memberships (user_id, plan_id, status, start_date, end_date)
VALUES (
    '9948aaa7-1746-465a-968a-3f8c5b3d5870',
    'free-plan-id',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
) ON CONFLICT DO NOTHING;
