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
      // Get user's current membership
      const membership = await unifiedPaymentService.getUserMembership(userId);
      
      let planType: 'free' | 'pro' | 'pro_plus' = 'free';
      let maxTests = 0;

      if (membership && membership.status === 'active' && new Date(membership.end_date) > new Date()) {
        planType = membership.plan_id as 'pro' | 'pro_plus';
        maxTests = planType === 'pro' ? 11 : 9999; // Pro gets 11 tests, Pro+ gets unlimited
      }

      // Count used tests (completed test attempts)
      const { data: testAttempts, error } = await supabase
        .from('test_attempts' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', this.getBillingPeriodStart(membership));

      if (error) {
        console.error('Error fetching test attempts:', error);
        return {
          maxTests,
          usedTests: 0,
          remainingTests: maxTests,
          canTakeTest: true,
          planType
        };
      }

      const usedTests = testAttempts?.length || 0;
      const remainingTests = Math.max(0, maxTests - usedTests);
      const canTakeTest = planType === 'pro_plus' || remainingTests > 0;

      return {
        maxTests,
        usedTests,
        remainingTests,
        canTakeTest,
        planType
      };
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
  async canUserTakeTest(userId: string, testType?: string, test?: any): Promise<{ canTake: boolean; reason?: string; limits?: PlanLimits }> {
    const limits = await this.getUserPlanLimits(userId);
    
    // If test is not premium, allow access for all users
    if (test && !test.isPremium) {
      return { canTake: true, limits };
    }
    
    // For free users, they can't take any premium tests (mock or PYQ)
    if (limits.planType === 'free') {
      return { 
        canTake: false, 
        reason: 'You need a Pro or Pro+ membership to take premium tests (Mock tests and PYQ).', 
        limits 
      };
    }
    
    if (limits.canTakeTest) {
      return { canTake: true, limits };
    }

    let reason = '';
    if (limits.planType === 'pro' && limits.usedTests >= limits.maxTests) {
      reason = `You've used all ${limits.maxTests} tests in your Pro plan. Upgrade to Pro+ for unlimited access.`;
    } else if (limits.planType === 'pro_plus') {
      reason = 'There seems to be an issue with your Pro+ membership. Please contact support.';
    }

    return { canTake: false, reason, limits };
  }

  /**
   * Record a test attempt
   */
  async recordTestAttempt(userId: string, testId: string, examId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('test_attempts' as any)
        .insert({
          user_id: userId,
          test_id: testId,
          exam_id: examId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording test attempt:', error);
        return { success: false, error: error.message };
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
