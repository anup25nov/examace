// Simplified Membership Service - Works without database tables
// This is a temporary implementation until the membership database schema is set up

import { getMembershipPlans } from '@/config/appConfig';

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  mockTests: number;
  duration: number; // in days
  features: string[];
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_id: string;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
}

class MembershipServiceSimple {
  // Get user's current membership
  async getUserMembership(userId: string): Promise<UserMembership | null> {
    try {
      // Get from localStorage for now
      const membershipData = localStorage.getItem(`membership_${userId}`);
      if (membershipData) {
        const membership = JSON.parse(membershipData);
        // Check if membership is still valid
        const now = new Date();
        const endDate = new Date(membership.end_date);
        
        if (now > endDate) {
          // Membership expired
          membership.status = 'expired';
          localStorage.setItem(`membership_${userId}`, JSON.stringify(membership));
          return null;
        }
        
        return membership;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user membership:', error);
      return null;
    }
  }

  // Check if user has access to a specific number of mock tests
  async hasAccessToMockTests(userId: string, requiredTests: number): Promise<boolean> {
    try {
      const membership = await this.getUserMembership(userId);
      
      if (!membership) {
        return false; // No active membership
      }

      // Get the plan details
      const plan = await this.getMembershipPlan(membership.plan_id);
      if (!plan) {
        return false;
      }

      // Check if user has access to required number of tests
      return plan.mockTests >= requiredTests;
    } catch (error) {
      console.error('Error checking mock test access:', error);
      return false;
    }
  }

  // Get membership plan details
  async getMembershipPlan(planId: string): Promise<MembershipPlan | null> {
    const plans = getMembershipPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) return null;
    
    return {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      mockTests: plan.mockTests,
      duration: plan.duration,
      features: plan.features
    };
  }

  // Create new membership after successful payment
  async createMembership(
    userId: string, 
    planId: string, 
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const plan = await this.getMembershipPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid plan' };
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);

      const membership: UserMembership = {
        id: `membership_${Date.now()}`,
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_id: paymentId,
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString()
      };

      // Store in localStorage
      localStorage.setItem(`membership_${userId}`, JSON.stringify(membership));

      return { success: true };
    } catch (error: any) {
      console.error('Error in createMembership:', error);
      return { success: false, error: error.message };
    }
  }

  // Update membership status
  async updateMembershipStatus(membershipId: string, status: 'active' | 'expired' | 'cancelled'): Promise<boolean> {
    try {
      // Find and update membership in localStorage
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('membership_')) {
          const membership = JSON.parse(localStorage.getItem(key) || '{}');
          if (membership.id === membershipId) {
            membership.status = status;
            membership.updated_at = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(membership));
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error in updateMembershipStatus:', error);
      return false;
    }
  }

  // Record payment
  async recordPayment(
    userId: string,
    planId: string,
    amount: number,
    paymentId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payment: PaymentRecord = {
        id: `payment_${Date.now()}`,
        user_id: userId,
        plan_id: planId,
        amount,
        payment_id: paymentId,
        status: 'completed',
        payment_method: paymentMethod,
        created_at: new Date().toISOString()
      };

      // Store payment in localStorage
      const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
      payments.push(payment);
      localStorage.setItem(`payments_${userId}`, JSON.stringify(payments));

      return { success: true };
    } catch (error: any) {
      console.error('Error in recordPayment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's payment history
  async getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    try {
      const payments = JSON.parse(localStorage.getItem(`payments_${userId}`) || '[]');
      return payments.sort((a: PaymentRecord, b: PaymentRecord) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return [];
    }
  }

  // Check if a mock test is paid
  async isMockTestPaid(userId: string, testId: string): Promise<boolean> {
    try {
      const membership = await this.getUserMembership(userId);
      
      if (!membership) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if mock test is paid:', error);
      return false;
    }
  }

  // Get membership statistics
  async getMembershipStats(userId: string): Promise<{
    currentPlan: string | null;
    daysRemaining: number;
    testsUsed: number;
    testsRemaining: number;
    isActive: boolean;
  }> {
    try {
      const membership = await this.getUserMembership(userId);
      
      if (!membership) {
        return {
          currentPlan: null,
          daysRemaining: 0,
          testsUsed: 0,
          testsRemaining: 0,
          isActive: false
        };
      }

      const plan = await this.getMembershipPlan(membership.plan_id);
      if (!plan) {
        return {
          currentPlan: null,
          daysRemaining: 0,
          testsUsed: 0,
          testsRemaining: 0,
          isActive: false
        };
      }

      const now = new Date();
      const endDate = new Date(membership.end_date);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // Get tests used from localStorage
      const testsUsed = parseInt(localStorage.getItem(`tests_used_${userId}`) || '0');
      const testsRemaining = Math.max(0, plan.mockTests - testsUsed);

      return {
        currentPlan: membership.plan_id,
        daysRemaining,
        testsUsed,
        testsRemaining,
        isActive: membership.status === 'active' && daysRemaining > 0
      };
    } catch (error) {
      console.error('Error getting membership stats:', error);
      return {
        currentPlan: null,
        daysRemaining: 0,
        testsUsed: 0,
        testsRemaining: 0,
        isActive: false
      };
    }
  }

  // Get all membership plans
  async getAllMembershipPlans(): Promise<MembershipPlan[]> {
    const configPlans = getMembershipPlans();
    
    return configPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      mockTests: plan.mockTests,
      duration: plan.duration,
      features: plan.features
    }));
  }

  // Check if user can access a specific test
  async canAccessTest(userId: string, testId: string, testType: string): Promise<boolean> {
    try {
      // Free tests are always accessible
      if (testType === 'mock' || testType === 'pyq') {
        return true;
      }
      
      // Practice tests require membership
      if (testType === 'practice') {
        return await this.hasAccessToMockTests(userId, 1);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking test access:', error);
      return false;
    }
  }

  // Mark test as used
  async markTestAsUsed(userId: string): Promise<void> {
    try {
      const testsUsed = parseInt(localStorage.getItem(`tests_used_${userId}`) || '0');
      localStorage.setItem(`tests_used_${userId}`, (testsUsed + 1).toString());
    } catch (error) {
      console.error('Error marking test as used:', error);
    }
  }
}

export const membershipService = new MembershipServiceSimple();
