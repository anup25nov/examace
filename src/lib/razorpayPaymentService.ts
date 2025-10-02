// Removed imports for deleted services
import { supabase } from '@/integrations/supabase/client';

export interface RazorpayPaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export interface RazorpayPaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
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
        body: { user_id: paymentRequest.userId, plan: paymentRequest.planId }
      } as any);
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to create order');
      }

      // Insert pending payment record (new payments schema)
      try {
        // Get plan name from plan_id
        const planName = paymentRequest.planId === 'pro' ? 'Pro Plan' : 
                        paymentRequest.planId === 'pro_plus' ? 'Pro Plus Plan' : 
                        paymentRequest.planId;
        
        await supabase.from('payments' as any).insert({
          payment_id: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: paymentRequest.userId,
          plan_id: paymentRequest.planId,
          plan_name: planName,
          amount: data.amount, // Use amount from Edge Function
          razorpay_order_id: data.order_id,
          payment_method: 'razorpay',
          status: 'pending'
        } as any);
      } catch (e) {
        console.warn('Failed to insert pending payment (non-fatal):', e);
      }

      // Return order id as the tracking id for client
      return { success: true, orderId: data.order_id, paymentId: data.order_id, amount: data.amount, currency: data.currency || 'INR', keyId: data.key_id };
    } catch (error) {
      console.error('Error creating Razorpay payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Razorpay payment',
      };
    }
  }

  /**
   * Verify Razorpay payment (DEPRECATED - Use webhook-only flow)
   * This method is kept for backward compatibility but does nothing
   * Payment verification is now handled by webhook
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
  ): Promise<any> {
    console.log('⚠️ [razorpayPaymentService] verifyRazorpayPayment called - webhook handles verification now');
    
    // Return success immediately - webhook will handle actual verification
    return { 
      success: true, 
      message: 'Payment verification delegated to webhook', 
      payment_id: paymentId, 
      order_id: razorpayPaymentData.razorpay_order_id 
    };
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
      await supabase
        .from('payments' as any)
        .update({
          razorpay_payment_id: razorpayData.razorpay_payment_id,
          razorpay_order_id: razorpayData.razorpay_order_id,
          razorpay_signature: razorpayData.razorpay_signature,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);
    } catch (error) {
      console.error('Error updating payment with Razorpay data:', error);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<{ status: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('payments' as any)
        .select('status')
        .eq('payment_id', paymentId)
        .single();

      if (error) {
        return { status: 'unknown', error: error.message };
      }

      return { status: (data as any)?.status || 'unknown' };
    } catch (error) {
      return { 
        status: 'unknown', 
        error: error instanceof Error ? error.message : 'Failed to get payment status' 
      };
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string): Promise<{ data: any[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('payments' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Failed to get payment history' 
      };
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// Export singleton instance
export const razorpayPaymentService = RazorpayPaymentService.getInstance();