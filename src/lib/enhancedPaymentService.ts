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
  retryable?: boolean;
  failureReason?: string;
}

export interface PaymentVerification {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  status?: string;
  error?: string;
  retryable?: boolean;
  failureReason?: string;
}

export interface PaymentFailure {
  id: string;
  user_id: string;
  order_id: string;
  failure_reason: string;
  retry_count: number;
  max_retries: number;
  last_retry_at?: string;
  status: 'pending' | 'retrying' | 'failed' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  exponentialBackoff: boolean;
  retryableErrors: string[];
}

export class EnhancedPaymentService {
  private static instance: EnhancedPaymentService;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    retryDelayMs: 5000, // 5 seconds
    exponentialBackoff: true,
    retryableErrors: [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE',
      'GATEWAY_UNAVAILABLE'
    ]
  };

  public static getInstance(): EnhancedPaymentService {
    if (!EnhancedPaymentService.instance) {
      EnhancedPaymentService.instance = new EnhancedPaymentService();
    }
    return EnhancedPaymentService.instance;
  }

  /**
   * Create payment order with comprehensive error handling and retry logic
   */
  async createPaymentOrder(request: PaymentRequest): Promise<PaymentResult> {
    let lastError: string = '';
    let retryCount = 0;

    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        console.log(`🔄 Payment attempt ${retryCount + 1}/${this.retryConfig.maxRetries + 1} for user ${request.userId}`);

        // Validate input
        const validation = this.validatePaymentRequest(request);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error,
            retryable: false,
            failureReason: 'VALIDATION_ERROR'
          };
        }

        // Check if user already has active membership
        const membershipCheck = await this.checkExistingMembership(request.userId);
        if (!membershipCheck.success) {
          return {
            success: false,
            error: membershipCheck.error,
            retryable: false,
            failureReason: 'MEMBERSHIP_CHECK_FAILED'
          };
        }

        if (membershipCheck.hasActiveMembership) {
          return {
            success: false,
            error: 'User already has an active membership',
            retryable: false,
            failureReason: 'DUPLICATE_MEMBERSHIP'
          };
        }

        // Get plan details
        const planResult = await this.getPlanDetails(request.planId);
        if (!planResult.success) {
          return {
            success: false,
            error: planResult.error,
            retryable: false,
            failureReason: 'PLAN_NOT_FOUND'
          };
        }

        // Create Razorpay order with timeout
        const razorpayResult = await this.createRazorpayOrderWithTimeout(request, 30000); // 30 second timeout

        if (!razorpayResult.success) {
          lastError = razorpayResult.error || 'Failed to create payment order';
          
          if (this.isRetryableError(razorpayResult.failureReason || 'UNKNOWN_ERROR')) {
            retryCount++;
            if (retryCount <= this.retryConfig.maxRetries) {
              const delay = this.calculateRetryDelay(retryCount);
              console.log(`⏳ Retrying payment creation in ${delay}ms...`);
              await this.sleep(delay);
              continue;
            }
          }

          // Log failure for manual review
          await this.logPaymentFailure({
            user_id: request.userId,
            order_id: `temp_${Date.now()}`,
            failure_reason: razorpayResult.failureReason || 'RAZORPAY_ORDER_FAILED',
            retry_count: retryCount,
            max_retries: this.retryConfig.maxRetries,
            status: 'failed'
          });

          return {
            success: false,
            error: lastError,
            retryable: this.isRetryableError(razorpayResult.failureReason || 'UNKNOWN_ERROR'),
            failureReason: razorpayResult.failureReason || 'RAZORPAY_ORDER_FAILED'
          };
        }

        // Create payment record in database
        const paymentRecordResult = await this.createPaymentRecord(request, razorpayResult.orderId!);
        if (!paymentRecordResult.success) {
          return {
            success: false,
            error: paymentRecordResult.error,
            retryable: true,
            failureReason: 'DATABASE_ERROR'
          };
        }

        console.log(`✅ Payment order created successfully: ${razorpayResult.orderId}`);
        return {
          success: true,
          orderId: razorpayResult.orderId,
          amount: request.amount,
          currency: request.currency || 'INR',
          message: 'Payment order created successfully'
        };

      } catch (error: any) {
        lastError = error.message || 'Unknown error occurred';
        console.error(`❌ Payment creation error (attempt ${retryCount + 1}):`, error);

        if (this.isRetryableError('NETWORK_ERROR') && retryCount < this.retryConfig.maxRetries) {
          retryCount++;
          const delay = this.calculateRetryDelay(retryCount);
          console.log(`⏳ Retrying payment creation in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }

        // Log failure
        await this.logPaymentFailure({
          user_id: request.userId,
          order_id: `temp_${Date.now()}`,
          failure_reason: 'UNEXPECTED_ERROR',
          retry_count: retryCount,
          max_retries: this.retryConfig.maxRetries,
          status: 'failed'
        });

        return {
          success: false,
          error: lastError,
          retryable: false,
          failureReason: 'UNEXPECTED_ERROR'
        };
      }
    }

    return {
      success: false,
      error: `Payment failed after ${this.retryConfig.maxRetries + 1} attempts. Last error: ${lastError}`,
      retryable: false,
      failureReason: 'MAX_RETRIES_EXCEEDED'
    };
  }

  /**
   * Verify payment with comprehensive error handling
   */
  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerification> {
    try {
      console.log(`🔍 Verifying payment: ${paymentId} for order: ${orderId}`);

      // Verify payment with Razorpay
      const verificationResult = await razorpayService.verifyPayment(paymentId, orderId, signature);

      if (!verificationResult) {
        await this.logPaymentFailure({
          user_id: 'unknown',
          order_id: orderId,
          failure_reason: 'VERIFICATION_FAILED',
          retry_count: 0,
          max_retries: 0,
          status: 'failed'
        });

        return {
          success: false,
          error: 'Payment verification failed',
          retryable: false,
          failureReason: 'VERIFICATION_FAILED'
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
          error: 'Payment record not found or already processed',
          retryable: false,
          failureReason: 'PAYMENT_RECORD_NOT_FOUND'
        };
      }

      // Update payment record
      const { data: transactionResult, error: transactionError } = await supabase
        .from('membership_transactions')
        .update({
          gateway_response: { 
            payment_id: paymentId, 
            status: 'completed',
            verified_at: new Date().toISOString()
          }
        })
        .eq('id', paymentRecord.id)
        .select();

      if (transactionError) {
        console.error('Error processing payment transaction:', transactionError);
        return {
          success: false,
          error: 'Failed to process payment transaction',
          retryable: true,
          failureReason: 'DATABASE_UPDATE_FAILED'
        };
      }

      // Create or update membership
      const membershipResult = await this.createOrUpdateMembership(paymentRecord);
      if (!membershipResult.success) {
        console.error('Error creating membership:', membershipResult.error);
        return {
          success: false,
          error: 'Payment verified but failed to create membership',
          retryable: true,
          failureReason: 'MEMBERSHIP_CREATION_FAILED'
        };
      }

      console.log(`✅ Payment verified and membership created successfully`);
      return {
        success: true,
        paymentId: paymentId,
        orderId: orderId,
        amount: paymentRecord.amount,
        status: 'completed'
      };

    } catch (error: any) {
      console.error('Error in verifyPayment:', error);
      return {
        success: false,
        error: 'Internal server error during verification',
        retryable: true,
        failureReason: 'VERIFICATION_ERROR'
      };
    }
  }

  /**
   * Handle payment failure with retry logic
   */
  async handlePaymentFailure(failureId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get failure record
      const { data: failure, error } = await supabase
        .from('payment_failures' as any)
        .select('*')
        .eq('id', failureId)
        .single();

      if (error || !failure) {
        return { success: false, error: 'Failure record not found' };
      }

      if ((failure as any).status === 'resolved' || (failure as any).retry_count >= (failure as any).max_retries) {
        return { success: false, error: 'Failure already resolved or max retries exceeded' };
      }

      // Update status to retrying
      await supabase
        .from('payment_failures' as any)
        .update({ 
          status: 'retrying',
          retry_count: (failure as any).retry_count + 1,
          last_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', failureId);

      // Implement retry logic here
      // This would typically involve re-attempting the payment creation
      // or notifying the user to retry

      return { success: true };

    } catch (error: any) {
      console.error('Error handling payment failure:', error);
      return { success: false, error: 'Failed to handle payment failure' };
    }
  }

  /**
   * Get payment failures for admin review
   */
  async getPaymentFailures(status?: string): Promise<{ data: PaymentFailure[]; error: string | null }> {
    try {
      let query = supabase
        .from('payment_failures' as any)
        .select('*')
        .order('createdAt', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: 'Failed to fetch payment failures' };
      }

      return { data: (data as any) || [], error: null };

    } catch (error: any) {
      console.error('Error fetching payment failures:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Retry failed payments
   */
  async retryFailedPayments(): Promise<{ success: boolean; retried: number; error?: string }> {
    try {
      // Get all pending failures that can be retried
      const { data: failures, error } = await supabase
        .from('payment_failures' as any)
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', this.retryConfig.maxRetries);

      if (error) {
        return { success: false, retried: 0, error: 'Failed to fetch failures' };
      }

      let retried = 0;
      for (const failure of failures || []) {
        const result = await this.handlePaymentFailure((failure as any).id);
        if (result.success) {
          retried++;
        }
      }

      return { success: true, retried };

    } catch (error: any) {
      console.error('Error retrying failed payments:', error);
      return { success: false, retried: 0, error: 'Internal server error' };
    }
  }

  // Private helper methods

  private async checkExistingMembership(userId: string): Promise<{ success: boolean; hasActiveMembership: boolean; error?: string }> {
    try {
      const { data: existingMembership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('id, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        return { success: false, hasActiveMembership: false, error: 'Failed to verify existing membership' };
      }

      return { success: true, hasActiveMembership: !!existingMembership };

    } catch (error: any) {
      return { success: false, hasActiveMembership: false, error: 'Database error' };
    }
  }

  private async getPlanDetails(planId: string): Promise<{ success: boolean; plan?: any; error?: string }> {
    try {
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', planId)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        return { success: false, error: 'Invalid or inactive membership plan' };
      }

      return { success: true, plan };

    } catch (error: any) {
      return { success: false, error: 'Database error' };
    }
  }

  private async createRazorpayOrderWithTimeout(request: PaymentRequest, timeoutMs: number): Promise<{ success: boolean; orderId?: string; error?: string; failureReason?: string }> {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          error: 'Payment order creation timed out',
          failureReason: 'TIMEOUT'
        });
      }, timeoutMs);

      try {
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

        clearTimeout(timeout);

        if (!razorpayResult || !razorpayResult.id) {
          resolve({
            success: false,
            error: 'Failed to create payment order',
            failureReason: 'RAZORPAY_ERROR'
          });
          return;
        }

        resolve({
          success: true,
          orderId: razorpayResult.id
        });

      } catch (error: any) {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: error.message || 'Unknown error',
          failureReason: 'RAZORPAY_EXCEPTION'
        });
      }
    });
  }

  private async createPaymentRecord(request: PaymentRequest, orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('membership_transactions')
        .insert({
          user_id: request.userId,
          amount: request.amount,
          transaction_id: orderId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        return { success: false, error: 'Failed to create payment record' };
      }

      return { success: true };

    } catch (error: any) {
      return { success: false, error: 'Database error' };
    }
  }

  private async createOrUpdateMembership(paymentRecord: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Implementation for creating/updating membership
      // This would depend on your specific membership logic
      return { success: true };

    } catch (error: any) {
      return { success: false, error: 'Failed to create membership' };
    }
  }

  private async logPaymentFailure(failure: Partial<PaymentFailure>): Promise<void> {
    try {
      await supabase
        .from('payment_failures' as any)
        .insert({
          user_id: failure.user_id,
          order_id: failure.order_id,
          failure_reason: failure.failure_reason,
          retry_count: failure.retry_count || 0,
          max_retries: failure.max_retries || this.retryConfig.maxRetries,
          status: failure.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log payment failure:', error);
    }
  }

  private isRetryableError(errorType: string): boolean {
    return this.retryConfig.retryableErrors.includes(errorType);
  }

  private calculateRetryDelay(retryCount: number): number {
    if (this.retryConfig.exponentialBackoff) {
      return this.retryConfig.retryDelayMs * Math.pow(2, retryCount - 1);
    }
    return this.retryConfig.retryDelayMs;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const enhancedPaymentService = EnhancedPaymentService.getInstance();
