import { supabase } from '@/integrations/supabase/client';
import { errorHandlingService } from './errorHandlingService';

export interface PaymentRollbackData {
  paymentId: string;
  userId: string;
  planId: string;
  amount: number;
  reason: string;
  timestamp: Date;
}

export interface RollbackResult {
  success: boolean;
  message: string;
  rollbackId?: string;
  restoredData?: any;
}

export class PaymentRollbackService {
  private static instance: PaymentRollbackService;

  public static getInstance(): PaymentRollbackService {
    if (!PaymentRollbackService.instance) {
      PaymentRollbackService.instance = new PaymentRollbackService();
    }
    return PaymentRollbackService.instance;
  }

  /**
   * Rollback a payment and restore previous state
   */
  async rollbackPayment(rollbackData: PaymentRollbackData): Promise<RollbackResult> {
    try {
      console.log('🔄 Starting payment rollback for:', rollbackData.paymentId);

      // Start transaction
      const { data: rollbackResult, error } = await (supabase as any).rpc('rollback_payment_transaction', {
        p_payment_id: rollbackData.paymentId,
        p_user_id: rollbackData.userId,
        p_plan_id: rollbackData.planId,
        p_reason: rollbackData.reason
      });

      if (error) {
        throw new Error(`Rollback failed: ${error.message}`);
      }

      // Log rollback success
      await this.logRollbackEvent(rollbackData, true, 'Payment rollback completed successfully');

      console.log('✅ Payment rollback completed successfully');
      return {
        success: true,
        message: 'Payment rollback completed successfully',
        rollbackId: (rollbackResult as any)?.rollback_id,
        restoredData: (rollbackResult as any)?.restored_data
      };

    } catch (error) {
      console.error('❌ Payment rollback failed:', error);
      
      // Log rollback failure
      await this.logRollbackEvent(rollbackData, false, error instanceof Error ? error.message : 'Unknown error');

      // Handle error
      errorHandlingService.handleError(error, {
        action: 'payment_rollback',
        resource: 'payment_system',
        userId: rollbackData.userId
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment rollback failed'
      };
    }
  }

  /**
   * Rollback membership changes
   */
  async rollbackMembership(userId: string, originalPlan: string, reason: string): Promise<RollbackResult> {
    try {
      console.log('🔄 Rolling back membership for user:', userId);

      // Get current membership
      const { data: currentMembership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (membershipError) {
        throw new Error(`Failed to get current membership: ${membershipError.message}`);
      }

      if (!currentMembership) {
        return {
          success: true,
          message: 'No active membership found to rollback'
        };
      }

      // Deactivate current membership
      const { error: deactivateError } = await supabase
        .from('user_memberships')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMembership.id);

      if (deactivateError) {
        throw new Error(`Failed to deactivate membership: ${deactivateError.message}`);
      }

      // Restore original plan in user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          membership_plan: originalPlan,
          membership_status: originalPlan === 'free' ? 'inactive' : 'active',
          membership_expiry: originalPlan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Failed to restore user profile: ${profileError.message}`);
      }

      // Log rollback
      await this.logRollbackEvent({
        paymentId: currentMembership.id,
        userId,
        planId: originalPlan,
        amount: 0,
        reason,
        timestamp: new Date()
      }, true, 'Membership rollback completed successfully');

      console.log('✅ Membership rollback completed successfully');
      return {
        success: true,
        message: 'Membership rollback completed successfully',
        restoredData: { originalPlan }
      };

    } catch (error) {
      console.error('❌ Membership rollback failed:', error);
      
      errorHandlingService.handleError(error, {
        action: 'membership_rollback',
        resource: 'membership_system',
        userId
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Membership rollback failed'
      };
    }
  }

  /**
   * Rollback referral commission
   */
  async rollbackReferralCommission(commissionId: string, reason: string): Promise<RollbackResult> {
    try {
      console.log('🔄 Rolling back referral commission:', commissionId);

      // Get commission details
      const { data: commission, error: commissionError } = await (supabase as any)
        .from('referral_commissions')
        .select('*')
        .eq('id', commissionId)
        .single();

      if (commissionError) {
        throw new Error(`Failed to get commission: ${commissionError.message}`);
      }

      if (!commission) {
        return {
          success: true,
          message: 'Commission not found'
        };
      }

      // Reverse commission
      const { error: reverseError } = await (supabase as any)
        .from('referral_commissions')
        .update({
          status: 'reversed',
          notes: `Reversed: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', commissionId);

      if (reverseError) {
        throw new Error(`Failed to reverse commission: ${reverseError.message}`);
      }

      // Update referrer's total earnings
      const { error: updateError } = await (supabase as any)
        .from('referral_codes')
        .update({
          total_earnings: Math.max(0, ((commission as any).total_earnings || 0) - ((commission as any).amount || 0)),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', (commission as any).referrer_id);

      if (updateError) {
        console.warn('Failed to update referrer earnings:', updateError);
      }

      console.log('✅ Referral commission rollback completed successfully');
      return {
        success: true,
        message: 'Referral commission rollback completed successfully'
      };

    } catch (error) {
      console.error('❌ Referral commission rollback failed:', error);
      
      errorHandlingService.handleError(error, {
        action: 'commission_rollback',
        resource: 'referral_system'
      });

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Commission rollback failed'
      };
    }
  }

  /**
   * Get rollback history for a user
   */
  async getRollbackHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('payment_rollbacks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get rollback history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get rollback history:', error);
      return [];
    }
  }

  /**
   * Log rollback event
   */
  private async logRollbackEvent(
    rollbackData: PaymentRollbackData,
    success: boolean,
    message: string
  ): Promise<void> {
    try {
      await (supabase as any)
        .from('payment_rollbacks')
        .insert({
          payment_id: rollbackData.paymentId,
          user_id: rollbackData.userId,
          plan_id: rollbackData.planId,
          amount: rollbackData.amount,
          reason: rollbackData.reason,
          success,
          message,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log rollback event:', error);
    }
  }

  /**
   * Check if payment can be rolled back
   */
  async canRollbackPayment(paymentId: string): Promise<{ canRollback: boolean; reason?: string }> {
    try {
      const { data: payment, error } = await (supabase as any)
        .from('membership_transactions')
        .select('status, created_at, amount')
        .eq('id', paymentId)
        .single();

      if (error) {
        return { canRollback: false, reason: 'Payment not found' };
      }

      // Check if payment is in a rollbackable state
      if ((payment as any).status === 'completed' || (payment as any).status === 'verified') {
        // Check if it's within rollback window (24 hours)
        const paymentTime = new Date((payment as any).created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - paymentTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          return { canRollback: false, reason: 'Rollback window expired (24 hours)' };
        }

        return { canRollback: true };
      }

      return { canRollback: false, reason: `Payment status '${(payment as any).status}' cannot be rolled back` };
    } catch (error) {
      console.error('Failed to check rollback eligibility:', error);
      return { canRollback: false, reason: 'Error checking rollback eligibility' };
    }
  }
}

export const paymentRollbackService = PaymentRollbackService.getInstance();
