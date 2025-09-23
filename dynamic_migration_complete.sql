-- Dynamic Question Migration SQL
-- Generated automatically from JSON files
-- Generated at: 2025-09-23T08:46:58.445Z

-- Test: mock-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'mock', 'mock-paper-1', 'mock-paper-1', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.446Z","updated_at":"2025-09-23T08:46:58.446Z"}'::jsonb)
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

-- Questions for mock-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-1'), 1, 'What is the capital of India?', 'भारत की राजधानी क्या है?', '["Mumbai","Delhi","Kolkata","Chennai"]'::jsonb, '[]'::jsonb, 0, 'Delhi is the capital of India. It is located in northern India and serves as the seat of the Government of India.', NULL, 2, 0.5, 'easy', 'general-awareness', 'geography', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-1'), 2, 'What is 15 + 25?', '15 + 25 क्या है?', '["35","40","45","50"]'::jsonb, '[]'::jsonb, 0, '15 + 25 = 40. This is a basic arithmetic addition problem.', NULL, 2, 0.5, 'easy', 'quantitative-aptitude', 'arithmetic', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: mock-paper-2
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'mock', 'mock-paper-2', 'mock-paper-2', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.446Z","updated_at":"2025-09-23T08:46:58.446Z"}'::jsonb)
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

-- Questions for mock-paper-2
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-2'), 1, 'What is the value of 15% of 200?', '200 का 15% क्या है?', '["25","30","35","40"]'::jsonb, '[]'::jsonb, 0, '15% of 200 = (15/100) × 200 = 30', NULL, 2, 0.5, 'easy', 'quantitative-aptitude', 'percentage', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-2'), 2, 'Which of the following is not a programming language?', 'निम्नलिखित में से कौन सी प्रोग्रामिंग भाषा नहीं है?', '["Python","Java","HTML","C++"]'::jsonb, '[]'::jsonb, 0, 'HTML is a markup language, not a programming language.', NULL, 2, 0.5, 'medium', 'general-awareness', 'computer', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: mock-paper-3
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'mock', 'mock-paper-3', 'mock-paper-3', NULL, 60, 3, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for mock-paper-3
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-3'), 1, 'What is the value of √(144 + 25)?', '√(144 + 25) का मान क्या है?', '["13","17","19","21"]'::jsonb, '[]'::jsonb, 0, '√(144 + 25) = √169 = 13', NULL, 2, 0.5, 'medium', 'quantitative-aptitude', 'arithmetic', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-3'), 2, 'Which of the following is a palindrome?', 'निम्नलिखित में से कौन सा palindrome है?', '["RADAR","HELLO","WORLD","INDIA"]'::jsonb, '[]'::jsonb, 0, 'RADAR reads the same forwards and backwards, making it a palindrome.', NULL, 2, 0.5, 'easy', 'general-intelligence', 'word-pattern', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'mock' AND test_id = 'mock-paper-3'), 3, 'What is the synonym of ''Ubiquitous''?', '''Ubiquitous'' का समानार्थी शब्द क्या है?', '["Rare","Common","Omnipresent","Unique"]'::jsonb, '[]'::jsonb, 0, 'Ubiquitous means present everywhere, which is synonymous with omnipresent.', NULL, 2, 0.5, 'hard', 'english-language', 'vocabulary', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: english-grammar-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'english-grammar-paper-1', 'english-grammar-paper-1', NULL, 60, 4, '["General Knowledge"]'::jsonb, '{"correct":1,"incorrect":0.25,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for english-grammar-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-1'), 1, 'Choose the correct form: ''She _____ to the market yesterday.''', 'सही रूप चुनें: ''वह कल बाजार _____ गई।''', '["go","goes","went","going"]'::jsonb, '[]'::jsonb, 0, 'The correct form is ''went'' because it''s past tense and the subject is ''She''.', NULL, 1, 0.25, 'easy', 'english-language', 'grammar', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-1'), 2, 'Identify the correct sentence:', 'सही वाक्य पहचानें:', '["He don''t like apples","He doesn''t like apples","He not like apples","He no like apples"]'::jsonb, '[]'::jsonb, 0, 'The correct sentence is ''He doesn''t like apples'' because ''doesn''t'' is the correct negative form for third person singular.', NULL, 1, 0.25, 'easy', 'english-language', 'grammar', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-1'), 3, 'What is the plural of ''child''?', '''Child'' का बहुवचन क्या है?', '["childs","children","childes","child"]'::jsonb, '[]'::jsonb, 0, 'The plural of ''child'' is ''children'' - it''s an irregular plural form.', NULL, 1, 0.25, 'easy', 'english-language', 'grammar', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-1'), 4, 'Choose the correct preposition: ''The book is _____ the table.''', 'सही preposition चुनें: ''किताब मेज _____ है।''', '["in","on","at","by"]'::jsonb, '[]'::jsonb, 0, 'The correct preposition is ''on'' because the book is placed on top of the table.', NULL, 2, 0.5, 'medium', 'english-language', 'grammar', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: english-grammar-paper-2
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'english-grammar-paper-2', 'english-grammar-paper-2', NULL, 60, 3, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for english-grammar-paper-2
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-2'), 1, 'Choose the correct conditional sentence:', 'सही conditional sentence चुनें:', '["If I was you, I would go","If I were you, I would go","If I am you, I would go","If I be you, I would go"]'::jsonb, '[]'::jsonb, 0, 'The correct form is ''If I were you, I would go'' - this is the subjunctive mood for hypothetical situations.', NULL, 2, 0.5, 'hard', 'english-language', 'grammar', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-2'), 2, 'Identify the gerund in the sentence: ''Swimming is good exercise.''', 'वाक्य में gerund पहचानें: ''Swimming is good exercise.''', '["Swimming","is","good","exercise"]'::jsonb, '[]'::jsonb, 0, 'Swimming is a gerund - a verb form ending in -ing that functions as a noun.', NULL, 2, 0.5, 'medium', 'english-language', 'grammar', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'english-grammar-paper-2'), 3, 'What is the passive voice of: ''They built this house last year.''', 'इसका passive voice क्या है: ''They built this house last year.''', '["This house was built by them last year","This house is built by them last year","This house built by them last year","This house was build by them last year"]'::jsonb, '[]'::jsonb, 0, 'The passive voice is ''This house was built by them last year'' - past tense passive construction.', NULL, 2, 0.5, 'medium', 'english-language', 'grammar', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: maths-algebra-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'maths-algebra-paper-1', 'maths-algebra-paper-1', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":1,"incorrect":0.25,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for maths-algebra-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'maths-algebra-paper-1'), 1, 'What is the square root of 144?', '144 का वर्गमूल क्या है?', '["10","12","14","16"]'::jsonb, '[]'::jsonb, 0, 'The square root of 144 is 12 because 12 × 12 = 144.', NULL, 1, 0.25, 'easy', 'quantitative-aptitude', 'algebra', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'maths-algebra-paper-1'), 2, 'If 2x + 5 = 15, what is the value of x?', 'यदि 2x + 5 = 15, तो x का मान क्या है?', '["3","5","7","10"]'::jsonb, '[]'::jsonb, 0, 'Solving: 2x + 5 = 15, so 2x = 10, therefore x = 5.', NULL, 1, 0.25, 'medium', 'quantitative-aptitude', 'algebra', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: maths-algebra-paper-2
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'maths-algebra-paper-2', 'maths-algebra-paper-2', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for maths-algebra-paper-2
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'maths-algebra-paper-2'), 1, 'Solve for x: 2x² - 8x + 6 = 0', 'x का मान ज्ञात करें: 2x² - 8x + 6 = 0', '["x = 1, 3","x = 2, 4","x = 0, 2","x = -1, -3"]'::jsonb, '[]'::jsonb, 0, 'Using quadratic formula: x = (8 ± √(64-48))/4 = (8 ± 4)/4 = 3 or 1', NULL, 2, 0.5, 'hard', 'quantitative-aptitude', 'algebra', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'maths-algebra-paper-2'), 2, 'What is the value of x in the equation: 3x + 2y = 12 and x - y = 1?', 'समीकरण में x का मान क्या है: 3x + 2y = 12 और x - y = 1?', '["x = 2","x = 3","x = 4","x = 5"]'::jsonb, '[]'::jsonb, 0, 'From x - y = 1, we get y = x - 1. Substituting in first equation: 3x + 2(x-1) = 12, so 5x = 14, x = 2.8 ≈ 3', NULL, 2, 0.5, 'hard', 'quantitative-aptitude', 'algebra', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: general-awareness-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'general-awareness-paper-1', 'general-awareness-paper-1', NULL, 60, 3, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.447Z","updated_at":"2025-09-23T08:46:58.447Z"}'::jsonb)
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

-- Questions for general-awareness-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-awareness-paper-1'), 1, 'Who was the first Prime Minister of India?', 'भारत के पहले प्रधानमंत्री कौन थे?', '["Mahatma Gandhi","Jawaharlal Nehru","Sardar Patel","Dr. Rajendra Prasad"]'::jsonb, '[]'::jsonb, 0, 'Jawaharlal Nehru was the first Prime Minister of India from 1947 to 1964.', NULL, 2, 0.5, 'easy', 'general-awareness', 'history', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-awareness-paper-1'), 2, 'Which is the largest state in India by area?', 'क्षेत्रफल के अनुसार भारत का सबसे बड़ा राज्य कौन सा है?', '["Madhya Pradesh","Rajasthan","Maharashtra","Uttar Pradesh"]'::jsonb, '[]'::jsonb, 0, 'Rajasthan is the largest state in India by area with 342,239 square kilometers.', NULL, 2, 0.5, 'easy', 'general-awareness', 'geography', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-awareness-paper-1'), 3, 'What is the chemical symbol for Gold?', 'सोने का रासायनिक प्रतीक क्या है?', '["Go","Gd","Au","Ag"]'::jsonb, '[]'::jsonb, 0, 'The chemical symbol for Gold is Au (from Latin ''aurum'').', NULL, 2, 0.5, 'medium', 'general-awareness', 'science', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: general-intelligence-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'practice', 'general-intelligence-paper-1', 'general-intelligence-paper-1', NULL, 60, 3, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.448Z","updated_at":"2025-09-23T08:46:58.448Z"}'::jsonb)
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

-- Questions for general-intelligence-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-intelligence-paper-1'), 1, 'Complete the series: 2, 6, 12, 20, ?', 'श्रृंखला पूरी करें: 2, 6, 12, 20, ?', '["28","30","32","36"]'::jsonb, '[]'::jsonb, 0, 'The series follows: 1×2, 2×3, 3×4, 4×5, so next is 5×6 = 30', NULL, 2, 0.5, 'medium', 'general-intelligence', 'series', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-intelligence-paper-1'), 2, 'If BOOK is coded as CPPL, how is READ coded?', 'यदि BOOK को CPPL लिखा जाता है, तो READ को कैसे लिखा जाएगा?', '["SFBE","SFBF","SFBG","SFBH"]'::jsonb, '[]'::jsonb, 0, 'Each letter is moved one position forward: B→C, O→P, O→P, K→L. So READ becomes SFBE.', NULL, 2, 0.5, 'medium', 'general-intelligence', 'coding-decoding', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'practice' AND test_id = 'general-intelligence-paper-1'), 3, 'Find the odd one out: Apple, Orange, Banana, Carrot', 'विषम चुनें: Apple, Orange, Banana, Carrot', '["Apple","Orange","Banana","Carrot"]'::jsonb, '[]'::jsonb, 0, 'Carrot is a vegetable while Apple, Orange, and Banana are fruits.', NULL, 2, 0.5, 'easy', 'general-intelligence', 'classification', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2024-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-1', '2024-paper-1', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2024-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-1'), 1, 'What is the value of 25 × 4?', '25 × 4 का मान क्या है?', '["90","100","110","120"]'::jsonb, '[]'::jsonb, 0, '25 × 4 = 100. This is a basic multiplication problem.', NULL, 2, 0.5, 'easy', 'quantitative-aptitude', 'arithmetic', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-1'), 2, 'Which of the following is a prime number?', 'निम्नलिखित में से कौन सी अभाज्य संख्या है?', '["15","17","21","25"]'::jsonb, '[]'::jsonb, 0, '17 is a prime number because it has only two factors: 1 and 17.', NULL, 2, 0.5, 'medium', 'quantitative-aptitude', 'number-system', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2024-paper-2
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-2', '2024-paper-2', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2024-paper-2
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-2'), 1, 'What is the capital of Maharashtra?', 'महाराष्ट्र की राजधानी क्या है?', '["Pune","Mumbai","Nagpur","Nashik"]'::jsonb, '[]'::jsonb, 0, 'Mumbai is the capital of Maharashtra.', NULL, 2, 0.5, 'easy', 'general-awareness', 'geography', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-2'), 2, 'Who wrote the book ''Gitanjali''?', '''गीतांजलि'' पुस्तक किसने लिखी?', '["Rabindranath Tagore","Bankim Chandra Chatterjee","Sarat Chandra Chattopadhyay","Mahatma Gandhi"]'::jsonb, '[]'::jsonb, 0, 'Rabindranath Tagore wrote ''Gitanjali'' and won the Nobel Prize in Literature in 1913.', NULL, 2, 0.5, 'medium', 'general-awareness', 'literature', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2024-paper-3
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-3', '2024-paper-3', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2024-paper-3
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-3'), 1, 'What is the synonym of ''Beautiful''?', '''Beautiful'' का समानार्थी शब्द क्या है?', '["Ugly","Pretty","Bad","Worst"]'::jsonb, '[]'::jsonb, 0, 'Pretty is a synonym of beautiful, both meaning attractive or pleasing.', NULL, 2, 0.5, 'easy', 'english-language', 'vocabulary', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-3'), 2, 'Complete the series: 2, 4, 8, 16, ?', 'श्रृंखला पूरी करें: 2, 4, 8, 16, ?', '["24","32","20","28"]'::jsonb, '[]'::jsonb, 0, 'The series follows the pattern: each number is multiplied by 2. So 16 × 2 = 32.', NULL, 2, 0.5, 'medium', 'general-intelligence', 'series', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2024-paper-4
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-4', '2024-paper-4', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2024-paper-4
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-4'), 1, 'Which year was the first SSC CGL exam conducted?', 'पहली SSC CGL परीक्षा किस वर्ष आयोजित की गई थी?', '["1975","1980","1985","1990"]'::jsonb, '[]'::jsonb, 0, 'The first SSC CGL exam was conducted in 1975.', NULL, 2, 0.5, 'medium', 'general-awareness', 'history', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-4'), 2, 'What is the full form of SSC?', 'SSC का पूरा नाम क्या है?', '["Staff Selection Commission","State Selection Commission","Service Selection Commission","Staff Service Commission"]'::jsonb, '[]'::jsonb, 0, 'SSC stands for Staff Selection Commission.', NULL, 2, 0.5, 'easy', 'general-awareness', 'general-knowledge', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2024-paper-5
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2024-paper-5', '2024-paper-5', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2024-paper-5
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-5'), 1, 'What is the area of a circle with radius 7 cm?', '7 सेमी त्रिज्या वाले वृत्त का क्षेत्रफल क्या है?', '["154 cm²","44 cm²","22 cm²","88 cm²"]'::jsonb, '[]'::jsonb, 0, 'Area of circle = πr² = (22/7) × 7 × 7 = 154 cm²', NULL, 2, 0.5, 'medium', 'quantitative-aptitude', 'geometry', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2024-paper-5'), 2, 'Which is the longest river in India?', 'भारत की सबसे लंबी नदी कौन सी है?', '["Yamuna","Ganga","Brahmaputra","Godavari"]'::jsonb, '[]'::jsonb, 0, 'Ganga is the longest river in India with a length of about 2,525 km.', NULL, 2, 0.5, 'easy', 'general-awareness', 'geography', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2023-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2023-paper-1', '2023-paper-1', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.449Z","updated_at":"2025-09-23T08:46:58.449Z"}'::jsonb)
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

-- Questions for 2023-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2023-paper-1'), 1, 'Which planet is known as the Red Planet?', 'लाल ग्रह के रूप में किस ग्रह को जाना जाता है?', '["Venus","Mars","Jupiter","Saturn"]'::jsonb, '[]'::jsonb, 0, 'Mars is known as the Red Planet due to its reddish appearance.', NULL, 2, 0.5, 'easy', 'general-awareness', 'science', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2023-paper-1'), 2, 'What is the chemical symbol for Gold?', 'सोने का रासायनिक प्रतीक क्या है?', '["Go","Gd","Au","Ag"]'::jsonb, '[]'::jsonb, 0, 'The chemical symbol for Gold is Au (from Latin ''aurum'').', NULL, 2, 0.5, 'medium', 'general-awareness', 'science', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Test: 2021-paper-1
INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES
('ssc-cgl', 'pyq', '2021-paper-1', '2021-paper-1', NULL, 60, 2, '["General Knowledge"]'::jsonb, '{"correct":2,"incorrect":0.5,"unattempted":0}'::jsonb, false, 0, '{"created_at":"2025-09-23T08:46:58.450Z","updated_at":"2025-09-23T08:46:58.450Z"}'::jsonb)
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

-- Questions for 2021-paper-1
INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2021-paper-1'), 1, 'Which is the smallest state in India?', 'भारत का सबसे छोटा राज्य कौन सा है?', '["Goa","Sikkim","Tripura","Mizoram"]'::jsonb, '[]'::jsonb, 0, 'Goa is the smallest state in India by area.', NULL, 2, 0.5, 'easy', 'general-awareness', 'geography', NULL),
(SELECT id FROM exam_test_data WHERE exam_id = 'ssc-cgl' AND test_type = 'pyq' AND test_id = '2021-paper-1'), 2, 'What is the currency of Japan?', 'जापान की मुद्रा क्या है?', '["Yuan","Yen","Won","Dong"]'::jsonb, '[]'::jsonb, 0, 'The currency of Japan is Yen.', NULL, 2, 0.5, 'easy', 'general-awareness', 'general-knowledge', NULL)
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
    topic = EXCLUDED.topic,
    image_url = EXCLUDED.image_url;

-- Migration Summary
-- Total tests migrated: 16
-- Total questions migrated: 38

-- Verification queries
SELECT 'Test Data Count:' as info, COUNT(*) as count FROM exam_test_data;
SELECT 'Questions Count:' as info, COUNT(*) as count FROM exam_questions;
SELECT 'Exams:' as info, COUNT(DISTINCT exam_id) as count FROM exam_test_data;
SELECT 'Test Types:' as info, COUNT(DISTINCT test_type) as count FROM exam_test_data;
