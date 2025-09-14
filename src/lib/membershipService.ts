// Professional Membership Service with Database Integration
import { supabase } from '@/integrations/supabase/client';
import { MembershipCommissionService } from './membershipCommissionService';

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
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

export interface MembershipStatus {
  has_active_membership: boolean;
  current_plan: string;
  expires_at: string | null;
  days_remaining: number;
  tests_available: number;
  plan_name: string;
}

class MembershipService {
  // Get user's current membership status
  async getUserMembershipStatus(userId: string): Promise<MembershipStatus | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_membership_status', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error fetching membership status:', error);
        return null;
      }

      return data as unknown as MembershipStatus;
    } catch (error) {
      console.error('Error in getUserMembershipStatus:', error);
      return null;
    }
  }

  // Check if user has access to a specific number of mock tests
  async hasAccessToMockTests(userId: string, requiredTests: number): Promise<boolean> {
    try {
      const status = await this.getUserMembershipStatus(userId);
      
      if (!status || !status.has_active_membership) {
        return false;
      }

      return status.tests_available >= requiredTests;
    } catch (error) {
      console.error('Error checking mock test access:', error);
      return false;
    }
  }

  // Get all available membership plans
  async getAllMembershipPlans(): Promise<MembershipPlan[]> {
    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching membership plans:', error);
        return [];
      }

      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        originalPrice: plan.original_price,
        mockTests: plan.mock_tests,
        duration: plan.duration_days,
        features: Array.isArray(plan.features) ? plan.features.map(f => String(f)) : []
      }));
    } catch (error) {
      console.error('Error in getAllMembershipPlans:', error);
      return [];
    }
  }


  // Get user's payment history
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('membership_transactions')
        .select(`
          *,
          membership_id (
            plan_id,
            start_date,
            end_date
          )
        `)
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

  // Mark test as used (for tracking usage)
  async markTestAsUsed(userId: string, testType: string): Promise<void> {
    try {
      // This could be implemented to track test usage if needed
      // For now, we'll just log it
      console.log(`Test used by user ${userId}: ${testType}`);
    } catch (error) {
      console.error('Error marking test as used:', error);
    }
  }

  // Check if user can access a specific test type
  async canAccessTest(userId: string, testType: string): Promise<boolean> {
    try {
      const status = await this.getUserMembershipStatus(userId);
      
      // Free tests (practice and some PYQs) are always accessible
      if (testType === 'practice') {
        return true;
      }
      
      // Mock tests and premium PYQs require membership
      if (testType === 'mock' || testType === 'pyq') {
        return status?.has_active_membership || false;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking test access:', error);
      return false;
    }
  }

  // Get membership statistics
  async getMembershipStats(userId: string): Promise<{
    currentPlan: string | null;
    daysRemaining: number;
    testsAvailable: number;
    isActive: boolean;
  }> {
    try {
      const status = await this.getUserMembershipStatus(userId);
      
      if (!status) {
        return {
          currentPlan: null,
          daysRemaining: 0,
          testsAvailable: 0,
          isActive: false
        };
      }

      return {
        currentPlan: status.current_plan,
        daysRemaining: status.days_remaining,
        testsAvailable: status.tests_available,
        isActive: status.has_active_membership
      };
    } catch (error) {
      console.error('Error getting membership stats:', error);
      return {
        currentPlan: null,
        daysRemaining: 0,
        testsAvailable: 0,
        isActive: false
      };
    }
  }

  // Process membership purchase with commission tracking
  async processMembershipPurchase(
    userId: string,
    planId: string,
    paymentId: string,
    amount: number,
    referralCode?: string
  ): Promise<{
    success: boolean;
    message: string;
    membershipId?: string;
    commissionProcessed?: boolean;
    commissionAmount?: number;
  }> {
    try {
      // First, create the membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('user_memberships')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          payment_id: paymentId
        })
        .select()
        .single();

      if (membershipError) {
        console.error('Error creating membership:', membershipError);
        return {
          success: false,
          message: 'Failed to create membership'
        };
      }

      // Create membership transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('membership_transactions')
        .insert({
          user_id: userId,
          membership_id: membershipData.id,
          transaction_id: paymentId,
          amount: amount,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating membership transaction:', transactionError);
        return {
          success: false,
          message: 'Failed to create membership transaction'
        };
      }

      // Process commission for referral
      const commissionResult = await MembershipCommissionService.processMembershipCommission(
        userId,
        transactionData.id,
        planId,
        amount
      );

      return {
        success: true,
        message: 'Membership created successfully',
        membershipId: membershipData.id,
        commissionProcessed: commissionResult.success,
        commissionAmount: commissionResult.commission_amount
      };
    } catch (error: any) {
      console.error('Error processing membership purchase:', error);
      return {
        success: false,
        message: error.message || 'Failed to process membership purchase'
      };
    }
  }

  // Handle membership cancellation with commission refund
  async cancelMembership(
    membershipId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    commissionRevoked?: number;
  }> {
    try {
      // Get the membership transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('membership_transactions')
        .select('*')
        .eq('membership_id', membershipId)
        .single();

      if (transactionError) {
        console.error('Error getting membership transaction:', transactionError);
        return {
          success: false,
          message: 'Failed to get membership transaction'
        };
      }

      // Handle commission refund
      const refundResult = await MembershipCommissionService.handleMembershipRefund(
        transactionData.id
      );

      // Update membership status
      const { error: updateError } = await supabase
        .from('user_memberships')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (updateError) {
        console.error('Error updating membership status:', updateError);
        return {
          success: false,
          message: 'Failed to update membership status'
        };
      }

      return {
        success: true,
        message: 'Membership cancelled successfully',
        commissionRevoked: refundResult.commission_revoked
      };
    } catch (error: any) {
      console.error('Error cancelling membership:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel membership'
      };
    }
  }
}

export const membershipService = new MembershipService();