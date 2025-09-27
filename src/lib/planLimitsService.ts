import { supabase } from '@/integrations/supabase/client';
import { unifiedPaymentService } from './unifiedPaymentService';
import { dynamicTestDataLoader } from './dynamicTestDataLoader';
import { getPlanPricing, formatPrice } from '@/config/pricingConfig';

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
      // Get user's current membership
      const membership = await unifiedPaymentService.getUserMembership(userId);
      
      let planType: 'free' | 'pro' | 'pro_plus' = 'free';
      let maxTests = 0;

      // Enhanced membership expiry handling
      if (membership && membership.status === 'active') {
        const now = new Date();
        const expiryDate = new Date(membership.end_date);
        const timeUntilExpiry = expiryDate.getTime() - now.getTime();
        const daysUntilExpiry = timeUntilExpiry / (1000 * 60 * 60 * 24);

        // Check if membership is expired
        if (timeUntilExpiry <= 0) {
          await this.handleMembershipExpiry(userId, membership);
          planType = 'free';
        } else if (daysUntilExpiry <= 7) {
          // Grace period - show warning but allow access
          planType = membership.plan_id as 'pro' | 'pro_plus';
          maxTests = planType === 'pro' ? 11 : 9999;
        } else {
          // Active membership
          planType = membership.plan_id as 'pro' | 'pro_plus';
          maxTests = planType === 'pro' ? 11 : 9999;
        }
      }

      // Count used tests for premium users (only premium tests count against limits)
      let usedTests = 0;
      if (planType !== 'free') {
        const billingStart = this.getBillingPeriodStart(membership);
        
        // Get all completed test attempts and filter premium ones
        const { data: testAttempts, error } = await supabase
          .from('test_attempts' as any)
          .select('id, test_id, test_type')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('created_at', billingStart);


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
        } else {
          usedTests = 0;
        }
      } else {
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
      const hasCompleted = await this.hasUserCompletedTest(userId, test.id, testType || 'mock');
      isRetry = hasCompleted;
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
      // Check premium status using dynamic test data loader
      const { mock, pyq, practice } = await dynamicTestDataLoader.getAllTestData('ssc-cgl');
      const allTests = [...mock, ...pyq.flatMap(year => year.papers), ...practice.flatMap(subject => subject.topics.flatMap(topic => topic.tests))];
      const test = allTests.find(t => t.id === testId);
      return test?.isPremium || false;
    } catch (error) {
      console.error('❌ [planLimitsService] Error checking test premium status:', error);
      // Default to premium if we can't determine
      return true;
    }
  }

  /**
   * Get mock test specific usage for a user
   */
  async getMockTestUsage(userId: string): Promise<{
    usedMockTests: number;
    maxMockTests: number;
    remainingMockTests: number;
    canTakeMockTest: boolean;
  }> {
    try {
      
      // Get user's plan limits
      const planLimits = await this.getUserPlanLimits(userId);
      
      // Count only mock test attempts
      const { data: mockTestAttempts, error } = await supabase
        .from('test_attempts' as any)
        .select('id, test_id, test_type')
        .eq('user_id', userId)
        .eq('test_type', 'mock')
        .eq('status', 'completed');

      if (error) {
        console.error('❌ [planLimitsService] Error fetching mock test attempts:', error);
        return {
          usedMockTests: 0,
          maxMockTests: planLimits.maxTests,
          remainingMockTests: planLimits.maxTests,
          canTakeMockTest: planLimits.planType === 'pro_plus'
        };
      }

      const usedMockTests = mockTestAttempts?.length || 0;
      const remainingMockTests = Math.max(0, planLimits.maxTests - usedMockTests);
      const canTakeMockTest = planLimits.planType === 'free' ? false : 
                            planLimits.planType === 'pro_plus' ? true : 
                            remainingMockTests > 0;

      return {
        usedMockTests,
        maxMockTests: planLimits.maxTests,
        remainingMockTests,
        canTakeMockTest
      };
    } catch (error) {
      console.error('❌ [planLimitsService] Error getting mock test usage:', error);
      return {
        usedMockTests: 0,
        maxMockTests: 0,
        remainingMockTests: 0,
        canTakeMockTest: false
      };
    }
  }

  /**
   * Check if user has already completed a specific test
   */
  private async hasUserCompletedTest(userId: string, testId: string, testType: string): Promise<boolean> {
    try {
      
      const { data, error } = await supabase
        .from('test_attempts' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('test_id', testId)
        .eq('test_type', testType)
        .eq('status', 'completed')
        .limit(1);

      if (error) {
        console.error('❌ [planLimitsService] Error checking test completion:', error);
        return false;
      }

      const hasCompleted = (data && data.length > 0);
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
      // Check if this test is premium
      const isPremium = await this.isTestPremiumInData(testId, testType);
      
      // Check if this is a retry and if there's an existing completed attempt
      if (isRetry) {
        const { data: existingAttempt, error: fetchError } = await supabase
          .from('test_attempts' as any)
          .select('id, status')
          .eq('user_id', userId)
          .eq('test_id', testId)
          .eq('test_type', testType)
          .eq('status', 'completed')
          .limit(1);


        if (fetchError) {
          console.error('❌ [planLimitsService] Error fetching existing attempt:', fetchError);
          return { success: false, error: fetchError.message };
        }

        // If there's an existing completed attempt, update it to in_progress for retry
        if (existingAttempt && existingAttempt.length > 0) {
          const attemptId = (existingAttempt[0] as any).id;
          const { error: updateError } = await supabase
            .from('test_attempts' as any)
            .update({
              status: 'in_progress',
              started_at: new Date().toISOString(),
              completed_at: null
            })
            .eq('id', attemptId);


          if (updateError) {
            console.error('❌ [planLimitsService] Error updating existing attempt:', updateError);
            return { success: false, error: updateError.message };
          }

          return { success: true };
        } else {
        }
      }

      // Create new test attempt (for new tests or if no existing completed attempt found)
      const { data: attemptData, error } = await supabase
        .rpc('insert_test_attempt' as any, {
          p_user_id: userId,
          p_exam_id: examId,
          p_test_type: testType,
          p_test_id: testId,
          p_score: 0, // Initialize with 0 score
          p_total_questions: totalQuestions, // Required field
          p_correct_answers: 0, // Required field - initialize with 0
          p_time_taken: 0, // Optional field - initialize with 0
          p_answers: null
        });


      if (error) {
        console.error('❌ [planLimitsService] Error recording test attempt:', error);
        return { success: false, error: error.message };
      }

      // RPC function returns an array with success/message/attempt_id
      const result = Array.isArray(attemptData) ? attemptData[0] : attemptData;
      if (!result || !(result as any).success) {
        console.error('❌ [planLimitsService] Test attempt creation failed:', (result as any)?.message);
        return { success: false, error: (result as any)?.message || 'Failed to create test attempt' };
      }

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
   * Handle membership expiry
   */
  private async handleMembershipExpiry(userId: string, membership: any): Promise<void> {
    try {

      // Update membership status to expired
      const { error: membershipError } = await supabase
        .from('user_memberships')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', membership.id);

      if (membershipError) {
        console.error('❌ [planLimitsService] Failed to update membership status:', membershipError);
      }

      // Update user profile to free plan
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          membership_plan: 'free',
          membership_status: 'inactive',
          membership_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('❌ [planLimitsService] Failed to update user profile:', profileError);
      }

      // Send expiry notification
      await this.sendExpiryNotification(userId, membership);

    } catch (error) {
      console.error('❌ [planLimitsService] Error handling membership expiry:', error);
    }
  }

  /**
   * Send membership expiry notification
   */
  private async sendExpiryNotification(userId: string, membership: any): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('user_messages')
        .insert({
          user_id: userId,
          message_type: 'membership_expired',
          message: `Your ${membership.plan_id} membership has expired. Upgrade to continue accessing premium features.`,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to send expiry notification:', error);
      }
    } catch (error) {
      console.error('Error sending expiry notification:', error);
    }
  }

  /**
   * Check if user has grace period access
   */
  async hasGracePeriodAccess(userId: string): Promise<{ hasAccess: boolean; daysRemaining: number; message: string }> {
    try {
      const membership = await unifiedPaymentService.getUserMembership(userId);
      
      if (!membership || membership.status !== 'active') {
        return { hasAccess: false, daysRemaining: 0, message: 'No active membership' };
      }

      const now = new Date();
      const expiryDate = new Date(membership.end_date);
      const timeUntilExpiry = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

      if (timeUntilExpiry <= 0) {
        return { hasAccess: false, daysRemaining: 0, message: 'Membership has expired' };
      }

      if (daysRemaining <= 7) {
        return { 
          hasAccess: true, 
          daysRemaining, 
          message: `Membership expires in ${daysRemaining} days` 
        };
      }

      return { hasAccess: true, daysRemaining, message: 'Membership is active' };
    } catch (error) {
      console.error('Error checking grace period access:', error);
      return { hasAccess: false, daysRemaining: 0, message: 'Error checking membership status' };
    }
  }

  /**
   * Get upgrade message for user
   */
  getUpgradeMessage(limits: PlanLimits): string {
    const proPlan = getPlanPricing('pro');
    const proPlusPlan = getPlanPricing('pro_plus');
    
    if (limits.planType === 'free') {
      return `Upgrade to Pro (${formatPrice(proPlan?.price || 99)}) or Pro+ (${formatPrice(proPlusPlan?.price || 299)}) to access mock tests and unlock your potential!`;
    } else if (limits.planType === 'pro' && limits.remainingTests <= 2) {
      return `Only ${limits.remainingTests} tests left! Upgrade to Pro+ (${formatPrice(proPlusPlan?.price || 299)}) for unlimited access.`;
    } else if (limits.planType === 'pro' && limits.usedTests >= limits.maxTests) {
      return 'You\'ve completed all 11 tests in your Pro plan. Upgrade to Pro+ for unlimited access!';
    }
    return '';
  }
}

export const planLimitsService = PlanLimitsService.getInstance();
