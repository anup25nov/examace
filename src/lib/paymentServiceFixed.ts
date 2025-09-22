import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from './razorpayService';

export interface PaymentRequest {
  planId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amount: number;
  currency?: string;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  message?: string;
  error?: string;
}

export interface PaymentVerification {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

export class PaymentServiceFixed {
  private static instance: PaymentServiceFixed;

  public static getInstance(): PaymentServiceFixed {
    if (!PaymentServiceFixed.instance) {
      PaymentServiceFixed.instance = new PaymentServiceFixed();
    }
    return PaymentServiceFixed.instance;
  }

  /**
   * Create payment order with proper validation and error handling
   */
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate input
      const validation = this.validatePaymentRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if user already has active membership
      const { data: existingMembership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('id, status, expires_at')
        .eq('user_id', request.userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error checking existing membership:', membershipError);
        return {
          success: false,
          error: 'Failed to verify existing membership'
        };
      }

      if (existingMembership) {
        return {
          success: false,
          error: 'User already has an active membership'
        };
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', request.planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return {
          success: false,
          error: 'Invalid or inactive membership plan'
        };
      }

      // Create Razorpay order
      const razorpayResult = await razorpayService.createOrder({
        amount: request.amount,
        currency: request.currency || 'INR',
        receipt: `membership_${request.userId}_${Date.now()}`,
        notes: {
          plan_id: request.planId,
          user_id: request.userId,
          user_email: request.userEmail
        }
      });

      if (!razorpayResult || !razorpayResult.id) {
        return {
          success: false,
          error: 'Failed to create payment order'
        };
      }

      // Create payment record in database
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('membership_transactions')
        .insert({
          user_id: request.userId,
          amount: request.amount,
          transaction_id: razorpayResult.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        return {
          success: false,
          error: 'Failed to create payment record'
        };
      }

      return {
        success: true,
        orderId: razorpayResult.id,
        amount: request.amount,
        currency: request.currency || 'INR',
        message: 'Payment order created successfully'
      };

    } catch (error) {
      console.error('Error in createPaymentOrder:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Verify payment and update membership
   */
  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
    try {
      // Verify payment with Razorpay
      const verificationResult = await razorpayService.verifyPayment(
        paymentId,
        orderId,
        signature
      );

      if (!verificationResult) {
        return {
          success: false,
          error: 'Payment verification failed'
        };
      }

      // Get payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('membership_transactions')
        .select('*')
        .eq('transaction_id', orderId)
        .single();

      if (paymentError || !paymentRecord) {
        return {
          success: false,
          error: 'Payment record not found or already processed'
        };
      }

      // Update payment record
      const { data: transactionResult, error: transactionError } = await supabase
        .from('membership_transactions')
        .update({
          gateway_response: { payment_id: paymentId, status: 'completed' }
        })
        .eq('id', paymentRecord.id)
        .select();

      if (transactionError) {
        console.error('Error processing payment transaction:', transactionError);
        return {
          success: false,
          error: 'Failed to process payment transaction'
        };
      }

      return {
        success: true,
        paymentId: paymentId,
        orderId: orderId,
        amount: paymentRecord.amount,
        status: 'completed'
      };

    } catch (error) {
      console.error('Error in verifyPayment:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string): Promise<{ data: any[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('membership_transactions')
        .select(`
          *,
          membership_plans(name, description)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return { data: [], error: 'Failed to fetch payment history' };
      }

      return { data: data || [], error: null };

    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('membership_transactions')
        .select('*')
        .eq('transaction_id', paymentId)
        .single();

      if (paymentError || !paymentRecord) {
        return {
          success: false,
          error: 'Payment record not found'
        };
      }

      // Create Razorpay refund
      const refundResult = await razorpayService.refundPayment(
        paymentId,
        amount || paymentRecord.amount,
        'User requested refund'
      );

      if (!refundResult || !refundResult.id) {
        return {
          success: false,
          error: 'Failed to create refund'
        };
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from('membership_transactions')
        .update({
          gateway_response: { 
            ...(paymentRecord.gateway_response as any || {}),
            refund_id: refundResult.id,
            refunded_at: new Date().toISOString()
          }
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        return {
          success: false,
          error: 'Failed to update payment status'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error in refundPayment:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (!request.userId || !request.userEmail || !request.planId) {
      return {
        valid: false,
        error: 'Missing required fields'
      };
    }

    if (request.amount <= 0) {
      return {
        valid: false,
        error: 'Invalid amount'
      };
    }

    if (!this.isValidEmail(request.userEmail)) {
      return {
        valid: false,
        error: 'Invalid email format'
      };
    }

    return { valid: true };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const paymentServiceFixed = PaymentServiceFixed.getInstance();
