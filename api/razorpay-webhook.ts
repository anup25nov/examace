// Razorpay Webhook Handler - Complete Integration
import { supabase } from '../src/integrations/supabase/client';
import { paymentService } from '../src/lib/paymentService';
import { razorpayService } from '../src/lib/razorpayService';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    if (webhookSecret && signature) {
      const isValidSignature = razorpayService.verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        webhookSecret
      );

      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const event = body;
    console.log('Webhook event received:', event.event, event.id);

    // Log webhook event to database (skip if table doesn't exist)
    try {
      await supabase
        .from('webhook_events' as any)
        .insert({
          event_id: event.id,
          event_type: event.event,
          payment_id: event.payload?.payment?.entity?.id,
          order_id: event.payload?.payment?.entity?.order_id,
          raw_data: event
        } as any);
    } catch (logError) {
      console.error('Error logging webhook event:', logError);
      // Don't fail the webhook for logging errors
    }

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    // Mark webhook as processed (skip if table doesn't exist)
    try {
      await supabase
        .from('webhook_events' as any)
        .update({ processed: true } as any)
        .eq('event_id', event.id);
    } catch (updateError) {
      console.error('Error marking webhook as processed:', updateError);
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(event: any) {
  try {
    const payment = event.payload.payment.entity;
    console.log('Payment captured:', payment.id);

    // Find payment record by order ID
    const paymentRecord = await paymentService.getPaymentByOrderId(payment.order_id);
    
    if (!paymentRecord) {
      console.error('Payment record not found for order:', payment.order_id);
      return;
    }

    // Verify payment
    const verifyResponse = await paymentService.verifyPayment({
      paymentId: paymentRecord.id,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      razorpaySignature: payment.signature
    });

    if (!verifyResponse.success) {
      console.error('Payment verification failed:', verifyResponse.error);
      return;
    }

    // Activate membership
    const membershipActivated = await paymentService.activateMembership(
      paymentRecord.user_id,
      paymentRecord.plan_id
    );

    if (!membershipActivated) {
      console.error('Membership activation failed for user:', paymentRecord.user_id);
    } else {
      console.log('Membership activated successfully for user:', paymentRecord.user_id);
    }

  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(event: any) {
  try {
    const payment = event.payload.payment.entity;
    console.log('Payment failed:', payment.id);

    // Find payment record by order ID
    const paymentRecord = await paymentService.getPaymentByOrderId(payment.order_id);
    
    if (!paymentRecord) {
      console.error('Payment record not found for order:', payment.order_id);
      return;
    }

    // Update payment status to failed
    const statusUpdated = await paymentService.updatePaymentStatus(
      paymentRecord.id,
      'failed',
      payment.error_description || 'Payment failed'
    );

    if (!statusUpdated) {
      console.error('Failed to update payment status to failed');
    }

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle order paid event
 */
async function handleOrderPaid(event: any) {
  try {
    const order = event.payload.order.entity;
    console.log('Order paid:', order.id);

    // Find payment record by order ID
    const paymentRecord = await paymentService.getPaymentByOrderId(order.id);
    
    if (!paymentRecord) {
      console.error('Payment record not found for order:', order.id);
      return;
    }

    // Update payment status to paid
    const statusUpdated = await paymentService.updatePaymentStatus(
      paymentRecord.id,
      'paid'
    );

    if (!statusUpdated) {
      console.error('Failed to update payment status to paid');
    }

  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(event: any) {
  try {
    const payment = event.payload.payment.entity;
    console.log('Payment authorized:', payment.id);

    // Find payment record by order ID
    const paymentRecord = await paymentService.getPaymentByOrderId(payment.order_id);
    
    if (!paymentRecord) {
      console.error('Payment record not found for order:', payment.order_id);
      return;
    }

    // For authorized payments, we might want to capture them
    // This depends on your business logic
    console.log('Payment authorized, ready for capture if needed');

  } catch (error) {
    console.error('Error handling payment authorized:', error);
  }
}

/**
 * Handle webhook retry logic
 */
async function handleWebhookRetry(eventId: string) {
  try {
    // Get webhook event
    const { data: webhookEvent, error } = await supabase
      .from('webhook_events' as any)
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error || !webhookEvent) {
      console.error('Webhook event not found for retry:', eventId);
      return;
    }

    // Process the event again
    const event = (webhookEvent as any).raw_data;
    
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      case 'order.paid':
        await handleOrderPaid(event);
        break;
      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;
    }

    // Mark as processed
    await supabase
      .from('webhook_events' as any)
      .update({ processed: true } as any)
      .eq('event_id', eventId);

  } catch (error) {
    console.error('Error retrying webhook:', error);
  }
}

/**
 * Get webhook event status
 */
export async function getWebhookStatus(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('webhook_events' as any)
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, event: data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * List webhook events
 */
export async function listWebhookEvents(options?: {
  limit?: number;
  offset?: number;
  eventType?: string;
  processed?: boolean;
}) {
  try {
    let query = supabase
      .from('webhook_events' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options?.processed !== undefined) {
      query = query.eq('processed', options.processed);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, events: data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
