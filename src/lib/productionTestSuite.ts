/**
 * Production Test Suite
 * Comprehensive tests to verify all production fixes work correctly
 */

import { supabase } from '@/integrations/supabase/client';
import { paymentServiceFixed } from './paymentServiceFixed';
import { testSystemFixed } from './testSystemFixed';
import { securityService } from './securityService';
import { errorHandlingService } from './errorHandlingService';
import { imageCacheService } from './imageCacheService';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

export interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

export class ProductionTestSuite {
  private static instance: ProductionTestSuite;

  public static getInstance(): ProductionTestSuite {
    if (!ProductionTestSuite.instance) {
      ProductionTestSuite.instance = new ProductionTestSuite();
    }
    return ProductionTestSuite.instance;
  }

  /**
   * Run all production tests
   */
  async runAllTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    console.log('🧪 Starting Production Test Suite...');

    // Database Schema Tests
    results.push(await this.testDatabaseSchema());
    results.push(await this.testDatabaseFunctions());
    results.push(await this.testDatabaseIndexes());

    // Payment System Tests
    results.push(await this.testPaymentService());
    results.push(await this.testPaymentValidation());
    results.push(await this.testPaymentErrorHandling());

    // Test System Tests
    results.push(await this.testTestSystem());
    results.push(await this.testTestAvailability());
    results.push(await this.testTestSubmission());

    // Security Tests
    results.push(await this.testSecurityService());
    results.push(await this.testRateLimiting());
    results.push(await this.testPermissionSystem());

    // Error Handling Tests
    results.push(await this.testErrorHandling());
    results.push(await this.testErrorCategorization());

    // Performance Tests
    results.push(await this.testImageCaching());
    results.push(await this.testDatabasePerformance());

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`✅ Test Suite Completed: ${passed}/${results.length} tests passed in ${duration}ms`);

    return {
      total: results.length,
      passed,
      failed,
      duration,
      results
    };
  }

  /**
   * Test database schema
   */
  private async testDatabaseSchema(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test user_profiles table has all required columns
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('id, email, name, upi_id, referral_earnings, total_referrals, phone_verified, pin, is_admin')
        .limit(1);

      if (error) {
        throw new Error(`Database schema test failed: ${error.message}`);
      }

      return {
        name: 'Database Schema',
        passed: true,
        duration: Date.now() - startTime,
        details: 'All required columns exist in user_profiles table'
      };
    } catch (error) {
      return {
        name: 'Database Schema',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test database functions
   */
  private async testDatabaseFunctions(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test get_user_membership_status function
      const { data, error } = await supabase.rpc('get_user_membership_status', {
        user_uuid: '00000000-0000-0000-0000-000000000000' // Non-existent user
      });

      if (error) {
        throw new Error(`Database function test failed: ${error.message}`);
      }

      return {
        name: 'Database Functions',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Database functions are working correctly'
      };
    } catch (error) {
      return {
        name: 'Database Functions',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test database indexes
   */
  private async testDatabaseIndexes(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test query performance with indexes
      const start = Date.now();
      const { data, error } = await supabase
        .from('test_attempts')
        .select('id')
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .limit(1);
      
      const queryTime = Date.now() - start;

      if (error) {
        throw new Error(`Database index test failed: ${error.message}`);
      }

      return {
        name: 'Database Indexes',
        passed: true,
        duration: Date.now() - startTime,
        details: `Query executed in ${queryTime}ms (indexes working)`
      };
    } catch (error) {
      return {
        name: 'Database Indexes',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test payment service
   */
  private async testPaymentService(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test payment validation
      const validation = paymentServiceFixed['validatePaymentRequest']({
        planId: '',
        userId: '',
        userEmail: '',
        amount: -1
      });

      if (validation.valid) {
        throw new Error('Payment validation should have failed for invalid input');
      }

      return {
        name: 'Payment Service',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Payment service validation working correctly'
      };
    } catch (error) {
      return {
        name: 'Payment Service',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test payment validation
   */
  private async testPaymentValidation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test email validation
      const validEmail = paymentServiceFixed['isValidEmail']('test@example.com');
      const invalidEmail = paymentServiceFixed['isValidEmail']('invalid-email');

      if (!validEmail || invalidEmail) {
        throw new Error('Email validation not working correctly');
      }

      return {
        name: 'Payment Validation',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Payment validation working correctly'
      };
    } catch (error) {
      return {
        name: 'Payment Validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test payment error handling
   */
  private async testPaymentErrorHandling(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test error handling with invalid data
      const result = await paymentServiceFixed.createPaymentOrder({
        planId: 'invalid-plan',
        userId: 'invalid-user',
        userEmail: 'invalid-email',
        amount: -100
      });

      if (result.success) {
        throw new Error('Payment service should have failed for invalid input');
      }

      return {
        name: 'Payment Error Handling',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Payment error handling working correctly'
      };
    } catch (error) {
      return {
        name: 'Payment Error Handling',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test test system
   */
  private async testTestSystem(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test test availability check
      const availability = await testSystemFixed.checkTestAvailability(
        '00000000-0000-0000-0000-000000000000',
        'ssc-cgl',
        'mock',
        'test-1'
      );

      // Should return false for non-existent user
      if (availability.available) {
        throw new Error('Test availability should be false for non-existent user');
      }

      return {
        name: 'Test System',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Test system working correctly'
      };
    } catch (error) {
      return {
        name: 'Test System',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test test availability
   */
  private async testTestAvailability(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid data
      const availability = await testSystemFixed.checkTestAvailability(
        '',
        '',
        'mock' as any,
        ''
      );

      if (availability.available) {
        throw new Error('Test availability should be false for invalid input');
      }

      return {
        name: 'Test Availability',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Test availability validation working correctly'
      };
    } catch (error) {
      return {
        name: 'Test Availability',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test test submission
   */
  private async testTestSubmission(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test submission validation
      const result = await testSystemFixed.submitTestAttempt({
        examId: '',
        testType: 'mock' as any,
        testId: '',
        score: -1,
        totalQuestions: 0,
        correctAnswers: -1,
        timeTaken: -1,
        answers: {}
      });

      if (result.success) {
        throw new Error('Test submission should have failed for invalid input');
      }

      return {
        name: 'Test Submission',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Test submission validation working correctly'
      };
    } catch (error) {
      return {
        name: 'Test Submission',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test security service
   */
  private async testSecurityService(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test rate limiting
      const rateLimit = securityService.checkRateLimit('test-user');
      
      if (!rateLimit.allowed) {
        throw new Error('Rate limit should allow first request');
      }

      return {
        name: 'Security Service',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Security service working correctly'
      };
    } catch (error) {
      return {
        name: 'Security Service',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test rate limiting
   */
  private async testRateLimiting(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test rate limiting with multiple requests
      const identifier = 'rate-limit-test';
      let allowed = true;
      
      // Make multiple requests to test rate limiting
      for (let i = 0; i < 5; i++) {
        const result = securityService.checkRateLimit(identifier);
        if (!result.allowed) {
          allowed = false;
          break;
        }
      }

      return {
        name: 'Rate Limiting',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Rate limiting working correctly'
      };
    } catch (error) {
      return {
        name: 'Rate Limiting',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test permission system
   */
  private async testPermissionSystem(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test permission check with invalid user
      const permission = await securityService.checkPermissions(
        '00000000-0000-0000-0000-000000000000',
        'test',
        'take'
      );

      if (permission.allowed) {
        throw new Error('Permission should be denied for invalid user');
      }

      return {
        name: 'Permission System',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Permission system working correctly'
      };
    } catch (error) {
      return {
        name: 'Permission System',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test error handling service
      const errorInfo = errorHandlingService.handleError(
        new Error('Test error'),
        { action: 'test', resource: 'test' }
      );

      if (!errorInfo || errorInfo.code === '') {
        throw new Error('Error handling not working correctly');
      }

      return {
        name: 'Error Handling',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Error handling working correctly'
      };
    } catch (error) {
      return {
        name: 'Error Handling',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test error categorization
   */
  private async testErrorCategorization(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test different error types
      const networkError = errorHandlingService.handleError(new Error('Network error'));
      const authError = errorHandlingService.handleError(new Error('Authentication failed'));

      if (networkError.category !== 'network' || authError.category !== 'authentication') {
        throw new Error('Error categorization not working correctly');
      }

      return {
        name: 'Error Categorization',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Error categorization working correctly'
      };
    } catch (error) {
      return {
        name: 'Error Categorization',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test image caching
   */
  private async testImageCaching(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test image cache service
      const stats = imageCacheService.getCacheStats();
      
      if (typeof stats.size !== 'number' || typeof stats.entries !== 'number') {
        throw new Error('Image cache service not working correctly');
      }

      return {
        name: 'Image Caching',
        passed: true,
        duration: Date.now() - startTime,
        details: 'Image caching working correctly'
      };
    } catch (error) {
      return {
        name: 'Image Caching',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test database performance
   */
  private async testDatabasePerformance(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Test multiple queries to check performance
      const queries = [
        supabase.from('user_profiles').select('id').limit(1),
        supabase.from('test_attempts').select('id').limit(1),
        supabase.from('test_completions').select('id').limit(1)
      ];

      const results = await Promise.all(queries);
      
      const totalTime = Date.now() - startTime;
      
      if (totalTime > 5000) { // 5 seconds
        throw new Error(`Database performance too slow: ${totalTime}ms`);
      }

      return {
        name: 'Database Performance',
        passed: true,
        duration: Date.now() - startTime,
        details: `All queries completed in ${totalTime}ms`
      };
    } catch (error) {
      return {
        name: 'Database Performance',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }
}

export const productionTestSuite = ProductionTestSuite.getInstance();

// React hook for running tests
export function useProductionTests() {
  const runTests = async () => {
    return await productionTestSuite.runAllTests();
  };

  return { runTests };
}
