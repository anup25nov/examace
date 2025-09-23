#!/usr/bin/env node

/**
 * Dynamic migration script to migrate questions from JSON files to database
 * This script reads all JSON files and dynamically creates database entries
 * Run with: node scripts/dynamic-migrate-questions.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const QUESTIONS_DIR = path.join(__dirname, '..', 'src', 'data', 'questions');
const OUTPUT_FILE = path.join(__dirname, '..', 'dynamic_migration_complete.sql');

// Helper function to escape SQL strings
function escapeSqlString(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Helper function to create JSONB string
function createJsonbString(obj) {
  if (!obj) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

// Helper function to determine if a test is premium
function isPremiumTest(test) {
  return test.isPremium === true || test.premium === true || test.price > 0;
}

// Helper function to get test duration in minutes
function getDurationInMinutes(test) {
  if (test.duration) {
    // If duration is in seconds, convert to minutes
    return test.duration > 100 ? Math.round(test.duration / 60) : test.duration;
  }
  return 60; // Default 1 hour
}

// Helper function to get total questions count
function getTotalQuestions(test) {
  if (test.questions && Array.isArray(test.questions)) {
    return test.questions.length;
  }
  if (test.totalQuestions) {
    return test.totalQuestions;
  }
  return 100; // Default
}

// Helper function to get subjects array
function getSubjects(test) {
  if (test.subjects && Array.isArray(test.subjects)) {
    return test.subjects;
  }
  if (test.subject) {
    return [test.subject];
  }
  return ['General Knowledge']; // Default
}

// Helper function to get marking scheme
function getMarkingScheme(test) {
  if (test.markingScheme) {
    return test.markingScheme;
  }
  if (test.marking) {
    return test.marking;
  }
  // Try to get from first question
  if (test.questions && test.questions.length > 0) {
    const firstQuestion = test.questions[0];
    return {
      correct: firstQuestion.marks || 1,
      incorrect: firstQuestion.negativeMarks || 0.25,
      unattempted: 0
    };
  }
  return { correct: 1, incorrect: 0.25, unattempted: 0 };
}

// Helper function to get metadata
function getMetadata(test) {
  const metadata = { ...test.metadata };
  
  // Add common metadata
  if (test.year) metadata.year = test.year;
  if (test.day) metadata.day = test.day;
  if (test.shift) metadata.shift = test.shift;
  if (test.paper) metadata.paper = test.paper;
  if (test.date) metadata.date = test.date;
  if (test.difficulty) metadata.difficulty = test.difficulty;
  if (test.order) metadata.order = test.order;
  
  // Add timestamps
  metadata.created_at = new Date().toISOString();
  metadata.updated_at = new Date().toISOString();
  
  return metadata;
}

// Process a single test file
function processTestFile(examId, sectionId, testId, testData) {
  const sql = [];
  
  // Determine if test is premium
  const isPremium = isPremiumTest(testData);
  const duration = getDurationInMinutes(testData);
  const totalQuestions = getTotalQuestions(testData);
  const subjects = getSubjects(testData);
  const markingScheme = getMarkingScheme(testData);
  const metadata = getMetadata(testData);
  
  // Insert test data
  sql.push(`-- Test: ${testData.name || testId}`);
  sql.push(`INSERT INTO exam_test_data (exam_id, test_type, test_id, name, description, duration_minutes, total_questions, subjects, marking_scheme, is_premium, price, metadata) VALUES`);
  sql.push(`('${examId}', '${sectionId}', '${testId}', ${escapeSqlString(testData.name || testId)}, ${escapeSqlString(testData.description || '')}, ${duration}, ${totalQuestions}, ${createJsonbString(subjects)}, ${createJsonbString(markingScheme)}, ${isPremium}, ${testData.price || 0.00}, ${createJsonbString(metadata)})`);
  sql.push(`ON CONFLICT (exam_id, test_type, test_id) DO UPDATE SET`);
  sql.push(`    name = EXCLUDED.name,`);
  sql.push(`    description = EXCLUDED.description,`);
  sql.push(`    duration_minutes = EXCLUDED.duration_minutes,`);
  sql.push(`    total_questions = EXCLUDED.total_questions,`);
  sql.push(`    subjects = EXCLUDED.subjects,`);
  sql.push(`    marking_scheme = EXCLUDED.marking_scheme,`);
  sql.push(`    is_premium = EXCLUDED.is_premium,`);
  sql.push(`    price = EXCLUDED.price,`);
  sql.push(`    metadata = EXCLUDED.metadata;`);
  sql.push('');
  
  // Process questions
  if (testData.questions && Array.isArray(testData.questions)) {
    sql.push(`-- Questions for ${testId}`);
    sql.push(`INSERT INTO exam_questions (exam_test_data_id, question_number, question_en, question_hi, options_en, options_hi, correct_answer_index, explanation_en, explanation_hi, marks, negative_marks, difficulty, subject, topic, image_url) VALUES`);
    
    const questionValues = testData.questions.map((question, index) => {
      const questionNumber = index + 1;
      const questionEn = question.questionEn || question.question || question.questionText || '';
      const questionHi = question.questionHi || question.questionHindi || '';
      const optionsEn = question.optionsEn || question.options || question.choices || [];
      const optionsHi = question.optionsHi || question.optionsHindi || [];
      const correctAnswer = question.correctAnswerIndex !== undefined ? question.correctAnswerIndex : (question.correctAnswer || 0);
      const explanationEn = question.explanationEn || question.explanation || question.solution || '';
      const explanationHi = question.explanationHi || question.explanationHindi || '';
      const marks = question.marks || 1.00;
      const negativeMarks = question.negativeMarks || 0.25;
      const difficulty = question.difficulty || 'medium';
      const subject = question.subject || 'General Knowledge';
      const topic = question.topic || question.chapter || '';
      const imageUrl = question.imageUrl || question.image || '';
      
      return `(SELECT id FROM exam_test_data WHERE exam_id = '${examId}' AND test_type = '${sectionId}' AND test_id = '${testId}'), ${questionNumber}, ${escapeSqlString(questionEn)}, ${escapeSqlString(questionHi)}, ${createJsonbString(optionsEn)}, ${createJsonbString(optionsHi)}, ${correctAnswer}, ${escapeSqlString(explanationEn)}, ${escapeSqlString(explanationHi)}, ${marks}, ${negativeMarks}, ${escapeSqlString(difficulty)}, ${escapeSqlString(subject)}, ${escapeSqlString(topic)}, ${escapeSqlString(imageUrl)})`;
    });
    
    sql.push(questionValues.join(',\n'));
    sql.push(`ON CONFLICT (exam_test_data_id, question_number) DO UPDATE SET`);
    sql.push(`    question_en = EXCLUDED.question_en,`);
    sql.push(`    question_hi = EXCLUDED.question_hi,`);
    sql.push(`    options_en = EXCLUDED.options_en,`);
    sql.push(`    options_hi = EXCLUDED.options_hi,`);
    sql.push(`    correct_answer_index = EXCLUDED.correct_answer_index,`);
    sql.push(`    explanation_en = EXCLUDED.explanation_en,`);
    sql.push(`    explanation_hi = EXCLUDED.explanation_hi,`);
    sql.push(`    marks = EXCLUDED.marks,`);
    sql.push(`    negative_marks = EXCLUDED.negative_marks,`);
    sql.push(`    difficulty = EXCLUDED.difficulty,`);
    sql.push(`    subject = EXCLUDED.subject,`);
    sql.push(`    topic = EXCLUDED.topic,`);
    sql.push(`    image_url = EXCLUDED.image_url;`);
    sql.push('');
  }
  
  return sql.join('\n');
}

// Main migration function
async function migrateQuestions() {
  console.log('🚀 Starting dynamic question migration...');
  console.log('📁 Reading from:', QUESTIONS_DIR);
  
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.log('❌ Questions directory not found:', QUESTIONS_DIR);
    return;
  }
  
  let allSql = [];
  let totalTests = 0;
  let totalQuestions = 0;
  
  // Add header
  allSql.push('-- Dynamic Question Migration SQL');
  allSql.push('-- Generated automatically from JSON files');
  allSql.push(`-- Generated at: ${new Date().toISOString()}`);
  allSql.push('');
  
  // Read exam directories
  const examDirs = fs.readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`📚 Found ${examDirs.length} exam directories:`, examDirs);
  
  for (const examId of examDirs) {
    console.log(`\n📖 Processing exam: ${examId}`);
    const examPath = path.join(QUESTIONS_DIR, examId);
    
    // Read section directories
    const sectionDirs = fs.readdirSync(examPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    console.log(`  📂 Found ${sectionDirs.length} sections:`, sectionDirs);
    
    for (const sectionId of sectionDirs) {
      console.log(`    📁 Processing section: ${sectionId}`);
      const sectionPath = path.join(examPath, sectionId);
      
      // Read index.json
      const indexFilePath = path.join(sectionPath, 'index.json');
      if (!fs.existsSync(indexFilePath)) {
        console.log(`      ⚠️  No index.json found in ${sectionId}`);
        continue;
      }
      
      try {
        const indexData = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
        const tests = indexData.tests || [];
        
        console.log(`      📋 Found ${tests.length} tests in index.json`);
        
        for (const test of tests) {
          const testId = test.id;
          const testFilePath = path.join(sectionPath, `${testId}.json`);
          
          if (!fs.existsSync(testFilePath)) {
            console.log(`        ⚠️  Test file not found: ${testId}.json`);
            continue;
          }
          
          try {
            const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
            console.log(`        ✅ Processing test: ${testId} (${testData.questions?.length || 0} questions)`);
            
            const testSql = processTestFile(examId, sectionId, testId, testData);
            allSql.push(testSql);
            
            totalTests++;
            totalQuestions += testData.questions?.length || 0;
            
          } catch (error) {
            console.log(`        ❌ Error processing test ${testId}:`, error.message);
          }
        }
        
      } catch (error) {
        console.log(`      ❌ Error reading index.json:`, error.message);
      }
    }
  }
  
  // Add summary
  allSql.push('-- Migration Summary');
  allSql.push(`-- Total tests migrated: ${totalTests}`);
  allSql.push(`-- Total questions migrated: ${totalQuestions}`);
  allSql.push('');
  
  // Add verification queries
  allSql.push('-- Verification queries');
  allSql.push('SELECT \'Test Data Count:\' as info, COUNT(*) as count FROM exam_test_data;');
  allSql.push('SELECT \'Questions Count:\' as info, COUNT(*) as count FROM exam_questions;');
  allSql.push('SELECT \'Exams:\' as info, COUNT(DISTINCT exam_id) as count FROM exam_test_data;');
  allSql.push('SELECT \'Test Types:\' as info, COUNT(DISTINCT test_type) as count FROM exam_test_data;');
  allSql.push('');
  
  // Write to file
  const finalSql = allSql.join('\n');
  fs.writeFileSync(OUTPUT_FILE, finalSql);
  
  console.log('\n🎉 Migration completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`  - Total tests: ${totalTests}`);
  console.log(`  - Total questions: ${totalQuestions}`);
  console.log(`  - Output file: ${OUTPUT_FILE}`);
  console.log('\n📋 Next steps:');
  console.log('1. Copy the content from dynamic_migration_complete.sql');
  console.log('2. Paste it into your Supabase SQL Editor');
  console.log('3. Run the SQL to migrate all questions');
  console.log('4. Test the secure question loading');
  
  return {
    totalTests,
    totalQuestions,
    outputFile: OUTPUT_FILE
  };
}

// Run migration
migrateQuestions().catch(console.error);
