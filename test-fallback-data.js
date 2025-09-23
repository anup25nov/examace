#!/usr/bin/env node

/**
 * Test script to verify fallback data is working
 */

import { secureFallbackService } from './src/lib/secureFallbackService.js';
import { secureTestDataLoader } from './src/lib/secureTestDataLoader.js';

console.log('🧪 Testing Fallback Data Loading...\n');

// Test 1: Check fallback service
console.log('📊 Test 1: Fallback Service');
try {
  const fallbackData = secureFallbackService.getAllFallbackTestData('ssc-cgl');
  console.log('✅ Mock tests:', fallbackData.mock.length);
  console.log('✅ PYQ tests:', fallbackData.pyq.length);
  console.log('✅ Practice tests:', fallbackData.practice.length);
  
  if (fallbackData.mock.length > 0) {
    console.log('   First mock test:', fallbackData.mock[0].name);
  }
  if (fallbackData.pyq.length > 0) {
    console.log('   First PYQ test:', fallbackData.pyq[0].name);
  }
} catch (error) {
  console.error('❌ Fallback service error:', error.message);
}

console.log('\n📊 Test 2: Secure Test Data Loader');
try {
  const testData = await secureTestDataLoader.getAllTestData('ssc-cgl');
  console.log('✅ Mock tests:', testData.mock.length);
  console.log('✅ PYQ tests:', testData.pyq.length);
  console.log('✅ Practice tests:', testData.practice.length);
  
  if (testData.mock.length > 0) {
    console.log('   First mock test:', testData.mock[0].name);
  }
  if (testData.pyq.length > 0) {
    console.log('   First PYQ test:', testData.pyq[0].name);
  }
} catch (error) {
  console.error('❌ Test data loader error:', error.message);
}

console.log('\n🎯 Summary:');
console.log('- Fallback data should provide test cards');
console.log('- If database is not available, fallback should work');
console.log('- Check browser console for any errors');
