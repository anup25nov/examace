import { supabase } from '@/integrations/supabase/client';
import { unifiedPaymentService } from './unifiedPaymentService';

export interface PlanLimits {
  maxTests: number;
  usedTests: number;
  remainingTests: number;
  canTakeTest: boolean;
  planType: 'free' | 'pro' | 'pro_plus';
}

export class PlanLimitsService {
  private static instance: PlanLimitsService;

  public static getInstance(): PlanLimitsService {
    if (!PlanLimitsService.instance) {
      PlanLimitsService.instance = new PlanLimitsService();
    }
    return PlanLimitsService.instance;
  }

  /**
   * Get user's plan limits and usage
   */
  async getUserPlanLimits(userId: string): Promise<PlanLimits> {
    try {
      console.log('🔍 [planLimitsService] Getting user plan limits for userId:', userId);
      // Get user's current membership
      const membership = await unifiedPaymentService.getUserMembership(userId);
      console.log('👤 [planLimitsService] User membership:', membership);
      
      let planType: 'free' | 'pro' | 'pro_plus' = 'free';
      let maxTests = 0;

      if (membership && membership.status === 'active' && new Date(membership.end_date) > new Date()) {
        planType = membership.plan_id as 'pro' | 'pro_plus';
        maxTests = planType === 'pro' ? 11 : 9999; // Pro gets 11 tests, Pro+ gets unlimited
      }

      // Count used tests for premium users (only premium tests count against limits)
      let usedTests = 0;
      if (planType !== 'free') {
        console.log('📊 [planLimitsService] Fetching premium test attempts for premium user...');
        const billingStart = this.getBillingPeriodStart(membership);
        console.log('📅 [planLimitsService] Billing period start:', billingStart);
        
        // Get all completed test attempts and filter premium ones
        const { data: testAttempts, error } = await supabase
          .from('test_attempts' as any)
          .select('id, test_id, test_type')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('created_at', billingStart);

        console.log('📈 [planLimitsService] Premium test attempts query result:', { testAttempts, error });

        if (error) {
          console.error('❌ [planLimitsService] Error fetching test attempts:', error);
          return {
            maxTests,
            usedTests: 0,
            remainingTests: maxTests,
            canTakeTest: true,
            planType
          };
        }

        // Filter to only count premium tests
        if (testAttempts && testAttempts.length > 0) {
          const premiumTestCount = await this.countPremiumTestsFromAttempts(testAttempts);
          usedTests = premiumTestCount;
          console.log('💎 [planLimitsService] Premium tests used:', usedTests, 'out of', testAttempts.length, 'total attempts');
        } else {
          usedTests = 0;
          console.log('💎 [planLimitsService] No test attempts found');
        }
      } else {
        console.log('🆓 [planLimitsService] Free user - no test counting needed');
      }

      const remainingTests = Math.max(0, maxTests - usedTests);
      const canTakeTest = planType === 'free' || planType === 'pro_plus' || remainingTests > 0;

      const result = {
        maxTests,
        usedTests,
        remainingTests,
        canTakeTest,
        planType
      };
      
      console.log('✅ [planLimitsService] Final limits result:', result);
      return result;
    } catch (error) {
      console.error('Error getting plan limits:', error);
      return {
        maxTests: 0,
        usedTests: 0,
        remainingTests: 0,
        canTakeTest: false,
        planType: 'free'
      };
    }
  }

  /**
   * Check if user can take a test (works for both mock and PYQ tests)
   */
  async canUserTakeTest(userId: string, testType?: string, test?: any): Promise<{ canTake: boolean; reason?: string; limits?: PlanLimits; isRetry?: boolean }> {
    console.log('🎯 [planLimitsService] canUserTakeTest called with:', { userId, testType, test });
    const limits = await this.getUserPlanLimits(userId);
    
    // If test is not premium, allow access for all users
    if (test && !test.isPremium) {
      return { canTake: true, limits, isRetry: false };
    }
    
    // For free users, they can't take any premium tests (mock or PYQ)
    if (limits.planType === 'free') {
      return { 
        canTake: false, 
        reason: 'You need a Pro or Pro+ membership to take premium tests (Mock tests and PYQ).', 
        limits,
        isRetry: false
      };
    }
    
    // Check if this is a retry (user has already completed this specific test)
    let isRetry = false;
    if (test && test.id) {
      console.log('🔄 [planLimitsService] Checking if test is retry for testId:', test.id);
      const hasCompleted = await this.hasUserCompletedTest(userId, test.id, testType || 'mock');
      isRetry = hasCompleted;
      console.log('🔄 [planLimitsService] Is retry?', isRetry);
    }
    
    // If it's a retry, allow access regardless of limits
    if (isRetry) {
      return { canTake: true, limits, isRetry: true };
    }
    
    // For new tests, check if user has remaining limits
    if (limits.canTakeTest) {
      return { canTake: true, limits, isRetry: false };
    }

    let reason = '';
    if (limits.planType === 'pro' && limits.usedTests >= limits.maxTests) {
      reason = `You've used all ${limits.maxTests} tests in your Pro plan. Upgrade to Pro+ for unlimited access.`;
    } else if (limits.planType === 'pro_plus') {
      reason = 'There seems to be an issue with your Pro+ membership. Please contact support.';
    }

    return { canTake: false, reason, limits, isRetry: false };
  }


  /**
   * Count how many of the test attempts were for premium tests
   */
  private async countPremiumTestsFromAttempts(testAttempts: any[]): Promise<number> {
    try {
      let premiumCount = 0;
      
      for (const attempt of testAttempts) {
        const testId = attempt.test_id;
        const testType = attempt.test_type;
        
        // Check if this specific test is premium
        const isPremium = await this.isTestPremiumInData(testId, testType);
        if (isPremium) {
          premiumCount++;
        }
      }
      
      return premiumCount;
    } catch (error) {
      console.error('❌ [planLimitsService] Error counting premium tests:', error);
      return 0;
    }
  }

  /**
   * Check if a specific test is premium by looking at the test data
   */
  private async isTestPremiumInData(testId: string, testType: string): Promise<boolean> {
    try {
      // Import testDataLoader dynamically to avoid circular imports
      const { testDataLoader } = await import('./testDataLoader');
      const testData = testDataLoader.getTestById('ssc-cgl', testId);
      return testData?.isPremium || false;
    } catch (error) {
      console.error('❌ [planLimitsService] Error checking test premium status:', error);
      // Default to premium if we can't determine
      return true;
    }
  }

  /**
   * Check if user has already completed a specific test
   */
  private async hasUserCompletedTest(userId: string, testId: string, testType: string): Promise<boolean> {
    try {
      console.log('🔍 [planLimitsService] Checking test completion:', { userId, testId, testType });
      
      const { data, error } = await supabase
        .from('test_attempts' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('test_type', testType)
        .eq('status', 'completed')
        .limit(1);

      console.log('📊 [planLimitsService] Test completion query result:', { data, error });

      if (error) {
        console.error('❌ [planLimitsService] Error checking test completion:', error);
        return false;
      }

      const hasCompleted = (data && data.length > 0);
      console.log('✅ [planLimitsService] Test completion result:', hasCompleted);
      return hasCompleted;
    } catch (error) {
      console.error('❌ [planLimitsService] Error checking test completion:', error);
      return false;
    }
  }

  /**
   * Record a test attempt
   */
  async recordTestAttempt(userId: string, testId: string, examId: string, testType: string = 'mock', totalQuestions: number = 100, isRetry: boolean = false): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 [planLimitsService] recordTestAttempt called with:', { userId, testId, examId, testType, totalQuestions, isRetry });
      
      // Check if this test is premium
      const isPremium = await this.isTestPremiumInData(testId, testType);
      console.log('💎 [planLimitsService] Test premium status:', { testId, testType, isPremium });
      
      // Check if this is a retry and if there's an existing completed attempt
      if (isRetry) {
        console.log('🔄 [planLimitsService] This is a retry, checking for existing attempt...');
        const { data: existingAttempt, error: fetchError } = await supabase
          .from('test_attempts' as any)
          .select('id, status')
          .eq('user_id', userId)
          .eq('test_id', testId)
          .eq('test_type', testType)
          .eq('status', 'completed')
          .limit(1);

        console.log('🔍 [planLimitsService] Existing attempt query result:', { existingAttempt, fetchError });

        if (fetchError) {
          console.error('❌ [planLimitsService] Error fetching existing attempt:', fetchError);
          return { success: false, error: fetchError.message };
        }

        // If there's an existing completed attempt, update it to in_progress for retry
        if (existingAttempt && existingAttempt.length > 0) {
          console.log('🔄 [planLimitsService] Found existing attempt, updating to in_progress...');
          const attemptId = (existingAttempt[0] as any).id;
          const { error: updateError } = await supabase
            .from('test_attempts' as any)
            .update({
              status: 'in_progress',
              started_at: new Date().toISOString(),
              completed_at: null
            })
            .eq('id', attemptId);

          console.log('📝 [planLimitsService] Update attempt result:', { updateError });

          if (updateError) {
            console.error('❌ [planLimitsService] Error updating existing attempt:', updateError);
            return { success: false, error: updateError.message };
          }

          console.log('✅ [planLimitsService] Successfully updated existing attempt for retry');
          return { success: true };
        } else {
          console.log('ℹ️ [planLimitsService] No existing completed attempt found, will create new one');
        }
      }

      // Create new test attempt (for new tests or if no existing completed attempt found)
      console.log('🆕 [planLimitsService] Creating new test attempt...');
      const { error } = await supabase
        .from('test_attempts' as any)
        .insert({
          user_id: userId,
          exam_id: examId,
          test_type: testType,
          test_id: testId,
          score: 0, // Initialize with 0 score
          total_questions: totalQuestions, // Required field
          correct_answers: 0, // Required field - initialize with 0
          time_taken: 0, // Optional field - initialize with 0
          started_at: new Date().toISOString()
        });

      console.log('📝 [planLimitsService] Create attempt result:', { error });

      if (error) {
        console.error('❌ [planLimitsService] Error recording test attempt:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [planLimitsService] Successfully created new test attempt');
      return { success: true };
    } catch (error) {
      console.error('Error recording test attempt:', error);
      return { success: false, error: 'Failed to record test attempt' };
    }
  }

  /**
   * Complete a test attempt
   */
  async completeTestAttempt(userId: string, testId: string, score: number, timeSpent: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('test_attempts' as any)
        .update({
          status: 'completed',
          score: score,
          time_spent: timeSpent,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('status', 'in_progress');

      if (error) {
        console.error('Error completing test attempt:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing test attempt:', error);
      return { success: false, error: 'Failed to complete test attempt' };
    }
  }

  /**
   * Get billing period start date
   */
  private getBillingPeriodStart(membership: any): string {
    if (!membership || !membership.start_date) {
      // If no membership, use current month start
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    return membership.start_date;
  }

  /**
   * Get upgrade message for user
   */
  getUpgradeMessage(limits: PlanLimits): string {
    if (limits.planType === 'free') {
      return 'Upgrade to Pro (₹99) or Pro+ (₹299) to access mock tests and unlock your potential!';
    } else if (limits.planType === 'pro' && limits.remainingTests <= 2) {
      return `Only ${limits.remainingTests} tests left! Upgrade to Pro+ (₹299) for unlimited access.`;
    } else if (limits.planType === 'pro' && limits.usedTests >= limits.maxTests) {
      return 'You\'ve completed all 11 tests in your Pro plan. Upgrade to Pro+ for unlimited access!';
    }
    return '';
  }
}

export const planLimitsService = PlanLimitsService.getInstance();
