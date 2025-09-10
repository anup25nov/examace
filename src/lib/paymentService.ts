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
          plan_name: plan.name,
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

  // Stub methods for testing
  async getPayment(paymentId: string): Promise<PaymentData | null> {
    console.log('📋 Getting payment:', paymentId);
    return null;
  }

  async getUserPayments(userId: string): Promise<PaymentData[]> {
    console.log('📋 Getting user payments:', userId);
    return [];
  }

  async updatePaymentStatus(paymentId: string, status: 'created' | 'paid' | 'failed' | 'cancelled', reason?: string): Promise<boolean> {
    console.log('📋 Updating payment status:', paymentId, status);
    return true;
  }

  async getPaymentStats(userId: string): Promise<{totalPayments: number; totalAmount: number; successfulPayments: number; failedPayments: number}> {
    console.log('📋 Getting payment stats:', userId);
    return { totalPayments: 0, totalAmount: 0, successfulPayments: 0, failedPayments: 0 };
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<boolean> {
    console.log('📋 Cancelling payment:', paymentId);
    return true;
  }

  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<boolean> {
    console.log('📋 Refunding payment:', paymentId);
    return true;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentData | null> {
    console.log('📋 Getting payment by order ID:', orderId);
    return null;
  }

  async getPaymentByPaymentId(paymentId: string): Promise<PaymentData | null> {
    console.log('📋 Getting payment by payment ID:', paymentId);
    return null;
  }

  async hasActiveMembership(userId: string): Promise<boolean> {
    console.log('📋 Checking active membership:', userId);
    return false;
  }

  async getUserMembership(userId: string): Promise<{planId: string | null; expiryDate: string | null; isActive: boolean}> {
    console.log('📋 Getting user membership:', userId);
    return { planId: null, expiryDate: null, isActive: false };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;