-- Create secure questions tables
-- This migration creates tables to store questions securely in the database
-- instead of exposing them through JSON files

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL, -- 'mock', 'pyq', 'practice'
  test_id VARCHAR(100) NOT NULL,
  question_order INTEGER NOT NULL,
  question_en TEXT NOT NULL,
  question_hi TEXT,
  options JSONB NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL,
  difficulty VARCHAR(10) DEFAULT 'medium',
  subject VARCHAR(50),
  topic VARCHAR(50),
  marks INTEGER DEFAULT 1,
  negative_marks DECIMAL(3,2) DEFAULT 0.25,
  duration INTEGER DEFAULT 60, -- in seconds
  explanation TEXT,
  question_image TEXT,
  options_images JSONB, -- Array of image URLs for options
  explanation_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_test_data table
CREATE TABLE IF NOT EXISTS exam_test_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  total_questions INTEGER NOT NULL,
  subjects JSONB, -- Array of subjects
  correct_marks INTEGER DEFAULT 1,
  incorrect_marks DECIMAL(3,2) DEFAULT 0.25,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, test_type, test_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_test ON exam_questions(exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, test_type, test_id, question_order);
CREATE INDEX IF NOT EXISTS idx_exam_test_data_exam_test ON exam_test_data(exam_id, test_type, test_id);

-- Create RLS policies
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_data ENABLE ROW LEVEL SECURITY;

-- Policy for exam_questions - only authenticated users can read
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_questions' AND policyname = 'Users can read exam questions') THEN
        CREATE POLICY "Users can read exam questions" ON exam_questions
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Policy for exam_test_data - only authenticated users can read
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_test_data' AND policyname = 'Users can read exam test data') THEN
        CREATE POLICY "Users can read exam test data" ON exam_test_data
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create function to check premium access
CREATE OR REPLACE FUNCTION check_premium_access(user_id UUID, exam_id VARCHAR, test_type VARCHAR, test_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  is_premium BOOLEAN;
  has_membership BOOLEAN;
BEGIN
  -- Check if test is premium
  SELECT exam_test_data.is_premium INTO is_premium
  FROM exam_test_data
  WHERE exam_test_data.exam_id = check_premium_access.exam_id
    AND exam_test_data.test_type = check_premium_access.test_type
    AND exam_test_data.test_id = check_premium_access.test_id;
  
  -- If not premium, allow access
  IF NOT is_premium THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active membership
  SELECT EXISTS(
    SELECT 1 FROM user_memberships
    WHERE user_memberships.user_id = check_premium_access.user_id
      AND user_memberships.status = 'active'
  ) INTO has_membership;
  
  RETURN has_membership;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get secure test questions
CREATE OR REPLACE FUNCTION get_secure_test_questions(
  p_exam_id VARCHAR,
  p_test_type VARCHAR,
  p_test_id VARCHAR,
  p_user_id UUID
)
RETURNS TABLE (
  question_id UUID,
  question_en TEXT,
  question_hi TEXT,
  options JSONB,
  correct_answer INTEGER,
  difficulty VARCHAR,
  subject VARCHAR,
  topic VARCHAR,
  marks INTEGER,
  negative_marks DECIMAL,
  duration INTEGER,
  explanation TEXT,
  question_image TEXT,
  options_images JSONB,
  explanation_image TEXT
) AS $$
BEGIN
  -- Check if user has access to this test
  IF NOT check_premium_access(p_user_id, p_exam_id, p_test_type, p_test_id) THEN
    RAISE EXCEPTION 'Access denied: Premium membership required';
  END IF;
  
  -- Return questions
  RETURN QUERY
  SELECT 
    eq.id as question_id,
    eq.question_en,
    eq.question_hi,
    eq.options,
    eq.correct_answer,
    eq.difficulty,
    eq.subject,
    eq.topic,
    eq.marks,
    eq.negative_marks,
    eq.duration,
    eq.explanation,
    eq.question_image,
    eq.options_images,
    eq.explanation_image
  FROM exam_questions eq
  WHERE eq.exam_id = p_exam_id
    AND eq.test_type = p_test_type
    AND eq.test_id = p_test_id
  ORDER BY eq.question_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_premium_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_test_questions TO authenticated;
