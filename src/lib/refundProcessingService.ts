import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from './razorpayService';

export interface RefundRequest {
  id: string;
  user_id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  reason: string;
  type: 'user_requested' | 'payment_failed' | 'duplicate_payment' | 'service_unavailable' | 'fraud_detected';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  processed_at?: string;
  refund_id?: string;
  admin_notes?: string;
  created_by: 'user' | 'admin' | 'system';
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
  retryable?: boolean;
}

export interface RefundPolicy {
  maxRefundDays: number;
  allowedReasons: string[];
  autoApproveAmount: number;
  requireAdminApproval: boolean;
  partialRefundAllowed: boolean;
}

export class RefundProcessingService {
  private static instance: RefundProcessingService;
  private refundPolicy: RefundPolicy = {
    maxRefundDays: 30,
    allowedReasons: [
      'user_requested',
      'payment_failed',
      'duplicate_payment',
      'service_unavailable',
      'fraud_detected'
    ],
    autoApproveAmount: 1000, // ₹1000
    requireAdminApproval: true,
    partialRefundAllowed: true
  };

  public static getInstance(): RefundProcessingService {
    if (!RefundProcessingService.instance) {
      RefundProcessingService.instance = new RefundProcessingService();
    }
    return RefundProcessingService.instance;
  }

  /**
   * Create a refund request
   */
  async createRefundRequest(request: {
    userId: string;
    paymentId: string;
    orderId: string;
    amount: number;
    reason: string;
    type: RefundRequest['type'];
    adminNotes?: string;
  }): Promise<RefundResult> {
    try {
      console.log(`🔄 Creating refund request for payment: ${request.paymentId}`);

      // Validate refund request
      const validation = await this.validateRefundRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          retryable: false
        };
      }

      // Check if refund already exists
      const existingRefund = await this.getExistingRefund(request.paymentId);
      if (existingRefund) {
        return {
          success: false,
          error: 'Refund request already exists for this payment',
          retryable: false
        };
      }

      // Create refund request in database
      const { data: refundRequest, error: insertError } = await supabase
        .from('refund_requests' as any)
        .insert({
          user_id: request.userId,
          payment_id: request.paymentId,
          order_id: request.orderId,
          amount: request.amount,
          reason: request.reason,
          type: request.type,
          status: 'pending',
          requested_at: new Date().toISOString(),
          created_by: 'user',
          admin_notes: request.adminNotes
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating refund request:', insertError);
        return {
          success: false,
          error: 'Failed to create refund request',
          retryable: true
        };
      }

      // Auto-approve if amount is below threshold
      if (request.amount <= this.refundPolicy.autoApproveAmount && 
          !this.refundPolicy.requireAdminApproval) {
        return await this.processRefund((refundRequest as any).id);
      }

      console.log(`✅ Refund request created: ${(refundRequest as any).id}`);
      return {
        success: true,
        refundId: (refundRequest as any).id,
        amount: request.amount,
        status: 'pending'
      };

    } catch (error: any) {
      console.error('Error creating refund request:', error);
      return {
        success: false,
        error: 'Internal server error',
        retryable: true
      };
    }
  }

  /**
   * Process a refund (admin action)
   */
  async processRefund(refundRequestId: string): Promise<RefundResult> {
    try {
      console.log(`🔄 Processing refund: ${refundRequestId}`);

      // Get refund request
      const { data: refundRequest, error: fetchError } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('id', refundRequestId)
        .single();

      if (fetchError || !refundRequest) {
        return {
          success: false,
          error: 'Refund request not found',
          retryable: false
        };
      }

      if ((refundRequest as any).status !== 'pending') {
        return {
          success: false,
          error: 'Refund request is not pending',
          retryable: false
        };
      }

      // Update status to processing
      await supabase
        .from('refund_requests' as any)
        .update({ status: 'processing' })
        .eq('id', refundRequestId);

      // Process refund with Razorpay
      const razorpayResult = await razorpayService.refundPayment(
        (refundRequest as any).payment_id,
        (refundRequest as any).amount,
        `Refund for order: ${(refundRequest as any).order_id}. Reason: ${(refundRequest as any).reason}`
      );

      if (!razorpayResult || !razorpayResult.id) {
        // Update status to failed
        await supabase
          .from('refund_requests' as any)
          .update({ 
            status: 'failed',
            admin_notes: 'Razorpay refund failed'
          })
          .eq('id', refundRequestId);

        return {
          success: false,
          error: 'Failed to process refund with Razorpay',
          retryable: true
        };
      }

      // Update refund request with success
      const { error: updateError } = await supabase
        .from('refund_requests' as any)
        .update({
          status: 'completed',
          refund_id: razorpayResult.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundRequestId);

      if (updateError) {
        console.error('Error updating refund request:', updateError);
        return {
          success: false,
          error: 'Failed to update refund status',
          retryable: true
        };
      }

      // Update membership status if needed
      await this.handleMembershipRefund(refundRequest as any);

      console.log(`✅ Refund processed successfully: ${razorpayResult.id}`);
      return {
        success: true,
        refundId: razorpayResult.id,
        amount: (refundRequest as any).amount,
        status: 'completed'
      };

    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      // Update status to failed
      await supabase
        .from('refund_requests' as any)
        .update({ 
          status: 'failed',
          admin_notes: `Processing error: ${error.message}`
        })
        .eq('id', refundRequestId);

      return {
        success: false,
        error: 'Internal server error',
        retryable: true
      };
    }
  }

  /**
   * Cancel a refund request
   */
  async cancelRefundRequest(refundRequestId: string, reason: string): Promise<RefundResult> {
    try {
      const { error } = await supabase
        .from('refund_requests' as any)
        .update({
          status: 'cancelled',
          admin_notes: `Cancelled: ${reason}`,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundRequestId)
        .eq('status', 'pending');

      if (error) {
        return {
          success: false,
          error: 'Failed to cancel refund request',
          retryable: true
        };
      }

      return { success: true, status: 'cancelled' };

    } catch (error: any) {
      console.error('Error cancelling refund request:', error);
      return {
        success: false,
        error: 'Internal server error',
        retryable: true
      };
    }
  }

  /**
   * Get refund requests for admin review
   */
  async getRefundRequests(status?: string): Promise<{ data: RefundRequest[]; error: string | null }> {
    try {
      let query = supabase
        .from('refund_requests' as any)
        .select(`
          *,
          user_profiles(phone, name)
        `)
        .order('requested_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: 'Failed to fetch refund requests' };
      }

      return { data: (data as any) || [], error: null };

    } catch (error: any) {
      console.error('Error fetching refund requests:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Get user's refund history
   */
  async getUserRefundHistory(userId: string): Promise<{ data: RefundRequest[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) {
        return { data: [], error: 'Failed to fetch refund history' };
      }

      return { data: (data as any) || [], error: null };

    } catch (error: any) {
      console.error('Error fetching user refund history:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Get refund statistics
   */
  async getRefundStatistics(): Promise<{
    totalRefunds: number;
    pendingRefunds: number;
    completedRefunds: number;
    failedRefunds: number;
    totalRefundAmount: number;
    averageRefundAmount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('refund_requests' as any)
        .select('status, amount');

      if (error) {
        throw new Error('Failed to fetch refund statistics');
      }

      const stats = {
        totalRefunds: data.length,
        pendingRefunds: data.filter(r => (r as any).status === 'pending').length,
        completedRefunds: data.filter(r => (r as any).status === 'completed').length,
        failedRefunds: data.filter(r => (r as any).status === 'failed').length,
        totalRefundAmount: data.reduce((sum, r) => sum + ((r as any).amount || 0), 0),
        averageRefundAmount: 0
      };

      stats.averageRefundAmount = stats.totalRefunds > 0 ? 
        stats.totalRefundAmount / stats.totalRefunds : 0;

      return stats;

    } catch (error: any) {
      console.error('Error fetching refund statistics:', error);
      return {
        totalRefunds: 0,
        pendingRefunds: 0,
        completedRefunds: 0,
        failedRefunds: 0,
        totalRefundAmount: 0,
        averageRefundAmount: 0
      };
    }
  }

  // Private helper methods

  private async validateRefundRequest(request: {
    userId: string;
    paymentId: string;
    orderId: string;
    amount: number;
    reason: string;
    type: RefundRequest['type'];
  }): Promise<{ valid: boolean; error?: string }> {
    // Check if reason is allowed
    if (!this.refundPolicy.allowedReasons.includes(request.type)) {
      return {
        valid: false,
        error: 'Invalid refund reason'
      };
    }

    // Check amount
    if (request.amount <= 0) {
      return {
        valid: false,
        error: 'Invalid refund amount'
      };
    }

    // Check if payment exists and is eligible for refund
    const { data: payment, error } = await supabase
      .from('membership_transactions')
      .select('*')
      .eq('transaction_id', request.orderId)
      .eq('user_id', request.userId)
      .single();

    if (error || !payment) {
      return {
        valid: false,
        error: 'Payment not found or not eligible for refund'
      };
    }

    // Check if payment is completed
    const gatewayResponse = payment.gateway_response as any;
    if (gatewayResponse?.status !== 'completed') {
      return {
        valid: false,
        error: 'Payment is not completed'
      };
    }

    // Check refund time limit
    const paymentDate = new Date(payment.created_at);
    const daysSincePayment = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSincePayment > this.refundPolicy.maxRefundDays) {
      return {
        valid: false,
        error: `Refund request is too late. Maximum ${this.refundPolicy.maxRefundDays} days allowed`
      };
    }

    // Check if refund amount is valid
    if (request.amount > payment.amount) {
      return {
        valid: false,
        error: 'Refund amount cannot exceed payment amount'
      };
    }

    return { valid: true };
  }

  private async getExistingRefund(paymentId: string): Promise<RefundRequest | null> {
    try {
      const { data, error } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('payment_id', paymentId)
        .in('status', ['pending', 'processing', 'completed'])
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as any;

    } catch (error) {
      console.error('Error checking existing refund:', error);
      return null;
    }
  }

  private async handleMembershipRefund(refundRequest: RefundRequest): Promise<void> {
    try {
      // If refund is for a membership, we might want to:
      // 1. Cancel the membership
      // 2. Reduce membership duration
      // 3. Mark membership as refunded

      const { error } = await supabase
        .from('user_memberships')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_id: refundRequest.refund_id
        })
        .eq('user_id', refundRequest.user_id)
        .eq('payment_id', refundRequest.payment_id);

      if (error) {
        console.error('Error updating membership for refund:', error);
      }

    } catch (error) {
      console.error('Error handling membership refund:', error);
    }
  }
}

export const refundProcessingService = RefundProcessingService.getInstance();
