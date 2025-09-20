-- Fix test_attempts table structure for plan limits
-- This migration adds missing columns to the existing test_attempts table

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'status') THEN
    ALTER TABLE test_attempts ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'completed';
  END IF;
  
  -- Add started_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'started_at') THEN
    ALTER TABLE test_attempts ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add completed_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'completed_at') THEN
    ALTER TABLE test_attempts ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add created_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'created_at') THEN
    ALTER TABLE test_attempts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'test_attempts' AND column_name = 'updated_at') THEN
    ALTER TABLE test_attempts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON test_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_status ON test_attempts(user_id, status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_test_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_test_attempts_updated_at
  BEFORE UPDATE ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_test_attempts_updated_at();

-- Grant permissions
GRANT ALL ON test_attempts TO authenticated;
GRANT ALL ON test_attempts TO anon;
