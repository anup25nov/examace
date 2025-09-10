// Payment Service - Client-side Integration with API Routes
import { supabase } from '@/integrations/supabase/client';

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
  status: 'created' | 'paid' | 'failed' | 'cancelled';
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

      // Call API route to create payment
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          plan
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create payment'
        };
      }

      return result;

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

      // Call API route to verify payment
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to verify payment'
        };
      }

      return result;

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
      // Call API route to activate membership
      const response = await fetch('/api/activate-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error activating membership:', result.error);
        return false;
      }

      return result.success;

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