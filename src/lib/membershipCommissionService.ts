import { supabase } from '@/integrations/supabase/client';

export interface CommissionResult {
  success: boolean;
  message: string;
  commission_amount: number;
}

export interface RefundResult {
  success: boolean;
  message: string;
  commission_revoked: number;
}

export class MembershipCommissionService {
  /**
   * Process commission when a user purchases a membership
   */
  static async processMembershipCommission(
    userId: string,
    membershipTransactionId: string,
    membershipPlan: string,
    membershipAmount: number
  ): Promise<CommissionResult> {
    try {
      const { data, error } = await supabase.rpc('process_membership_commission' as any, {
        p_user_id: userId,
        p_membership_transaction_id: membershipTransactionId,
        p_membership_plan: membershipPlan,
        p_membership_amount: membershipAmount
      });

      if (error) {
        console.error('Error processing membership commission:', error);
        return {
          success: false,
          message: error.message || 'Failed to process commission',
          commission_amount: 0
        };
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        return {
          success: result.success,
          message: result.message,
          commission_amount: result.commission_amount || 0
        };
      }

      return {
        success: false,
        message: 'No data returned from commission processing',
        commission_amount: 0
      };
    } catch (error: any) {
      console.error('Error processing membership commission:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while processing commission',
        commission_amount: 0
      };
    }
  }

  /**
   * Handle membership refund and revoke commission
   */
  static async handleMembershipRefund(
    membershipTransactionId: string
  ): Promise<RefundResult> {
    try {
      const { data, error } = await supabase.rpc('handle_membership_refund' as any, {
        p_membership_transaction_id: membershipTransactionId
      });

      if (error) {
        console.error('Error handling membership refund:', error);
        return {
          success: false,
          message: error.message || 'Failed to handle refund',
          commission_revoked: 0
        };
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        return {
          success: result.success,
          message: result.message,
          commission_revoked: result.commission_revoked || 0
        };
      }

      return {
        success: false,
        message: 'No data returned from refund processing',
        commission_revoked: 0
      };
    } catch (error: any) {
      console.error('Error handling membership refund:', error);
      return {
        success: false,
        message: error.message || 'An error occurred while handling refund',
        commission_revoked: 0
      };
    }
  }

  /**
   * Get comprehensive referral stats for a user
   */
  static async getComprehensiveReferralStats(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_comprehensive_referral_stats' as any, {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting comprehensive referral stats:', error);
        return null;
      }

      return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting comprehensive referral stats:', error);
      return null;
    }
  }

  /**
   * Get detailed referral network for a user
   */
  static async getReferralNetworkDetailed(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_referral_network_detailed' as any, {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting referral network:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error getting referral network:', error);
      return [];
    }
  }
}

export default MembershipCommissionService;
