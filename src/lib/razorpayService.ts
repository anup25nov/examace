import { membershipService } from './membershipService';
import { referralService } from './referralServiceSimple';

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

class RazorpayService {
  private readonly RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890';
  private readonly CURRENCY = 'INR';

  // Load Razorpay script
  private async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Create Razorpay order
  private async createRazorpayOrder(amount: number, planId: string): Promise<{ orderId: string; error?: string }> {
    try {
      // In a real implementation, you would call your backend API to create the order
      // For now, we'll simulate this with a mock order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { orderId };
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      return { orderId: '', error: error.message };
    }
  }

  // Verify payment signature
  private async verifyPaymentSignature(paymentData: RazorpayResponse): Promise<boolean> {
    try {
      // In a real implementation, you would call your backend API to verify the signature
      // For now, we'll simulate successful verification
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  // Process payment with Razorpay
  async processPayment(
    planId: string,
    amount: number,
    userEmail: string,
    userName?: string,
    userPhone?: string
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Load Razorpay script
      const scriptLoaded = await this.loadRazorpayScript();
      if (!scriptLoaded) {
        return { success: false, error: 'Failed to load payment gateway' };
      }

      // Create order
      const orderResult = await this.createRazorpayOrder(amount, planId);
      if (orderResult.error) {
        return { success: false, error: orderResult.error };
      }

      // Get user info
      const user = {
        name: userName || 'User',
        email: userEmail,
        contact: userPhone || ''
      };

      // Razorpay options
      const options: RazorpayOptions = {
        key: this.RAZORPAY_KEY_ID,
        amount: amount * 100, // Convert to paise
        currency: this.CURRENCY,
        name: 'ExamAce',
        description: `ExamAce ${planId} Plan`,
        order_id: orderResult.orderId,
        prefill: user,
        notes: {
          plan_id: planId,
          user_email: userEmail
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment signature
            const isValid = await this.verifyPaymentSignature(response);
            if (!isValid) {
              throw new Error('Payment verification failed');
            }

            // Get current user ID
            const userId = localStorage.getItem('userId');
            if (!userId) {
              throw new Error('User not authenticated');
            }

            // Record payment
            const paymentResult = await membershipService.recordPayment(
              userId,
              planId,
              amount,
              response.razorpay_payment_id,
              'card'
            );

            if (!paymentResult.success) {
              throw new Error(paymentResult.error || 'Failed to record payment');
            }

            // Create membership
            const membershipResult = await membershipService.createMembership(
              userId,
              planId,
              response.razorpay_payment_id
            );

            if (!membershipResult.success) {
              throw new Error(membershipResult.error || 'Failed to create membership');
            }

            // Process referral if applicable
            await referralService.applyPendingReferralCode(userId, amount, response.razorpay_payment_id);

            // Success callback
            if (this.onPaymentSuccess) {
              this.onPaymentSuccess(response.razorpay_payment_id);
            }

          } catch (error: any) {
            console.error('Payment processing error:', error);
            if (this.onPaymentError) {
              this.onPaymentError(error.message);
            }
          }
        },
        modal: {
          ondismiss: () => {
            if (this.onPaymentDismiss) {
              this.onPaymentDismiss();
            }
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return { success: true };

    } catch (error: any) {
      console.error('Error processing payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Payment callbacks
  public onPaymentSuccess?: (paymentId: string) => void;
  public onPaymentError?: (error: string) => void;
  public onPaymentDismiss?: () => void;

  // Set payment callbacks
  setCallbacks(callbacks: {
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
    onDismiss?: () => void;
  }) {
    this.onPaymentSuccess = callbacks.onSuccess;
    this.onPaymentError = callbacks.onError;
    this.onPaymentDismiss = callbacks.onDismiss;
  }

  // Get payment methods
  getPaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Card Payment',
        description: 'Credit/Debit card payment',
        icon: '💳',
        enabled: true
      },
      {
        id: 'upi',
        name: 'UPI Payment',
        description: 'Pay using UPI apps',
        icon: '📱',
        enabled: true
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'Online banking payment',
        icon: '🏦',
        enabled: true
      },
      {
        id: 'wallet',
        name: 'Wallet',
        description: 'Paytm, PhonePe, etc.',
        icon: '👛',
        enabled: true
      }
    ];
  }

  // Validate payment amount
  validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < 1) {
      return { valid: false, error: 'Amount must be at least ₹1' };
    }
    if (amount > 100000) {
      return { valid: false, error: 'Amount cannot exceed ₹1,00,000' };
    }
    return { valid: true };
  }

  // Get supported currencies
  getSupportedCurrencies() {
    return ['INR'];
  }

  // Check if Razorpay is available
  isAvailable(): boolean {
    return !!window.Razorpay;
  }
}

export const razorpayService = new RazorpayService();
