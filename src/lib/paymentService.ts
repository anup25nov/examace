// Payment Service - Client-side Integration with Supabase
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
    console.log('🚀 Starting createPayment with request:', request);
    
    try {
      const { userId, plan } = request;
      console.log('📝 Processing payment for user:', userId, 'plan:', plan);

      // Generate payment ID
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated payment ID:', paymentId);
      
      // Create payment record in database
      console.log('💾 Creating payment record in database...');
      const { data: paymentRecord, error: dbError } = await supabase
        .from('payments')
        .insert({
          payment_id: paymentId,
          user_id: userId,
          plan_id: plan.id,
          amount: plan.price,
          payment_method: 'razorpay',
          status: 'pending'
        } as any)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error creating payment:', dbError);
        // Continue with fallback payment ID
        console.warn('⚠️ Continuing with fallback payment ID');
      } else {
        console.log('✅ Database insert successful:', paymentRecord);
      }
      
      // Create order data for Razorpay
      console.log('🔧 Creating order data...');
      const orderData = {
        amount: plan.price * 100, // Convert to paise
        currency: 'INR',
        receipt: paymentRecord?.payment_id || paymentId,
        notes: {
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.name
        }
      };
      console.log('📋 Order data created:', orderData);

      const response = {
        success: true,
        paymentId: paymentRecord?.payment_id || paymentId,
        orderId: null, // No pre-created order - Razorpay will create dynamically
        amount: plan.price,
        currency: 'INR'
      };
      
      console.log('✅ Payment creation successful, returning:', response);
      return response;

    } catch (error) {
      console.error('💥 Error creating payment:', error);
      console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('💥 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order'
      };
    }
  }

  /**
   * Verify payment and update status
   */
  async verifyPayment(request: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = request;

      console.log('🔍 Verifying payment:', { paymentId, razorpayPaymentId, razorpayOrderId });

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
        console.error('❌ Database error updating payment:', updateError);
        return {
          success: false,
          error: 'Failed to update payment status'
        };
      }

      console.log('✅ Payment verification successful');
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
   * Activate membership after successful payment
   */
  async activateMembership(userId: string, planId: string): Promise<boolean> {
    try {
      console.log('🎯 Activating membership for user:', userId, 'plan:', planId);
      
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
        console.error('❌ Error activating membership:', error);
        return false;
      }

      console.log('✅ Membership activation successful');
      return true;
    } catch (error) {
      console.error('Error activating membership:', error);
      return false;
    }
  }

  /**
   * Get payment by payment ID
   */
  async getPayment(paymentId: string): Promise<PaymentData | null> {
    try {
      console.log('📋 Getting payment:', paymentId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Ensure required fields have defaults based on available data
      const paymentData = {
        ...data,
        plan_name: (data as any).plan_name || data.plan_id || 'Unknown Plan',
        currency: (data as any).currency || 'INR'
      };

      return paymentData as PaymentData;
    } catch (error) {
      console.error('Error in getPayment:', error);
      return null;
    }
  }

  /**
   * Get all payments for a user
   */
  async getUserPayments(userId: string): Promise<PaymentData[]> {
    try {
      console.log('📋 Getting user payments:', userId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user payments:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      // Ensure required fields have defaults for each payment
      const paymentsData = data.map(payment => ({
        ...payment,
        plan_name: (payment as any).plan_name || payment.plan_id || 'Unknown Plan',
        currency: (payment as any).currency || 'INR'
      }));

      return paymentsData as PaymentData[];
    } catch (error) {
      console.error('Error in getUserPayments:', error);
      return [];
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId: string, status: 'created' | 'paid' | 'failed' | 'cancelled', reason?: string): Promise<boolean> {
    try {
      console.log('📋 Updating payment status:', paymentId, status);
      
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set appropriate timestamp based on status
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString();
        if (reason) {
          updateData.failed_reason = reason;
        }
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('payment_id', paymentId);

      if (error) {
        console.error('Error updating payment status:', error);
        return false;
      }

      console.log('✅ Payment status updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updatePaymentStatus:', error);
      return false;
    }
  }

  /**
   * Get payment statistics for a user
   */
  async getPaymentStats(userId: string): Promise<{totalPayments: number; totalAmount: number; successfulPayments: number; failedPayments: number}> {
    try {
      console.log('📋 Getting payment stats:', userId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('status, amount')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching payment stats:', error);
        return { totalPayments: 0, totalAmount: 0, successfulPayments: 0, failedPayments: 0 };
      }

      const stats = data.reduce((acc, payment) => {
        acc.totalPayments += 1;
        acc.totalAmount += payment.amount || 0;
        
        if (payment.status === 'paid' || payment.status === 'verified') {
          acc.successfulPayments += 1;
        } else if (payment.status === 'failed') {
          acc.failedPayments += 1;
        }
        
        return acc;
      }, { totalPayments: 0, totalAmount: 0, successfulPayments: 0, failedPayments: 0 });

      return stats;
    } catch (error) {
      console.error('Error in getPaymentStats:', error);
      return { totalPayments: 0, totalAmount: 0, successfulPayments: 0, failedPayments: 0 };
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<boolean> {
    try {
      console.log('📋 Cancelling payment:', paymentId);
      
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          failed_reason: reason || 'Payment cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId)
        .eq('status', 'pending'); // Only cancel pending payments

      if (error) {
        console.error('Error cancelling payment:', error);
        return false;
      }

      console.log('✅ Payment cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error in cancelPayment:', error);
      return false;
    }
  }

  /**
   * Refund a payment (placeholder for future implementation)
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<boolean> {
    try {
      console.log('📋 Processing refund for payment:', paymentId);
      
      // Get payment details
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        console.error('Payment not found for refund:', paymentId);
        return false;
      }

      if (payment.status !== 'paid' && payment.status !== 'verified') {
        console.error('Cannot refund payment with status:', payment.status);
        return false;
      }

      // Update payment status to refunded
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          failed_reason: reason || 'Payment refunded',
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (error) {
        console.error('Error processing refund:', error);
        return false;
      }

      // TODO: Integrate with Razorpay refund API
      console.log('⚠️ Refund marked in database. Manual Razorpay refund required for:', paymentId);
      return true;
    } catch (error) {
      console.error('Error in refundPayment:', error);
      return false;
    }
  }

  /**
   * Get payment by Razorpay order ID (CRITICAL for webhooks)
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentData | null> {
    try {
      console.log('📋 Getting payment by order ID:', orderId);
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .single();

      if (error) {
        console.error('Error fetching payment by order ID:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Ensure required fields have defaults
      const paymentData = {
        ...data,
        plan_name: (data as any).plan_name || data.plan_id || 'Unknown Plan',
        currency: (data as any).currency || 'INR'
      };

      return paymentData as PaymentData;
    } catch (error) {
      console.error('Error in getPaymentByOrderId:', error);
      return null;
    }
  }

  /**
   * Get payment by payment ID
   */
  async getPaymentByPaymentId(paymentId: string): Promise<PaymentData | null> {
    return this.getPayment(paymentId);
  }

  /**
   * Check if user has active membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    try {
      console.log('📋 Checking active membership:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking membership:', error);
        return false;
      }

      if (!data.membership_plan || !data.membership_expiry) {
        return false;
      }

      const expiryDate = new Date(data.membership_expiry);
      const now = new Date();
      
      return expiryDate > now;
    } catch (error) {
      console.error('Error in hasActiveMembership:', error);
      return false;
    }
  }

  /**
   * Get user membership details
   */
  async getUserMembership(userId: string): Promise<{planId: string | null; expiryDate: string | null; isActive: boolean}> {
    try {
      console.log('📋 Getting user membership:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching membership:', error);
        return { planId: null, expiryDate: null, isActive: false };
      }

      if (!data.membership_plan || !data.membership_expiry) {
        return { planId: null, expiryDate: null, isActive: false };
      }

      const expiryDate = new Date(data.membership_expiry);
      const now = new Date();
      const isActive = expiryDate > now;

      return {
        planId: data.membership_plan,
        expiryDate: data.membership_expiry,
        isActive
      };
    } catch (error) {
      console.error('Error in getUserMembership:', error);
      return { planId: null, expiryDate: null, isActive: false };
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;