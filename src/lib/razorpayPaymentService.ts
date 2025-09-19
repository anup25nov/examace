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
  keyId?: string;
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
        const planId = paymentRequest.planId === 'pro_plus' ? 'pro_plus' : 'pro';
        await supabase.from('payments' as any).insert({
          payment_id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: paymentRequest.userId,
          plan_id: planId,
          amount: paymentRequest.amount,
          razorpay_order_id: data.order_id,
          payment_method: 'razorpay',
          status: 'pending'
        } as any);
      } catch (e) {
        console.warn('Failed to insert pending payment (non-fatal):', e);
      }

      // Return order id as the tracking id for client
      return { success: true, orderId: data.order_id, paymentId: data.order_id, amount: paymentRequest.amount, currency: data.currency || 'INR', keyId: data.key_id };
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
    planId: 'pro' | 'pro_plus',
    referralCode?: string
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
          referral_code: referralCode
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
      console.log('Updating payment with Razorpay data:', paymentId, razorpayData);
      
      // Update payment record with Razorpay details
      const { error } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayData.razorpay_payment_id,
          razorpay_order_id: razorpayData.razorpay_order_id,
          razorpay_signature: razorpayData.razorpay_signature,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (error) {
        console.error('Error updating payment with Razorpay data:', error);
        throw error;
      }

      console.log('✅ Payment updated with Razorpay data successfully');
    } catch (error) {
      console.error('Error updating payment with Razorpay data:', error);
      // Don't throw error, just log it to avoid breaking the payment flow
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
      const webhookSecret = process.env.VITE_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('Webhook secret not configured');
        return {
          success: false,
          error: 'Webhook secret not configured',
        };
      }
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
    try {
      console.log('Payment captured:', payment.id);
      
      // Find payment record by order ID
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (fetchError || !paymentData) {
        console.error('Payment record not found for captured payment:', payment.order_id);
        return;
      }

      // Update payment status to verified
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'verified',
          razorpay_payment_id: payment.id,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.id);

      if (updateError) {
        console.error('Failed to update payment status for captured payment:', updateError);
        return;
      }

      // Activate membership if not already active
      const planId = paymentData.plan_id || 'pro';
      const { error: membershipError } = await supabase
        .from('user_profiles')
        .update({
          membership_plan: planId,
          membership_expiry: this.calculateMembershipExpiry(planId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentData.user_id);

      if (membershipError) {
        console.error('Failed to activate membership for captured payment:', membershipError);
      } else {
        console.log('✅ Membership activated for captured payment:', payment.id);
      }

      console.log('✅ Payment captured webhook processed successfully');
    } catch (error) {
      console.error('Error handling payment captured webhook:', error);
    }
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(payment: any): Promise<void> {
    try {
      console.log('Payment failed:', payment.id);
      
      // Find payment record by order ID
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (fetchError || !paymentData) {
        console.error('Payment record not found for failed payment:', payment.order_id);
        return;
      }

      // Update payment status to failed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          failed_reason: payment.error_description || payment.error_reason || 'Payment failed',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.id);

      if (updateError) {
        console.error('Failed to update payment status for failed payment:', updateError);
        return;
      }

      console.log('✅ Payment failed webhook processed successfully');
    } catch (error) {
      console.error('Error handling payment failed webhook:', error);
    }
  }

  /**
   * Handle order paid webhook
   */
  private async handleOrderPaid(order: any): Promise<void> {
    try {
      console.log('Order paid:', order.id);
      
      // Find payment record by order ID
      const { data: paymentData, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', order.id)
        .single();

      if (fetchError || !paymentData) {
        console.error('Payment record not found for paid order:', order.id);
        return;
      }

      // Update payment status to paid (will be verified separately)
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentData.id);

      if (updateError) {
        console.error('Failed to update payment status for paid order:', updateError);
        return;
      }

      console.log('✅ Order paid webhook processed successfully');
    } catch (error) {
      console.error('Error handling order paid webhook:', error);
    }
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
