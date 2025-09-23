/**
 * Premium Test Service
 * Handles dynamic premium test detection and access control
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface PremiumTestInfo {
  isPremium: boolean;
  price: number;
  hasAccess: boolean;
  membershipRequired: boolean;
}

class PremiumTestService {
  private static instance: PremiumTestService;
  private premiumTestCache: Map<string, PremiumTestInfo> = new Map();

  private constructor() {}

  static getInstance(): PremiumTestService {
    if (!PremiumTestService.instance) {
      PremiumTestService.instance = new PremiumTestService();
    }
    return PremiumTestService.instance;
  }

  /**
   * Check if a test is premium and if user has access
   */
  async checkPremiumAccess(
    examId: string,
    testType: string,
    testId: string,
    userId?: string | null
  ): Promise<PremiumTestInfo> {
    const cacheKey = `${examId}-${testType}-${testId}-${userId || 'guest'}`;
    
    // Check cache first
    if (this.premiumTestCache.has(cacheKey)) {
      return this.premiumTestCache.get(cacheKey)!;
    }

    try {
      // Get test data from database
      const { data: testData, error } = await supabase
        .from('exam_test_data')
        .select('is_premium, price')
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .single();

      if (error) {
        console.warn('Error fetching test data:', error);
        // Fallback: assume not premium
        const fallbackInfo: PremiumTestInfo = {
          isPremium: false,
          price: 0,
          hasAccess: true,
          membershipRequired: false
        };
        this.premiumTestCache.set(cacheKey, fallbackInfo);
        return fallbackInfo;
      }

      const isPremium = testData.is_premium || false;
      const price = testData.price || 0;

      let hasAccess = true;
      let membershipRequired = false;

      if (isPremium && userId) {
        // Check if user has active membership
        const { data: membership } = await supabase
          .from('user_memberships')
          .select('status, end_date')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        hasAccess = membership && new Date(membership.end_date) > new Date();
        membershipRequired = true;
      } else if (isPremium && !userId) {
        hasAccess = false;
        membershipRequired = true;
      }

      const premiumInfo: PremiumTestInfo = {
        isPremium,
        price,
        hasAccess,
        membershipRequired
      };

      this.premiumTestCache.set(cacheKey, premiumInfo);
      return premiumInfo;

    } catch (error) {
      console.error('Error checking premium access:', error);
      // Fallback: assume not premium
      const fallbackInfo: PremiumTestInfo = {
        isPremium: false,
        price: 0,
        hasAccess: true,
        membershipRequired: false
      };
      this.premiumTestCache.set(cacheKey, fallbackInfo);
      return fallbackInfo;
    }
  }

  /**
   * Check if a test is premium (synchronous, uses cache)
   */
  isPremiumTest(examId: string, testType: string, testId: string): boolean {
    const cacheKey = `${examId}-${testType}-${testId}-guest`;
    const cached = this.premiumTestCache.get(cacheKey);
    return cached?.isPremium || false;
  }

  /**
   * Clear cache (useful for testing or when membership status changes)
   */
  clearCache(): void {
    this.premiumTestCache.clear();
  }

  /**
   * Get all premium tests for an exam
   */
  async getPremiumTests(examId: string): Promise<Array<{testType: string, testId: string, name: string, price: number}>> {
    try {
      const { data, error } = await supabase
        .from('exam_test_data')
        .select('test_type, test_id, name, price')
        .eq('exam_id', examId)
        .eq('is_premium', true);

      if (error) {
        console.error('Error fetching premium tests:', error);
        return [];
      }

      return (data || []).map(item => ({
        testType: item.test_type,
        testId: item.test_id,
        name: item.name,
        price: item.price
      }));
    } catch (error) {
      console.error('Error fetching premium tests:', error);
      return [];
    }
  }
}

export const premiumTestService = PremiumTestService.getInstance();
