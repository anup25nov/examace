// Razorpay Client Service - For frontend use
// This service handles client-side Razorpay operations

export interface RazorpayClientOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    backdrop_color?: string;
    backdrop_opacity?: number;
  };
  modal?: {
    ondismiss?: () => void;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  timeout?: number;
  remember_customer?: boolean;
}

export class RazorpayClientService {
  /**
   * Get Razorpay key ID for client-side use
   */
  getKeyId(): string {
    return import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RFxIToeCLybhiA';
  }

  /**
   * Load Razorpay script dynamically
   */
  async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Open Razorpay checkout
   */
  async openCheckout(options: RazorpayClientOptions): Promise<void> {
    // Load Razorpay script first
    const scriptLoaded = await this.loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Check if Razorpay is available
    if (typeof (window as any).Razorpay === 'undefined') {
      throw new Error('Razorpay is not loaded');
    }

    // Create Razorpay instance
    const rzp = new (window as any).Razorpay(options);
    
    // Open checkout
    rzp.open();
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `₹${amount}`;
  }

  /**
   * Convert paise to rupees
   */
  paiseToRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Convert rupees to paise
   */
  rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  /**
   * Validate payment response
   */
  validatePaymentResponse(response: any): boolean {
    return !!(
      response &&
      response.razorpay_payment_id &&
      response.razorpay_order_id &&
      response.razorpay_signature
    );
  }

  /**
   * Create default options for Razorpay checkout
   */
  createDefaultOptions(
    orderId: string,
    amount: number,
    currency: string,
    name: string,
    description: string,
    handler: (response: any) => void,
    prefill?: { name?: string; email?: string; contact?: string }
  ): RazorpayClientOptions {
    return {
      key: this.getKeyId(),
      amount: this.rupeesToPaise(amount),
      currency: currency || 'INR',
      name: name || 'ExamAce',
      description: description,
      order_id: orderId,
      image: '/logo.png',
      handler: handler,
      prefill: prefill || {},
      theme: {
        color: '#2563eb',
        backdrop_color: '#000000',
        backdrop_opacity: 0.5
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        }
      },
      retry: {
        enabled: true,
        max_count: 3
      },
      timeout: 900, // 15 minutes
      remember_customer: true
    };
  }
}

// Export singleton instance
export const razorpayClientService = new RazorpayClientService();
export default razorpayClientService;
