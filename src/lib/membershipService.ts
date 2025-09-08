import { supabase } from '@/integrations/supabase/client';

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

class MembershipService {
  // Get user's current membership
  async getUserMembership(userId: string): Promise<UserMembership | null> {
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user membership:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserMembership:', error);
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

      // Check if membership is still valid
      const now = new Date();
      const endDate = new Date(membership.end_date);
      
      if (now > endDate) {
        // Membership expired, update status
        await this.updateMembershipStatus(membership.id, 'expired');
        return false;
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
    const plans: Record<string, MembershipPlan> = {
      'basic': {
        id: 'basic',
        name: 'Basic Plan',
        price: 30,
        mockTests: 10,
        duration: 30,
        features: ['10 Mock Tests', 'Detailed Solutions', 'Performance Analytics', '30 Days Access']
      },
      'premium': {
        id: 'premium',
        name: 'Premium Plan',
        price: 49,
        mockTests: 25,
        duration: 60,
        features: ['25 Mock Tests', 'Detailed Solutions', 'Performance Analytics', '60 Days Access', 'Priority Support']
      },
      'pro': {
        id: 'pro',
        name: 'Pro Plan',
        price: 99,
        mockTests: 50,
        duration: 90,
        features: ['50 Mock Tests', 'Detailed Solutions', 'Performance Analytics', '90 Days Access', '24/7 Support', 'Study Materials']
      }
    };

    return plans[planId] || null;
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

      // First, deactivate any existing active memberships
      await supabase
        .from('user_memberships')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Create new membership
      const { data, error } = await supabase
        .from('user_memberships')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_id: paymentId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating membership:', error);
        return { success: false, error: error.message };
      }

      // Update user profile with membership info
      await supabase
        .from('user_profiles')
        .update({
          membership_plan: planId,
          membership_expiry: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return { success: true };
    } catch (error: any) {
      console.error('Error in createMembership:', error);
      return { success: false, error: error.message };
    }
  }

  // Update membership status
  async updateMembershipStatus(membershipId: string, status: 'active' | 'expired' | 'cancelled'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_memberships')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) {
        console.error('Error updating membership status:', error);
        return false;
      }

      return true;
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
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          plan_id: planId,
          amount,
          payment_id: paymentId,
          status: 'completed',
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording payment:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in recordPayment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's payment history
  async getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
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

      // Check if membership is still valid
      const now = new Date();
      const endDate = new Date(membership.end_date);
      
      if (now > endDate) {
        await this.updateMembershipStatus(membership.id, 'expired');
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

      // Get tests used (you'll need to implement this based on your test completion tracking)
      const testsUsed = 0; // TODO: Implement based on your test completion system
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
    const plans = await Promise.all([
      this.getMembershipPlan('basic'),
      this.getMembershipPlan('premium'),
      this.getMembershipPlan('pro')
    ]);
    
    return plans.filter(plan => plan !== null) as MembershipPlan[];
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
}

export const membershipService = new MembershipService();
