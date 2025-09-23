-- Create get_test_questions function for secure question retrieval
-- Execute this in Supabase SQL Editor

-- First, create the exam_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  question_order INTEGER NOT NULL,
  question_en TEXT NOT NULL,
  question_hi TEXT,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  difficulty VARCHAR(10) DEFAULT 'medium',
  subject VARCHAR(50),
  topic VARCHAR(50),
  marks INTEGER DEFAULT 1,
  negative_marks DECIMAL(3,2) DEFAULT 0.25,
  duration INTEGER DEFAULT 60,
  explanation TEXT,
  question_image TEXT,
  options_images JSONB,
  explanation_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_test_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_test_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(20) NOT NULL,
  test_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  subjects JSONB,
  correct_marks INTEGER DEFAULT 1,
  incorrect_marks DECIMAL(3,2) DEFAULT 0.25,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, test_type, test_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_test ON exam_questions(exam_id, test_type, test_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, test_type, test_id, question_order);
CREATE INDEX IF NOT EXISTS idx_exam_test_data_exam_test ON exam_test_data(exam_id, test_type, test_id);

-- Enable RLS
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_test_data ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can read exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can read exam test data" ON exam_test_data;

CREATE POLICY "Users can read exam questions" ON exam_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read exam test data" ON exam_test_data
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create premium access check function
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

-- Create the main get_test_questions function
CREATE OR REPLACE FUNCTION get_test_questions(
  p_exam_id VARCHAR,
  p_test_type VARCHAR,
  p_test_id VARCHAR,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  exam_info JSON;
  questions JSON;
  test_data RECORD;
BEGIN
  -- Check if user has access to this test
  IF NOT check_premium_access(p_user_id, p_exam_id, p_test_type, p_test_id) THEN
    RETURN json_build_object(
      'error', 'Access denied: Premium membership required',
      'success', false
    );
  END IF;
  
  -- Get test metadata
  SELECT 
    name,
    description,
    duration,
    total_questions,
    subjects,
    correct_marks,
    incorrect_marks,
    is_premium
  INTO test_data
  FROM exam_test_data
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id;
  
  -- If no test data found, return error
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Test not found',
      'success', false
    );
  END IF;
  
  -- Build exam info
  exam_info := json_build_object(
    'testName', test_data.name,
    'duration', test_data.duration,
    'totalQuestions', test_data.total_questions,
    'subjects', COALESCE(test_data.subjects, '["General"]'::json),
    'markingScheme', json_build_object(
      'correct', test_data.correct_marks,
      'incorrect', test_data.incorrect_marks,
      'unattempted', 0
    ),
    'defaultLanguage', 'english'
  );
  
  -- Get questions
  SELECT json_agg(
    json_build_object(
      'id', id,
      'questionEn', question_en,
      'questionHi', COALESCE(question_hi, ''),
      'options', options,
      'correct', correct_answer,
      'difficulty', difficulty,
      'subject', subject,
      'topic', topic,
      'marks', marks,
      'negativeMarks', negative_marks,
      'duration', duration,
      'explanation', COALESCE(explanation, ''),
      'questionImage', COALESCE(question_image, ''),
      'optionsImages', COALESCE(options_images, '[]'::json),
      'explanationImage', COALESCE(explanation_image, '')
    ) ORDER BY question_order
  ) INTO questions
  FROM exam_questions
  WHERE exam_id = p_exam_id
    AND test_type = p_test_type
    AND test_id = p_test_id;
  
  -- Build final result
  result := json_build_object(
    'success', true,
    'examInfo', exam_info,
    'questions', COALESCE(questions, '[]'::json)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler function that returns questions as a table (for RPC calls)
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
GRANT EXECUTE ON FUNCTION get_test_questions TO authenticated;
GRANT EXECUTE ON FUNCTION get_secure_test_questions TO authenticated;

-- Insert some sample data for testing
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration, total_questions, subjects, correct_marks, incorrect_marks, is_premium) VALUES
('ssc-cgl', 'mock', 'mock-paper-1', 'SSC CGL Mock Test 1', 'Comprehensive mock test for SSC CGL preparation', 120, 100, '["General Intelligence", "General Awareness", "Quantitative Aptitude", "English Comprehension"]', 1, 0.25, true),
('ssc-cgl', 'pyq', '2024-paper-1', 'SSC CGL 2024 Paper 1', 'Previous year question paper from SSC CGL 2024', 120, 100, '["General Intelligence", "General Awareness", "Quantitative Aptitude", "English Comprehension"]', 1, 0.25, true),
('ssc-cgl', 'practice', 'english-grammar-paper-1', 'English Grammar Practice', 'Practice questions for English Grammar', 60, 50, '["English Grammar"]', 1, 0.25, false)
ON CONFLICT (exam_id, test_type, test_id) DO NOTHING;

-- Insert sample questions
INSERT INTO exam_questions (exam_id, test_type, test_id, question_order, question_en, question_hi, options, correct_answer, difficulty, subject, topic, marks, negative_marks, duration, explanation) VALUES
('ssc-cgl', 'mock', 'mock-paper-1', 1, 'What is the capital of India?', 'भारत की राजधानी क्या है?', '["Delhi", "Mumbai", "Kolkata", "Chennai"]', 0, 'easy', 'General Awareness', 'Geography', 1, 0.25, 60, 'Delhi is the capital of India.'),
('ssc-cgl', 'mock', 'mock-paper-1', 2, 'What is 2 + 2?', '2 + 2 क्या है?', '["3", "4", "5", "6"]', 1, 'easy', 'Quantitative Aptitude', 'Basic Arithmetic', 1, 0.25, 60, '2 + 2 = 4'),
('ssc-cgl', 'pyq', '2024-paper-1', 1, 'Which of the following is a prime number?', 'निम्नलिखित में से कौन सी अभाज्य संख्या है?', '["4", "6", "7", "8"]', 2, 'medium', 'Quantitative Aptitude', 'Number Theory', 1, 0.25, 60, '7 is a prime number as it is only divisible by 1 and itself.'),
('ssc-cgl', 'practice', 'english-grammar-paper-1', 1, 'Choose the correct form of the verb: She _____ to school every day.', 'क्रिया का सही रूप चुनें: वह हर दिन स्कूल _____ जाती है।', '["go", "goes", "going", "gone"]', 1, 'easy', 'English Grammar', 'Subject-Verb Agreement', 1, 0.25, 60, 'The correct form is "goes" as the subject "She" is third person singular.')
ON CONFLICT DO NOTHING;
