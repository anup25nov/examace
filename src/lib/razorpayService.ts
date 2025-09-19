// Razorpay Service - Server-side only
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Initialize Razorpay instance (server-side only)
const razorpay = isServer ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

export interface RazorpayOrderData {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayPaymentData {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  created_at: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayPaymentResponse {
  success: boolean;
  message?: string;
  payment_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export class RazorpayService {
  /**
   * Create a new Razorpay order
   */
  async createOrder(orderData: RazorpayOrderData): Promise<RazorpayOrderResponse> {
    if (!isServer || !razorpay) {
      throw new Error('Razorpay service is only available on the server side');
    }

    try {
      const order = await razorpay.orders.create({
        amount: orderData.amount,
        currency: orderData.currency,
        receipt: orderData.receipt,
        notes: orderData.notes || {}
      });

      return {
        id: order.id,
        amount: order.amount as number,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<boolean> {
    if (!isServer) {
      throw new Error('Payment verification is only available on the server side');
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Capture payment
   */
  async capturePayment(paymentId: string, amount: number, currency: string = 'INR'): Promise<any> {
    try {
      const payment = await razorpay.payments.capture(paymentId, amount * 100, currency);
      return payment;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw new Error('Failed to capture payment');
    }
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string): Promise<RazorpayPaymentData> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount as number,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        created_at: payment.created_at,
      };
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, notes?: string): Promise<any> {
    try {
      const refundData: any = {
        payment_id: paymentId,
      };

      if (amount) {
        refundData.amount = amount * 100; // Convert to paise
      }

      if (notes) {
        refundData.notes = { reason: notes };
      }

      const refund = await razorpay.payments.refund(paymentId, refundData);
      return refund;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new Error('Failed to refund payment');
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId: string): Promise<any> {
    try {
      const refund = await razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      console.error('Error fetching refund:', error);
      throw new Error('Failed to fetch refund details');
    }
  }

  /**
   * Get all payments for an order
   */
  async getOrderPayments(orderId: string): Promise<any[]> {
    try {
      const payments = await razorpay.orders.fetchPayments(orderId);
      return payments.items;
    } catch (error) {
      console.error('Error fetching order payments:', error);
      throw new Error('Failed to fetch order payments');
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData: {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const customer = await razorpay.customers.create(customerData);
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const customer = await razorpay.customers.fetch(customerId);
      return customer;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw new Error('Failed to fetch customer details');
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, updateData: any): Promise<any> {
    try {
      const customer = await razorpay.customers.edit(customerId, updateData);
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(options?: {
    count?: number;
    skip?: number;
  }): Promise<any> {
    try {
      const customers = await razorpay.customers.all(options);
      return customers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(subscriptionData: {
    plan_id: string;
    customer_id: string;
    total_count: number;
    start_at?: number;
    expire_by?: number;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.create(subscriptionData);
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      return subscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string, pauseAt: 'now' | 'cycle' = 'now'): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.pause(subscriptionId, {
        pause_at: pauseAt as 'now'
      });
      return subscription;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw new Error('Failed to pause subscription');
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.resume(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw new Error('Failed to resume subscription');
    }
  }

  /**
   * Get all subscriptions
   */
  async getSubscriptions(options?: {
    count?: number;
    skip?: number;
    plan_id?: string;
    customer_id?: string;
  }): Promise<any> {
    try {
      const subscriptions = await razorpay.subscriptions.all(options);
      return subscriptions;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  /**
   * Create a plan
   */
  async createPlan(planData: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const plan = await razorpay.plans.create(planData);
      return plan;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw new Error('Failed to create plan');
    }
  }

  /**
   * Get plan details
   */
  async getPlan(planId: string): Promise<any> {
    try {
      const plan = await razorpay.plans.fetch(planId);
      return plan;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw new Error('Failed to fetch plan details');
    }
  }

  /**
   * Get all plans
   */
  async getPlans(options?: {
    count?: number;
    skip?: number;
  }): Promise<any> {
    try {
      const plans = await razorpay.plans.all(options);
      return plans;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Failed to fetch plans');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify payment signature (for RazorpayPaymentService compatibility)
   */
  async verifyPaymentSignature(paymentData: RazorpayPaymentData): Promise<boolean> {
    if (!paymentData.razorpay_payment_id || !paymentData.razorpay_order_id || !paymentData.razorpay_signature) {
      return false;
    }
    return this.verifyPayment(
      paymentData.razorpay_payment_id,
      paymentData.razorpay_order_id,
      paymentData.razorpay_signature
    );
  }

  /**
   * Get payment details (for RazorpayPaymentService compatibility)
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    return this.getPayment(paymentId);
  }

  /**
   * Convert paise to rupees
   */
  paiseToRupees(paise: number): number {
    return paise / 100;
  }

  /**
   * Get Razorpay key ID
   */
  getKeyId(): string {
    if (isServer) {
      return process.env.RAZORPAY_KEY_ID;
    } else {
      const viteKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      const nextPublicKey = (import.meta as any).env?.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any)?.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      return viteKey || nextPublicKey;
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number): string {
    return `₹${amount}`;
  }

  /**
   * Get Razorpay instance (for advanced usage)
   */
  getInstance(): Razorpay {
    return razorpay;
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
export default razorpayService;