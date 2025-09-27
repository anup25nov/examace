// @ts-ignore: Deno import is available in Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature, x-razorpay-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        created_at: number;
      };
    };
  };
}

interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  payload?: WebhookPayload;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Get webhook payload
    const payload = await req.text();
    
    if (!payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Empty payload' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get headers
    const headers: Record<string, string> = {};
    for (const [key, value] of req.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    // Validate webhook
    const validation = await validateWebhook(payload, headers, clientIP);
    
    if (!validation.isValid) {
      console.error('❌ Webhook validation failed:', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Webhook validation successful');

    // Process webhook based on event type
    const result = await processWebhook(validation.payload!);
    
    if (!result.success) {
      console.error('❌ Webhook processing failed:', result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Webhook processed successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('💥 Webhook handler error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Validate webhook signature and payload
 */
async function validateWebhook(
  payload: string,
  headers: Record<string, string>,
  clientIP: string
): Promise<WebhookValidationResult> {
  try {
    // Check required headers
    const signature = headers['x-razorpay-signature'];
    const timestamp = headers['x-razorpay-timestamp'];
    
    if (!signature || !timestamp) {
      return {
        isValid: false,
        error: 'Missing required webhook headers'
      };
    }

    // Check timestamp freshness (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const webhookTime = parseInt(timestamp);
    
    if (currentTime - webhookTime > 300) {
      return {
        isValid: false,
        error: 'Webhook timestamp is too old'
      };
    }

    // Verify signature
    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return {
        isValid: false,
        error: 'Webhook secret not configured'
      };
    }

    const expectedSignature = await generateRazorpaySignature(payload, timestamp, webhookSecret);
    
    if (!secureCompare(signature, expectedSignature)) {
      return {
        isValid: false,
        error: 'Invalid webhook signature'
      };
    }

    // Parse and validate payload
    let parsedPayload: WebhookPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid JSON payload'
      };
    }

    // Validate required fields
    if (!parsedPayload.event || !parsedPayload.payload) {
      return {
        isValid: false,
        error: 'Missing required webhook fields'
      };
    }

    return {
      isValid: true,
      payload: parsedPayload
    };

  } catch (error: any) {
    console.error('Webhook validation error:', error);
    return {
      isValid: false,
      error: 'Webhook validation failed'
    };
  }
}

/**
 * Generate Razorpay webhook signature
 */
async function generateRazorpaySignature(
  payload: string,
  timestamp: string,
  secret: string
): Promise<string> {
  const message = `${timestamp}|${payload}`;
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Process webhook based on event type
 */
async function processWebhook(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const { event, payload: webhookData } = payload;
    
    console.log(`🔄 Processing webhook event: ${event}`);

    switch (event) {
      case 'payment.captured':
        return await handlePaymentCaptured(webhookData);
      
      case 'payment.failed':
        return await handlePaymentFailed(webhookData);
      
      case 'payment.authorized':
        return await handlePaymentAuthorized(webhookData);
      
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
        return { success: true };
    }

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return { success: false, error: 'Failed to process webhook' };
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(webhookData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = webhookData.payment?.entity;
    if (!payment) {
      return { success: false, error: 'Invalid payment data' };
    }

    console.log(`💰 Payment captured: ${payment.id} for order: ${payment.order_id}`);

    // Update payment status in database
    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    const { error: updateError } = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/membership_transactions`, {
      method: 'PATCH',
      headers: {
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gateway_response: {
          payment_id: payment.id,
          status: 'completed',
          captured_at: new Date().toISOString(),
          amount: payment.amount,
          currency: payment.currency
        }
      })
    });

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return { success: false, error: 'Failed to update payment status' };
    }

    // Create or update membership
    // This would depend on your specific membership logic
    console.log('✅ Payment captured and processed successfully');
    return { success: true };

  } catch (error: any) {
    console.error('Error handling payment captured:', error);
    return { success: false, error: 'Failed to handle payment captured' };
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(webhookData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = webhookData.payment?.entity;
    if (!payment) {
      return { success: false, error: 'Invalid payment data' };
    }

    console.log(`❌ Payment failed: ${payment.id} for order: ${payment.order_id}`);

    // Log payment failure
    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/payment_failures`, {
      method: 'POST',
      headers: {
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: 'unknown', // Would need to get from order_id lookup
        order_id: payment.order_id,
        failure_reason: 'PAYMENT_FAILED',
        retry_count: 0,
        max_retries: 3,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    console.log('✅ Payment failure logged successfully');
    return { success: true };

  } catch (error: any) {
    console.error('Error handling payment failed:', error);
    return { success: false, error: 'Failed to handle payment failed' };
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(webhookData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payment = webhookData.payment?.entity;
    if (!payment) {
      return { success: false, error: 'Invalid payment data' };
    }

    console.log(`🔐 Payment authorized: ${payment.id} for order: ${payment.order_id}`);
    
    // Payment is authorized but not yet captured
    // You might want to update the status to 'authorized'
    
    return { success: true };

  } catch (error: any) {
    console.error('Error handling payment authorized:', error);
    return { success: false, error: 'Failed to handle payment authorized' };
  }
}
