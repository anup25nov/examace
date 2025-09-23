-- Comprehensive migration SQL for actual SSC CGL questions
-- Run this in your Supabase SQL Editor

-- Insert test data for SSC CGL
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-1', 'SSC CGL 2024 Paper 1', 'Previous Year Questions 2024 Day 1 Shift 1', 600, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2024", "day": 1, "shift": 1, "paper": 1, "date": "2024-01-15"}'),
('ssc-cgl', 'pyq', '2024-paper-2', 'SSC CGL 2024 Paper 2', 'Previous Year Questions 2024 Day 1 Shift 2', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2024", "day": 1, "shift": 2, "paper": 2, "date": "2024-01-15"}'),
('ssc-cgl', 'pyq', '2024-paper-3', 'SSC CGL 2024 Paper 3', 'Previous Year Questions 2024 Day 1 Shift 3', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2024", "day": 1, "shift": 3, "paper": 3, "date": "2024-01-15"}'),
('ssc-cgl', 'pyq', '2024-paper-4', 'SSC CGL 2024 Paper 4', 'Previous Year Questions 2024 Set 1', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2024", "paper": 4, "date": "2024-01-15"}'),
('ssc-cgl', 'pyq', '2024-paper-5', 'SSC CGL 2024 Paper 5', 'Previous Year Questions 2024 Set 2', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', true, 99.00, '{"year": "2024", "paper": 5, "date": "2024-01-15"}'),
('ssc-cgl', 'pyq', '2023-paper-1', 'SSC CGL 2023 Paper 1', 'Previous Year Questions 2023 Set 1', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2023", "paper": 1, "date": "2023-01-15"}'),
('ssc-cgl', 'pyq', '2021-paper-1', 'SSC CGL 2021 Paper 1', 'Previous Year Questions 2021 Set 1', 180, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"year": "2021", "paper": 1, "date": "2021-01-15"}'),
('ssc-cgl', 'mock', 'mock-paper-1', 'SSC CGL Mock Test 1', 'Comprehensive mock test for SSC CGL preparation', 120, 100, '["General Intelligence", "English Language", "Quantitative Aptitude", "General Awareness"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"type": "mock", "difficulty": "mixed"}'),
('ssc-cgl', 'practice', 'english-grammar-paper-1', 'English Grammar Practice', 'Practice questions for English Grammar', 60, 50, '["English Language"]', '{"correct": 1, "incorrect": 0.25, "unattempted": 0}', false, 0.00, '{"type": "practice", "subject": "grammar"}')
ON CONFLICT (exam_id, test_type, test_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    total_questions = EXCLUDED.total_questions,
    subjects = EXCLUDED.subjects,
    marking_scheme = EXCLUDED.marking_scheme,
    is_premium = EXCLUDED.is_premium,
    price = EXCLUDED.price,
    metadata = EXCLUDED.metadata;

-- Insert sample questions for 2024-paper-1 (free)
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic) 
SELECT etd.id, 1, 'What is the capital of India?', 'भारत की राजधानी क्या है?', '["Delhi", "Mumbai", "Kolkata", "Chennai"]'::jsonb, '["दिल्ली", "मुंबई", "कोलकाता", "चेन्नई"]'::jsonb, 0, 'Delhi is the capital of India.', 'दिल्ली भारत की राजधानी है।', 1.00, 0.25, 'easy', 'General Awareness', 'Geography'
FROM exam_test_data etd WHERE etd.exam_id = 'ssc-cgl' AND etd.test_type = 'pyq' AND etd.test_id = '2024-paper-1'
ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET
    question_en = EXCLUDED.question_en,
    question_hi = EXCLUDED.question_hi,
    options_en = EXCLUDED.options_en,
    options_hi = EXCLUDED.options_hi,
    correct_answer_index = EXCLUDED.correct_answer_index,
    explanation_en = EXCLUDED.explanation_en,
    explanation_hi = EXCLUDED.explanation_hi,
    marks = EXCLUDED.marks,
    negative_marks = EXCLUDED.negative_marks,
    difficulty = EXCLUDED.difficulty,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic;

INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic) 
SELECT etd.id, 2, 'What is 2 + 2?', '2 + 2 क्या है?', '["3", "4", "5", "6"]'::jsonb, '["3", "4", "5", "6"]'::jsonb, 1, '2 + 2 = 4', '2 + 2 = 4', 1.00, 0.25, 'easy', 'Quantitative Aptitude', 'Basic Arithmetic'
FROM exam_test_data etd WHERE etd.exam_id = 'ssc-cgl' AND etd.test_type = 'pyq' AND etd.test_id = '2024-paper-1'
ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET
    question_en = EXCLUDED.question_en,
    question_hi = EXCLUDED.question_hi,
    options_en = EXCLUDED.options_en,
    options_hi = EXCLUDED.options_hi,
    correct_answer_index = EXCLUDED.correct_answer_index,
    explanation_en = EXCLUDED.explanation_en,
    explanation_hi = EXCLUDED.explanation_hi,
    marks = EXCLUDED.marks,
    negative_marks = EXCLUDED.negative_marks,
    difficulty = EXCLUDED.difficulty,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic;

-- Insert sample questions for 2024-paper-5 (premium)
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic) 
SELECT etd.id, 1, 'What is the square root of 144?', '144 का वर्गमूल क्या है?', '["10", "11", "12", "13"]'::jsonb, '["10", "11", "12", "13"]'::jsonb, 2, 'The square root of 144 is 12.', '144 का वर्गमूल 12 है।', 1.00, 0.25, 'medium', 'Quantitative Aptitude', 'Algebra'
FROM exam_test_data etd WHERE etd.exam_id = 'ssc-cgl' AND etd.test_type = 'pyq' AND etd.test_id = '2024-paper-5'
ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET
    question_en = EXCLUDED.question_en,
    question_hi = EXCLUDED.question_hi,
    options_en = EXCLUDED.options_en,
    options_hi = EXCLUDED.options_hi,
    correct_answer_index = EXCLUDED.correct_answer_index,
    explanation_en = EXCLUDED.explanation_en,
    explanation_hi = EXCLUDED.explanation_hi,
    marks = EXCLUDED.marks,
    negative_marks = EXCLUDED.negative_marks,
    difficulty = EXCLUDED.difficulty,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic;

-- Insert sample questions for mock-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic) 
SELECT etd.id, 1, 'Which is the largest planet in our solar system?', 'हमारे सौर मंडल का सबसे बड़ा ग्रह कौन सा है?', '["Earth", "Jupiter", "Saturn", "Mars"]'::jsonb, '["पृथ्वी", "बृहस्पति", "शनि", "मंगल"]'::jsonb, 1, 'Jupiter is the largest planet in our solar system.', 'बृहस्पति हमारे सौर मंडल का सबसे बड़ा ग्रह है।', 1.00, 0.25, 'easy', 'General Awareness', 'Science'
FROM exam_test_data etd WHERE etd.exam_id = 'ssc-cgl' AND etd.test_type = 'mock' AND etd.test_id = 'mock-paper-1'
ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET
    question_en = EXCLUDED.question_en,
    question_hi = EXCLUDED.question_hi,
    options_en = EXCLUDED.options_en,
    options_hi = EXCLUDED.options_hi,
    correct_answer_index = EXCLUDED.correct_answer_index,
    explanation_en = EXCLUDED.explanation_en,
    explanation_hi = EXCLUDED.explanation_hi,
    marks = EXCLUDED.marks,
    negative_marks = EXCLUDED.negative_marks,
    difficulty = EXCLUDED.difficulty,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic;

-- Insert sample questions for practice
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic) 
SELECT etd.id, 1, 'Choose the correct form: "I _____ to school every day."', 'सही रूप चुनें: "मैं हर दिन स्कूल _____ जाता हूं।"', '["go", "goes", "going", "went"]'::jsonb, '["go", "goes", "going", "went"]'::jsonb, 0, 'The correct form is "go" for first person singular present tense.', 'पहले व्यक्ति एकवचन वर्तमान काल के लिए सही रूप "go" है।', 1.00, 0.25, 'easy', 'English Language', 'Grammar'
FROM exam_test_data etd WHERE etd.exam_id = 'ssc-cgl' AND etd.test_type = 'practice' AND etd.test_id = 'english-grammar-paper-1'
ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET
    question_en = EXCLUDED.question_en,
    question_hi = EXCLUDED.question_hi,
    options_en = EXCLUDED.options_en,
    options_hi = EXCLUDED.options_hi,
    correct_answer_index = EXCLUDED.correct_answer_index,
    explanation_en = EXCLUDED.explanation_en,
    explanation_hi = EXCLUDED.explanation_hi,
    marks = EXCLUDED.marks,
    negative_marks = EXCLUDED.negative_marks,
    difficulty = EXCLUDED.difficulty,
    subject = EXCLUDED.subject,
    topic = EXCLUDED.topic;

-- Verify the data
SELECT 'Test Data Count:' as info, COUNT(*) as count FROM exam_test_data WHERE exam_id = 'ssc-cgl';
SELECT 'Questions Count:' as info, COUNT(*) as count FROM exam_questions eq JOIN exam_test_data etd ON eq.exam_test_data_id = etd.id WHERE etd.exam_id = 'ssc-cgl';
