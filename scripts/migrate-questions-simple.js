#!/usr/bin/env node

/**
 * Simple migration script to migrate questions from JSON files to database
 * Run with: node scripts/migrate-questions-simple.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const QUESTIONS_DIR = path.join(__dirname, '..', 'src', 'data', 'questions');
const EXAMS = ['ssc-cgl'];
const SECTIONS = ['mock', 'pyq', 'practice'];

// Sample data to insert
const sampleTestData = [
  {
    exam_id: 'ssc-cgl',
    test_type: 'mock',
    test_id: 'mock-paper-1',
    name: 'SSC CGL Mock Test 1',
    description: 'Comprehensive mock test for SSC CGL preparation',
    duration: 120,
    total_questions: 100,
    subjects: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    correct_marks: 1,
    incorrect_marks: 0.25,
    is_premium: true
  },
  {
    exam_id: 'ssc-cgl',
    test_type: 'pyq',
    test_id: '2024-paper-1',
    name: 'SSC CGL 2024 Paper 1',
    description: 'Previous year question paper from SSC CGL 2024',
    duration: 120,
    total_questions: 100,
    subjects: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
    correct_marks: 1,
    incorrect_marks: 0.25,
    is_premium: true
  },
  {
    exam_id: 'ssc-cgl',
    test_type: 'practice',
    test_id: 'english-grammar-paper-1',
    name: 'English Grammar Practice',
    description: 'Practice questions for English Grammar',
    duration: 60,
    total_questions: 50,
    subjects: ['English Grammar'],
    correct_marks: 1,
    incorrect_marks: 0.25,
    is_premium: false
  }
];

const sampleQuestions = [
  {
    exam_id: 'ssc-cgl',
    test_type: 'mock',
    test_id: 'mock-paper-1',
    question_order: 1,
    question_en: 'What is the capital of India?',
    question_hi: 'भारत की राजधानी क्या है?',
    options: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
    correct_answer: 0,
    difficulty: 'easy',
    subject: 'General Awareness',
    topic: 'Geography',
    marks: 1,
    negative_marks: 0.25,
    duration: 60,
    explanation: 'Delhi is the capital of India.'
  },
  {
    exam_id: 'ssc-cgl',
    test_type: 'mock',
    test_id: 'mock-paper-1',
    question_order: 2,
    question_en: 'What is 2 + 2?',
    question_hi: '2 + 2 क्या है?',
    options: ['3', '4', '5', '6'],
    correct_answer: 1,
    difficulty: 'easy',
    subject: 'Quantitative Aptitude',
    topic: 'Basic Arithmetic',
    marks: 1,
    negative_marks: 0.25,
    duration: 60,
    explanation: '2 + 2 = 4'
  }
];

function generateSQL() {
  let sql = '-- Migration SQL for questions\n\n';
  
  // Insert test data
  sql += '-- Insert test data\n';
  sql += 'INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration, total_questions, subjects, correct_marks, incorrect_marks, is_premium) VALUES\n';
  
  sampleTestData.forEach((test, index) => {
    const subjectsJson = JSON.stringify(test.subjects);
    sql += `('${test.exam_id}', '${test.test_type}', '${test.test_id}', '${test.name}', '${test.description}', ${test.duration}, ${test.total_questions}, '${subjectsJson}', ${test.correct_marks}, ${test.incorrect_marks}, ${test.is_premium})`;
    if (index < sampleTestData.length - 1) sql += ',\n';
    else sql += '\n';
  });
  
  sql += 'ON CONFLICT (exam_id, test_type, test_id) DO NOTHING;\n\n';
  
  // Insert questions
  sql += '-- Insert questions\n';
  sql += 'INSERT INTO exam_questions (exam_id, test_type, test_id, question_order, question_en, question_hi, options, correct_answer, difficulty, subject, topic, marks, negative_marks, duration, explanation) VALUES\n';
  
  sampleQuestions.forEach((question, index) => {
    const optionsJson = JSON.stringify(question.options);
    sql += `('${question.exam_id}', '${question.test_type}', '${question.test_id}', ${question.question_order}, '${question.question_en}', '${question.question_hi}', '${optionsJson}', ${question.correct_answer}, '${question.difficulty}', '${question.subject}', '${question.topic}', ${question.marks}, ${question.negative_marks}, ${question.duration}, '${question.explanation}')`;
    if (index < sampleQuestions.length - 1) sql += ',\n';
    else sql += '\n';
  });
  
  sql += 'ON CONFLICT DO NOTHING;\n\n';
  
  return sql;
}

function migrateQuestions() {
  console.log('🚀 Starting question migration...');
  
  // Check if questions directory exists
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.log('❌ Questions directory not found:', QUESTIONS_DIR);
    return;
  }
  
  console.log('📁 Found questions directory:', QUESTIONS_DIR);
  
  // Generate SQL
  const sql = generateSQL();
  
  // Write SQL to file
  const outputFile = path.join(__dirname, '..', 'migrate_questions_data.sql');
  fs.writeFileSync(outputFile, sql);
  
  console.log('✅ Generated migration SQL:', outputFile);
  console.log('\n📋 Next steps:');
  console.log('1. Copy the content from migrate_questions_data.sql');
  console.log('2. Paste it into your Supabase SQL Editor');
  console.log('3. Run the SQL to insert the sample data');
  console.log('4. Update your frontend to use secure functions');
  
  // Also show the SQL content
  console.log('\n📄 Generated SQL:');
  console.log('='.repeat(50));
  console.log(sql);
  console.log('='.repeat(50));
}

// Run migration
migrateQuestions();
