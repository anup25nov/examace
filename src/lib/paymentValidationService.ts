import { supabase } from '@/integrations/supabase/client';

export interface PaymentValidationResult {
  success: boolean;
  status: 'success' | 'pending' | 'failed' | 'timeout';
  message: string;
  paymentId?: string;
  retryAfter?: number; // seconds to wait before retry
  error?: string;
}

export interface PaymentStatus {
  id: string;
  payment_id: string;
  status: 'pending' | 'paid' | 'verified' | 'failed' | 'expired' | 'disputed';
  verification_status: 'none' | 'pending' | 'verified' | 'failed' | 'disputed';
  created_at: string;
  expires_at: string;
  paid_at?: string;
  verified_at?: string;
  failed_reason?: string;
}

export class PaymentValidationService {
  private static instance: PaymentValidationService;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private readonly PAYMENT_TIMEOUT = 300000; // 5 minutes

  public static getInstance(): PaymentValidationService {
    if (!PaymentValidationService.instance) {
      PaymentValidationService.instance = new PaymentValidationService();
    }
    return PaymentValidationService.instance;
  }

  /**
   * Create a payment record and start validation process
   */
  async createPaymentRecord(plan: {
    id: string;
    name: string;
    price: number;
    mockTests: number;
  }): Promise<{ paymentId: string; error?: string }> {
    try {
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + this.PAYMENT_TIMEOUT).toISOString();

      // Create payment record in database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          payment_id: paymentId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.price,
          payment_method: 'upi',
          status: 'pending',
          verification_status: 'none',
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment record:', error);
        return { paymentId: '', error: 'Failed to create payment record' };
      }

      return { paymentId };
    } catch (error) {
      console.error('Error creating payment record:', error);
      return { paymentId: '', error: 'Failed to create payment record' };
    }
  }

  /**
   * Validate payment status
   */
  async validatePayment(paymentId: string): Promise<PaymentValidationResult> {
    try {
      // Get payment status from database
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error || !payment) {
        return {
          success: false,
          status: 'failed',
          message: 'Payment record not found',
          error: 'Payment not found in database'
        };
      }

      // Check if payment has expired (use type assertion for database compatibility)
      const paymentData = payment as any;
      if (paymentData.expires_at && new Date(paymentData.expires_at) < new Date()) {
        await this.updatePaymentStatus(paymentId, 'expired', 'Payment expired');
        return {
          success: false,
          status: 'timeout',
          message: 'Payment has expired. Please try again.',
          error: 'Payment timeout'
        };
      }

      // Check payment status
      switch (payment.status) {
        case 'verified':
          return {
            success: true,
            status: 'success',
            message: 'Payment verified successfully!',
            paymentId: paymentId
          };

        case 'paid':
          // Payment is paid but not yet verified - this is the pending state
          return {
            success: false,
            status: 'pending',
            message: 'Payment received, verifying...',
            paymentId: paymentId,
            retryAfter: 3 // Retry after 3 seconds
          };

        case 'failed':
          return {
            success: false,
            status: 'failed',
            message: paymentData.failed_reason || 'Payment failed. Please try again.',
            error: paymentData.failed_reason || 'Payment failed'
          };

        case 'expired':
          return {
            success: false,
            status: 'timeout',
            message: 'Payment has expired. Please try again.',
            error: 'Payment expired'
          };

        case 'pending':
        default:
          // Payment is still pending - simulate checking with UPI system
          return await this.simulateUPIValidation(paymentId, payment);
      }
    } catch (error) {
      console.error('Error validating payment:', error);
      return {
        success: false,
        status: 'failed',
        message: 'Validation failed. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate UPI payment validation (replace with real UPI API integration)
   */
  private async simulateUPIValidation(paymentId: string, payment: any): Promise<PaymentValidationResult> {
    try {
      // Simulate UPI system check
      // In real implementation, you would call UPI API here
      const upiCheckResult = await this.checkUPIPaymentStatus(paymentId, payment.amount);
      
      if (upiCheckResult.success) {
        // Payment found in UPI system
        await this.updatePaymentStatus(paymentId, 'paid', 'Payment received from UPI');
        
        // Start verification process
        setTimeout(async () => {
          await this.verifyPayment(paymentId);
        }, 2000);

        return {
          success: false,
          status: 'pending',
          message: 'Payment received, verifying...',
          paymentId: paymentId,
          retryAfter: 3
        };
      } else {
        // Payment not found in UPI system yet
        return {
          success: false,
          status: 'pending',
          message: 'Waiting for payment confirmation...',
          paymentId: paymentId,
          retryAfter: 5
        };
      }
    } catch (error) {
      console.error('Error in UPI validation:', error);
      return {
        success: false,
        status: 'pending',
        message: 'Checking payment status...',
        paymentId: paymentId,
        retryAfter: 5
      };
    }
  }

  /**
   * Simulate UPI payment status check
   * In real implementation, integrate with UPI API
   */
  private async checkUPIPaymentStatus(paymentId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate random success/failure for demo
    // In real implementation, call actual UPI API
    const random = Math.random();
    
    if (random > 0.7) {
      // 30% chance of finding payment
      return { success: true };
    } else {
      // 70% chance of not finding payment yet
      return { success: false, error: 'Payment not found in UPI system yet' };
    }
  }

  /**
   * Verify payment and activate membership
   */
  private async verifyPayment(paymentId: string): Promise<void> {
    try {
      // Update payment status to verified
      await this.updatePaymentStatus(paymentId, 'verified', 'Payment verified successfully');

      // Activate user membership
      await this.activateMembership(paymentId);
    } catch (error) {
      console.error('Error verifying payment:', error);
      await this.updatePaymentStatus(paymentId, 'failed', 'Verification failed');
    }
  }

  /**
   * Update payment status in database
   */
  private async updatePaymentStatus(paymentId: string, status: string, reason?: string): Promise<void> {
    try {
      const updateData: any = {
        status: status
      };

      // Only add updated_at if the column exists
      try {
        updateData.updated_at = new Date().toISOString();
      } catch (error) {
        // Column doesn't exist, skip it
        console.warn('updated_at column not found, skipping update');
      }

      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.verification_status = 'pending';
      } else if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.verification_status = 'verified';
      } else if (status === 'failed') {
        updateData.failed_reason = reason;
        updateData.verification_status = 'failed';
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update(updateData)
        .eq('payment_id', paymentId);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        // Don't throw error, just log it
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  /**
   * Activate user membership
   */
  private async activateMembership(paymentId: string): Promise<void> {
    try {
      // Get payment details
      const { data: payment, error } = await supabase
        .from('payments')
        .select('user_id, plan_id')
        .eq('payment_id', paymentId)
        .single();

      if (error || !payment) {
        throw new Error('Payment not found');
      }

      // Calculate membership expiry
      const expiryDate = this.calculateMembershipExpiry(payment.plan_id);

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({
          membership_plan: payment.plan_id,
          membership_expiry: expiryDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id);

    } catch (error) {
      console.error('Error activating membership:', error);
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
   * Start payment validation polling
   */
  async startPaymentValidation(paymentId: string, onStatusUpdate: (result: PaymentValidationResult) => void): Promise<void> {
    let attempts = 0;
    
    const pollPayment = async () => {
      attempts++;
      
      try {
        const result = await this.validatePayment(paymentId);
        onStatusUpdate(result);
        
        if (result.success || result.status === 'failed' || result.status === 'timeout') {
          // Stop polling
          return;
        }
        
        if (attempts >= this.MAX_RETRY_ATTEMPTS) {
          // Max attempts reached
          onStatusUpdate({
            success: false,
            status: 'timeout',
            message: 'Payment validation timeout. Please contact support.',
            error: 'Max retry attempts reached'
          });
          return;
        }
        
        // Continue polling after delay
        setTimeout(pollPayment, result.retryAfter ? result.retryAfter * 1000 : this.RETRY_DELAY);
        
      } catch (error) {
        console.error('Error in payment polling:', error);
        onStatusUpdate({
          success: false,
          status: 'failed',
          message: 'Validation error. Please try again.',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
    
    // Start polling
    pollPayment();
  }
}

// Export singleton instance
export const paymentValidationService = PaymentValidationService.getInstance();
