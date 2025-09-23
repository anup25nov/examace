#!/usr/bin/env node

/**
 * Script to migrate questions from JSON files to secure database storage
 * This ensures questions are not exposed in the network tab
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const QUESTIONS_DIR = path.join(__dirname, '..', 'src', 'data', 'questions');
const EXAMS = ['ssc-cgl']; // Add more exams as needed
const SECTIONS = ['mock', 'pyq', 'practice'];

async function migrateQuestions() {
  console.log('🚀 Starting question migration to secure database...');
  
  for (const examId of EXAMS) {
    console.log(`\n📚 Processing exam: ${examId}`);
    
    for (const sectionId of SECTIONS) {
      console.log(`  📁 Processing section: ${sectionId}`);
      
      const sectionDir = path.join(QUESTIONS_DIR, examId, sectionId);
      if (!fs.existsSync(sectionDir)) {
        console.log(`    ⚠️  Section directory not found: ${sectionDir}`);
        continue;
      }
      
      // Load index.json to get test metadata
      const indexPath = path.join(sectionDir, 'index.json');
      if (!fs.existsSync(indexPath)) {
        console.log(`    ⚠️  Index file not found: ${indexPath}`);
        continue;
      }
      
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const tests = indexData.tests || [];
      
      for (const test of tests) {
        console.log(`    📄 Processing test: ${test.id}`);
        
        // Load test data
        const testFilePath = path.join(sectionDir, `${test.id}.json`);
        if (!fs.existsSync(testFilePath)) {
          console.log(`      ⚠️  Test file not found: ${testFilePath}`);
          continue;
        }
        
        const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
        
        // Insert test metadata
        const { error: testError } = await supabase
          .from('exam_test_data')
          .upsert({
            exam_id: examId,
            test_type: sectionId,
            test_id: test.id,
            name: test.name || `${sectionId} Test ${test.id}`,
            description: test.description || '',
            duration: test.duration || 60,
            total_questions: testData.questions?.length || 0,
            subjects: test.subjects || ['General'],
            correct_marks: test.markingScheme?.correct || 1,
            incorrect_marks: test.markingScheme?.incorrect || 0.25,
            is_premium: test.isPremium || false
          });
        
        if (testError) {
          console.error(`      ❌ Error inserting test data: ${testError.message}`);
          continue;
        }
        
        console.log(`      ✅ Test metadata inserted`);
        
        // Insert questions
        if (testData.questions && Array.isArray(testData.questions)) {
          const questions = testData.questions.map((q, index) => ({
            exam_id: examId,
            test_type: sectionId,
            test_id: test.id,
            question_order: index + 1,
            question_en: q.questionEn || q.question || '',
            question_hi: q.questionHi || '',
            options: q.options || [],
            correct_answer: q.correct || 0,
            difficulty: q.difficulty || 'medium',
            subject: q.subject || 'general',
            topic: q.topic || 'general',
            marks: q.marks || 1,
            negative_marks: q.negativeMarks || 0.25,
            duration: q.duration || 60,
            explanation: q.explanation || '',
            question_image: q.questionImage || null,
            options_images: q.optionsImages || null,
            explanation_image: q.explanationImage || null
          }));
          
          const { error: questionsError } = await supabase
            .from('exam_questions')
            .upsert(questions);
          
          if (questionsError) {
            console.error(`      ❌ Error inserting questions: ${questionsError.message}`);
            continue;
          }
          
          console.log(`      ✅ ${questions.length} questions inserted`);
        }
      }
    }
  }
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Deploy the Supabase function: get-test-questions');
  console.log('2. Update your frontend to use secureDynamicQuestionLoader');
  console.log('3. Remove or secure the JSON question files');
  console.log('4. Test the secure question loading');
}

// Run migration
migrateQuestions().catch(console.error);
