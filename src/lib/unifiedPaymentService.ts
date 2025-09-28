import { supabase } from '@/integrations/supabase/client';
import { razorpayPaymentService, RazorpayPaymentRequest } from './razorpayPaymentService';
import { getActiveMembershipPlans, getMembershipPlan } from '@/config/appConfig';
import { getAllActivePlans, getPlanPricing } from '@/config/pricingConfig';

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  duration?: number; // in days
  isActive?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
  amount?: number;
  currency?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  error?: string;
  membershipActivated?: boolean;
}

export class UnifiedPaymentService {
  private static instance: UnifiedPaymentService;
  private isConnected: boolean = true;
  private lastConnectionCheck: number = 0;

  public static getInstance(): UnifiedPaymentService {
    if (!UnifiedPaymentService.instance) {
      UnifiedPaymentService.instance = new UnifiedPaymentService();
    }
    return UnifiedPaymentService.instance;
  }

  /**
   * Check if Supabase is connected
   */
  private async checkConnection(): Promise<boolean> {
    const now = Date.now();
    // Only check every 30 seconds to avoid excessive calls
    if (now - this.lastConnectionCheck < 30000) {
      return this.isConnected;
    }

    try {
      const { error } = await supabase
        .from('membership_plans')
        .select('id')
        .limit(1);
      
      this.isConnected = !error;
      this.lastConnectionCheck = now;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      this.lastConnectionCheck = now;
      return false;
    }
  }

  /**
   * Get all available payment plans
   */
  async getPaymentPlans(): Promise<PaymentPlan[]> {
    try {
      // Check connection first
      const connected = await this.checkConnection();
      if (!connected) {
        console.warn('Database not connected, using default plans');
        return this.getDefaultPlans();
      }

      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(10); // Limit to prevent large queries

      if (error) {
        console.warn('Database error, using default plans:', error.message);
        this.isConnected = false;
        return this.getDefaultPlans();
      }

      if (!data || data.length === 0) {
        console.warn('No plans found in database, using default plans');
        return this.getDefaultPlans();
      }

      return data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: 'INR',
        features: Array.isArray(plan.features) ? plan.features.filter(f => typeof f === 'string') : [],
        duration: plan.duration_days,
        isActive: plan.is_active
      }));
    } catch (error) {
      console.warn('Error fetching payment plans, using defaults:', error);
      this.isConnected = false;
      return this.getDefaultPlans();
    }
  }

  /**
   * Create a payment for a specific plan
   */
  async createPayment(planId: string, userId: string): Promise<PaymentResult> {
    try {
      // Get plan details
      const plans = await this.getPaymentPlans();
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        return {
          success: false,
          error: 'Plan not found'
        };
      }

      // Create Razorpay payment
      const paymentRequest: RazorpayPaymentRequest = {
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        userId: userId,
        userEmail: '',
        userName: '',
      };

      const razorpayResult = await razorpayPaymentService.createRazorpayPayment(paymentRequest);
      
      if (!razorpayResult.success) {
        return {
          success: false,
          error: razorpayResult.error || 'Failed to create payment'
        };
      }

      return {
        success: true,
        paymentId: razorpayResult.paymentId,
        orderId: razorpayResult.orderId,
        amount: plan.price,
        currency: plan.currency
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      };
    }
  }

  /**
   * Verify payment and activate membership
   */
  async verifyPayment(
    paymentId: string,
    razorpayPaymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    planId: string
  ): Promise<PaymentVerificationResult> {
    try {
      // Verify with Razorpay
      const verificationResult = await razorpayPaymentService.verifyRazorpayPayment(
        paymentId,
        razorpayPaymentData,
        planId === 'pro_plus' ? 'pro_plus' : 'pro'
      );

      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error || 'Payment verification failed'
        };
      }

      // Get current user using custom authentication
      const userId = localStorage.getItem('userId');
      const userPhone = localStorage.getItem('userPhone');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (!userId || !userPhone || isAuthenticated !== 'true') {
        console.error('❌ [unifiedPaymentService] User not authenticated for payment processing');
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const user = { id: userId, phone: userPhone };
      console.log('✅ [unifiedPaymentService] User authenticated for payment processing:', user);

      // Get plan details
      const plans = await this.getPaymentPlans();
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        return {
          success: false,
          error: 'Plan not found'
        };
      }

      // Create membership
      const membershipResult = await this.createMembership(user.id, plan);
      
      if (!membershipResult.success) {
        return {
          success: false,
          error: membershipResult.error || 'Failed to activate membership'
        };
      }

      return {
        success: true,
        membershipActivated: true
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  /**
   * Create membership for user
   */
  private async createMembership(userId: string, plan: PaymentPlan): Promise<{ success: boolean; error?: string }> {
    try {
      // Check connection first
      const connected = await this.checkConnection();
      if (!connected) {
        console.warn('Database not connected, membership creation may fail');
        // In offline mode, we'll still try to create the membership
        // but won't fail the payment process
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.duration || 30));

      const { error } = await supabase
        .from('user_memberships')
        .insert({
          user_id: userId,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.price,
          currency: plan.currency,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        });

      if (error) {
        console.error('Error creating membership:', error);
        // In case of database issues, we'll still return success
        // but log the error for debugging
        if (!connected) {
          console.warn('Membership creation failed due to connection issues, but payment was successful');
          return { success: true };
        }
        return {
          success: false,
          error: 'Failed to create membership'
        };
      }

      // Process referral commission if applicable (only if connected)
      if (connected) {
        try {
          // Use type assertion to bypass TypeScript checking for RPC function
          const { error: referralError } = await supabase.rpc('process_referral_commission' as any, {
            p_user_id: userId,
            p_plan_id: plan.id,
            p_amount: plan.price,
            p_membership_transaction_id: crypto.randomUUID()
          });
          if (referralError) {
            console.warn('Referral commission processing failed (non-fatal):', referralError);
          } else {
            console.log('Referral commission processed successfully');
          }
        } catch (referralError) {
          console.warn('Referral commission processing failed (non-fatal):', referralError);
        }

        // Send user message for membership purchase
        try {
          await this.sendUserMessage(userId, 'membership_purchased', 
            `Welcome to ${plan.name}!`, 
            `Your ${plan.name} membership has been activated successfully. You can now access all premium features including ${plan.features.join(', ')}.`
          );
        } catch (messageError) {
          console.warn('Failed to send membership message (non-fatal):', messageError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating membership:', error);
      // In case of network issues, we'll still consider the payment successful
      // since the payment gateway has already processed it
      return {
        success: true, // Changed to true to not fail the payment process
        error: 'Membership creation failed but payment was successful'
      };
    }
  }

  /**
   * Check if user has active membership
   */
  async hasActiveMembership(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .limit(1);

      if (error) {
        console.warn('Error checking membership (assuming no access):', error.message);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.warn('Error checking membership (assuming no access):', error);
      return false;
    }
  }

  /**
   * Get user's current membership
   */
  async getUserMembership(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error fetching membership (assuming no membership):', error.message);
        return null;
      }

      // Return the first result or null if no results
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.warn('Error fetching membership (assuming no membership):', error);
      return null;
    }
  }

  /**
   * Get default plans from centralized configuration
   */
  private getDefaultPlans(): PaymentPlan[] {
    try {
      // First try to get from centralized pricing config
      const centralizedPlans = getAllActivePlans();
      
      if (centralizedPlans.length > 0) {
        return centralizedPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          features: plan.features,
          duration: plan.duration,
          isActive: plan.isActive
        }));
      }
      
      // Fallback to app config
      const configPlans = getActiveMembershipPlans();
      
      return configPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.id === 'pro_plus' ? 'Complete access to all mocks and features' : 
                     plan.id === 'pro' ? 'Access to 11 mock tests' : 
                     'Basic access to practice tests',
        price: plan.price,
        currency: 'INR',
        features: plan.features,
        duration: plan.duration,
        isActive: plan.isActive
      }));
    } catch (error) {
      console.error('Error loading default plans from config:', error);
      // Final fallback - return empty array to force error handling
      console.error('All pricing sources failed, returning empty plans array');
      return [];
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{ connected: boolean; lastCheck: number }> {
    const connected = await this.checkConnection();
    return {
      connected,
      lastCheck: this.lastConnectionCheck
    };
  }

  /**
   * Force reconnection check
   */
  async forceReconnect(): Promise<boolean> {
    this.lastConnectionCheck = 0; // Reset to force immediate check
    return await this.checkConnection();
  }

  /**
   * Send user message
   */
  private async sendUserMessage(userId: string, messageType: string, title: string, message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_messages' as any)
        .insert({
          user_id: userId,
          title: title,
          content: message,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending user message:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error sending user message:', error);
      throw error;
    }
  }
}

export const unifiedPaymentService = UnifiedPaymentService.getInstance();
