import { RazorpayPaymentResponse, razorpayService } from './razorpayService';
import { paymentService } from './paymentService';
import { supabase } from '@/integrations/supabase/client';

export interface RazorpayPaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  currency?: string;
  userId: string;
  userEmail: string;
  userName?: string;
}

export interface RazorpayPaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

export class RazorpayPaymentService {
  private static instance: RazorpayPaymentService;

  public static getInstance(): RazorpayPaymentService {
    if (!RazorpayPaymentService.instance) {
      RazorpayPaymentService.instance = new RazorpayPaymentService();
    }
    return RazorpayPaymentService.instance;
  }

  /**
   * Create Razorpay order and payment record
   */
  async createRazorpayPayment(paymentRequest: RazorpayPaymentRequest): Promise<RazorpayPaymentResult> {
    try {
      // Create order via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create_razorpay_order' as any, {
        body: { user_id: paymentRequest.userId, plan: paymentRequest.planId === 'pro_plus' ? 'pro_plus' : 'pro' }
      } as any);
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to create order');
      }

      // Insert pending payment record (new payments schema)
      try {
        await supabase.from('payments' as any).insert({
          user_id: paymentRequest.userId,
          plan: paymentRequest.planId === 'pro_plus' ? 'pro_plus' : 'pro',
          amount: paymentRequest.amount,
          currency: paymentRequest.currency || 'INR',
          razorpay_order_id: data.order_id,
          status: 'pending'
        } as any);
      } catch (e) {
        console.warn('Failed to insert pending payment (non-fatal):', e);
      }

      // Return order id as the tracking id for client
      return { success: true, orderId: data.order_id, paymentId: data.order_id, amount: paymentRequest.amount, currency: data.currency || 'INR' };
    } catch (error) {
      console.error('Error creating Razorpay payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Razorpay payment',
      };
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(
    paymentId: string,
    razorpayPaymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    planId: 'pro' | 'pro_plus'
  ): Promise<RazorpayPaymentResponse> {
    try {
      // Verify via Supabase Edge Function, which also activates membership
      const { data, error } = await supabase.functions.invoke('verify_razorpay_payment' as any, {
        body: {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          plan: planId,
          order_id: razorpayPaymentData.razorpay_order_id,
          payment_id: razorpayPaymentData.razorpay_payment_id,
          signature: razorpayPaymentData.razorpay_signature,
        }
      } as any);
      if (error || !data?.success) {
        return { success: false, error: error?.message || data?.error || 'Verification failed' } as any;
      }

      return { success: true, message: 'Payment verified successfully', payment_id: paymentId, order_id: razorpayPaymentData.razorpay_order_id } as any;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify Razorpay payment',
      };
    }
  }

  /**
   * Update payment record with Razorpay data
   */
  private async updatePaymentWithRazorpayData(
    paymentId: string,
    razorpayData: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    }
  ): Promise<void> {
    try {
      // Skip updating payment data if the table structure doesn't support it
      // This is a fallback for when the payments table doesn't have all required columns
      console.log('Razorpay data received:', razorpayData);
      console.log('Payment ID:', paymentId);
      // The payment verification will still work without this update
    } catch (error) {
      console.error('Error updating payment with Razorpay data:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Mark payment as verified in database
   */
  private async markPaymentAsVerified(
    paymentId: string,
    verificationData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      amount: number;
      currency: string;
      payment_method: string;
      status: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update payment status to verified
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId);

      if (error) {
        throw new Error(`Failed to mark payment as verified: ${error.message}`);
      }

      // Get payment details to activate membership
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('user_id, plan_id, plan_name')
        .eq('payment_id', paymentId)
        .single();

      if (fetchError || !paymentData) {
        console.warn('Failed to fetch payment details for membership activation:', fetchError);
        // Don't throw error, just log it since the payment is still verified
        return { success: true };
      }

      // Activate user membership (use type assertion to handle potential type issues)
      const paymentInfo = paymentData as any;
      const { error: membershipError } = await supabase
        .from('user_profiles')
        .update({
          membership_plan: paymentInfo.plan_id,
          membership_expiry: this.calculateMembershipExpiry(paymentInfo.plan_id),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentInfo.user_id);

      if (membershipError) {
        throw new Error(`Failed to activate membership: ${membershipError.message}`);
      }

      // Log successful verification (skip if audit log table doesn't exist)
      try {
        // Use raw SQL to insert into audit log if table exists
        await supabase.rpc('log_payment_audit' as any, {
          p_payment_id: paymentId,
          p_action: 'verified',
          p_old_status: 'paid',
          p_new_status: 'verified',
          p_reason: 'Razorpay payment verified successfully'
        });
      } catch (auditError) {
        console.warn('Failed to log payment audit:', auditError);
        // Don't fail the entire operation for audit logging
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking payment as verified:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark payment as verified',
      };
    }
  }

  /**
   * Calculate membership expiry date
   */
  private calculateMembershipExpiry(planId: string): string {
    const now = new Date();
    
    switch (planId) {
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      case 'lifetime':
        return new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleWebhook(webhookData: any, signature: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify webhook signature
      const webhookSecret = 'your_webhook_secret'; // Set this in your Razorpay dashboard
      const body = JSON.stringify(webhookData);
      
      const isSignatureValid = razorpayService.verifyWebhookSignature(body, signature, webhookSecret);
      
      if (!isSignatureValid) {
        return {
          success: false,
          error: 'Invalid webhook signature',
        };
      }

      // Handle different webhook events
      switch (webhookData.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(webhookData.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(webhookData.payload.payment.entity);
          break;
        case 'order.paid':
          await this.handleOrderPaid(webhookData.payload.order.entity);
          break;
        default:
          console.log('Unhandled webhook event:', webhookData.event);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle webhook',
      };
    }
  }

  /**
   * Handle payment captured webhook
   */
  private async handlePaymentCaptured(payment: any): Promise<void> {
    console.log('Payment captured:', payment.id);
    // Update payment status in database
    // This is handled by the verification process
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(payment: any): Promise<void> {
    console.log('Payment failed:', payment.id);
    // Update payment status to failed in database
  }

  /**
   * Handle order paid webhook
   */
  private async handleOrderPaid(order: any): Promise<void> {
    console.log('Order paid:', order.id);
    // Handle order completion
  }

  /**
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return razorpayService.getKeyId();
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return razorpayService.formatAmount(amount);
  }
}

// Export singleton instance
export const razorpayPaymentService = RazorpayPaymentService.getInstance();
