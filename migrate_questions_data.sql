-- Migration SQL for questions

-- Insert test data
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration, total_questions, subjects, correct_marks, incorrect_marks, is_premium) VALUES
('ssc-cgl', 'mock', 'mock-paper-1', 'SSC CGL Mock Test 1', 'Comprehensive mock test for SSC CGL preparation', 120, 100, '["General Intelligence","General Awareness","Quantitative Aptitude","English Comprehension"]', 1, 0.25, true),
('ssc-cgl', 'pyq', '2024-paper-1', 'SSC CGL 2024 Paper 1', 'Previous year question paper from SSC CGL 2024', 120, 100, '["General Intelligence","General Awareness","Quantitative Aptitude","English Comprehension"]', 1, 0.25, true),
('ssc-cgl', 'practice', 'english-grammar-paper-1', 'English Grammar Practice', 'Practice questions for English Grammar', 60, 50, '["English Grammar"]', 1, 0.25, false)
ON CONFLICT (exam_id, test_type, test_id) DO NOTHING;

-- Insert questions
INSERT INTO exam_questions (exam_id, test_type, test_id, question_order, question_en, question_hi, options, correct_answer, difficulty, subject, topic, marks, negative_marks, duration, explanation) VALUES
('ssc-cgl', 'mock', 'mock-paper-1', 1, 'What is the capital of India?', 'भारत की राजधानी क्या है?', '["Delhi","Mumbai","Kolkata","Chennai"]', 0, 'easy', 'General Awareness', 'Geography', 1, 0.25, 60, 'Delhi is the capital of India.'),
('ssc-cgl', 'mock', 'mock-paper-1', 2, 'What is 2 + 2?', '2 + 2 क्या है?', '["3","4","5","6"]', 1, 'easy', 'Quantitative Aptitude', 'Basic Arithmetic', 1, 0.25, 60, '2 + 2 = 4')
ON CONFLICT DO NOTHING;

