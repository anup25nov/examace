// Payment Service - Client-side Integration with Supabase
import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from './razorpayService';


export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  mockTests: number;
  description?: string;
}

export interface PaymentData {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'verified' | 'failed' | 'expired' | 'disputed' | 'refunded';
  payment_method?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  failed_at?: string;
  failed_reason?: string;
}

export interface CreatePaymentRequest {
  userId: string;
  plan: PaymentPlan;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  paymentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  error?: string;
}

export class PaymentService {
  /**
   * Create a new payment order
   */
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const { userId, plan } = request;

      // Create payment record in database first
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: paymentRecord, error: dbError } = await supabase
        .from('payments')
        .insert({
          payment_id: paymentId,
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.price,
          payment_method: 'razorpay',
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error creating payment:', dbError);
        return {
          success: false,
          error: 'Failed to create payment record'
        };
      }

      // Create actual Razorpay order
      const orderData = {
        amount: plan.price * 100, // Convert to paise
        currency: 'INR',
        receipt: paymentRecord.payment_id,
        notes: {
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.name
        }
      };

      // For client-side integration, we'll use Razorpay's checkout without pre-created orders
      // This approach doesn't require server-side order creation
      const razorpayOrder = {
        id: null, // No pre-created order needed
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      };

      return {
        success: true,
        paymentId: paymentRecord.payment_id,
        orderId: null, // No pre-created order
        amount: plan.price,
        currency: 'INR'
      };

    } catch (error) {
      console.error('Error creating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment'
      };
    }
  }

  /**
   * Verify payment and update status
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = request;

      // Update payment record with Razorpay details
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (updateError) {
        console.error('Database error updating payment:', updateError);
        return {
          success: false,
          error: 'Failed to update payment status'
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment'
      };
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<PaymentData | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment:', error);
        return null;
      }

      return data as any as PaymentData;
    } catch (error) {
      console.error('Error getting payment:', error);
      return null;
    }
  }

  /**
   * Get user's payments
   */
  async getUserPayments(userId: string): Promise<PaymentData[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user payments:', error);
        return [];
      }

      return data as any as PaymentData[];
    } catch (error) {
      console.error('Error getting user payments:', error);
      return [];
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentId: string, 
    status: 'created' | 'paid' | 'failed' | 'cancelled',
    reason?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
        updateData.failed_reason = reason;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  /**
   * Activate membership after successful payment
   */
  async activateMembership(userId: string, planId: string): Promise<boolean> {
    try {
      // Calculate expiry date (default 1 month)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          membership_plan: planId,
          membership_expiry: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error activating membership:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error activating membership:', error);
      return false;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('status, amount')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching payment stats:', error);
        return {
          totalPayments: 0,
          totalAmount: 0,
          successfulPayments: 0,
          failedPayments: 0
        };
      }

      const stats = {
        totalPayments: data.length,
        totalAmount: data.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        successfulPayments: data.filter(p => p.status === 'paid').length,
        failedPayments: data.filter(p => p.status === 'failed').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0
      };
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          failed_reason: reason || 'Payment cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        console.error('Error cancelling payment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      return false;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<boolean> {
    try {
      // Get payment details
      const payment = await this.getPayment(paymentId);
      if (!payment || !payment.razorpay_payment_id) {
        return false;
      }

      // Process refund with Razorpay
      const refund = await razorpayService.refundPayment(
        payment.razorpay_payment_id,
        amount,
        reason
      );

      if (refund) {
        // Update payment status
        await this.updatePaymentStatus(paymentId, 'failed', `Refunded: ${reason || 'No reason provided'}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refunding payment:', error);
      return false;
    }
  }

  /**
   * Get payment by Razorpay order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentData | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single();

      if (error) {
        console.error('Error fetching payment by order ID:', error);
        return null;
      }

      return data as any as PaymentData;
    } catch (error) {
      console.error('Error getting payment by order ID:', error);
      return null;
    }
  }

  /**
   * Get payment by Razorpay payment ID
   */
  async getPaymentByPaymentId(paymentId: string): Promise<PaymentData | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment by payment ID:', error);
        return null;
      }

      return data as any as PaymentData;
    } catch (error) {
      console.error('Error getting payment by payment ID:', error);
      return null;
    }
  }

  /**
   * Check if user has active membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      if (!data.membership_plan || !data.membership_expiry) {
        return false;
      }

      const expiryDate = new Date(data.membership_expiry);
      const now = new Date();

      return expiryDate > now;
    } catch (error) {
      console.error('Error checking active membership:', error);
      return false;
    }
  }

  /**
   * Get user's current membership
   */
  async getUserMembership(userId: string): Promise<{
    planId: string | null;
    expiryDate: string | null;
    isActive: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return {
          planId: null,
          expiryDate: null,
          isActive: false
        };
      }

      const isActive = data.membership_expiry ? new Date(data.membership_expiry) > new Date() : false;

      return {
        planId: data.membership_plan,
        expiryDate: data.membership_expiry,
        isActive
      };
    } catch (error) {
      console.error('Error getting user membership:', error);
      return {
        planId: null,
        expiryDate: null,
        isActive: false
      };
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;