#!/usr/bin/env node

/**
 * Test script to verify secure question loading implementation
 * Run with: node test-secure-implementation.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔒 Testing Secure Question Loading Implementation');
console.log('='.repeat(50));

async function testSecureImplementation() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check if tables exist
    console.log('\n📊 Test 1: Checking database tables...');
    
    const { data: testData, error: testDataError } = await supabase
      .from('exam_test_data')
      .select('*')
      .limit(1);
    
    if (testDataError) {
      console.log('❌ exam_test_data table not found or not accessible');
      console.log('Error:', testDataError.message);
    } else {
      console.log('✅ exam_test_data table exists and accessible');
    }
    
    const { data: questionsData, error: questionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(1);
    
    if (questionsError) {
      console.log('❌ exam_questions table not found or not accessible');
      console.log('Error:', questionsError.message);
    } else {
      console.log('✅ exam_questions table exists and accessible');
    }
    
    // Test 2: Check if RPC functions exist
    console.log('\n🔧 Test 2: Checking RPC functions...');
    
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_test_questions', {
        p_exam_id: 'ssc-cgl',
        p_test_type: 'pyq',
        p_test_id: '2024-paper-1',
        p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        p_is_premium_test: false
      });
    
    if (rpcError) {
      console.log('❌ get_test_questions RPC function not found or not working');
      console.log('Error:', rpcError.message);
    } else {
      console.log('✅ get_test_questions RPC function exists and working');
      console.log('Sample data:', rpcData ? 'Questions found' : 'No questions');
    }
    
    // Test 3: Check if Supabase function exists
    console.log('\n🌐 Test 3: Checking Supabase Edge Function...');
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-test-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          exam_id: 'ssc-cgl',
          test_type: 'pyq',
          test_id: '2024-paper-1',
          user_id: '00000000-0000-0000-0000-000000000000',
          is_premium_test: false
        })
      });
      
      if (response.ok) {
        console.log('✅ Supabase Edge Function is deployed and accessible');
      } else {
        console.log('❌ Supabase Edge Function not accessible');
        console.log('Status:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Supabase Edge Function not accessible');
      console.log('Error:', error.message);
    }
    
    // Test 4: Check data migration
    console.log('\n📦 Test 4: Checking data migration...');
    
    const { data: allTestData, error: allTestError } = await supabase
      .from('exam_test_data')
      .select('*')
      .eq('exam_id', 'ssc-cgl');
    
    if (allTestError) {
      console.log('❌ Error fetching test data:', allTestError.message);
    } else {
      console.log(`✅ Found ${allTestData?.length || 0} test records for SSC CGL`);
      if (allTestData && allTestData.length > 0) {
        console.log('Sample test:', allTestData[0].name);
      }
    }
    
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(5);
    
    if (allQuestionsError) {
      console.log('❌ Error fetching questions:', allQuestionsError.message);
    } else {
      console.log(`✅ Found ${allQuestions?.length || 0} question records`);
      if (allQuestions && allQuestions.length > 0) {
        console.log('Sample question:', allQuestions[0].question_en?.substring(0, 50) + '...');
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Database tables: ' + (testData && questionsData ? '✅' : '❌'));
    console.log('- RPC functions: ' + (rpcData !== undefined ? '✅' : '❌'));
    console.log('- Edge function: ' + (response?.ok ? '✅' : '❌'));
    console.log('- Data migrated: ' + (allTestData && allQuestions ? '✅' : '❌'));
    
    if (testData && questionsData && rpcData !== undefined && allTestData && allQuestions) {
      console.log('\n🎉 Secure implementation is ready!');
      console.log('\n📋 Next steps:');
      console.log('1. Test the frontend with secure question loading');
      console.log('2. Verify questions are not visible in network tab');
      console.log('3. Test premium access controls');
    } else {
      console.log('\n⚠️  Some components need attention. Check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testSecureImplementation();
