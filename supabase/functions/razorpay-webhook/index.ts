// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global types
declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RazorpayWebhookEvent {
  event: string
  created_at: number
  contains: string[]
  payload: {
    payment: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        order_id: string
        method: string
        description: string
        created_at: number
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET not configured')
    }

    // Get request body
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    
    if (!signature) {
      throw new Error('Missing Razorpay signature')
    }

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(body, signature, webhookSecret)
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Parse webhook event
    const event: RazorpayWebhookEvent = JSON.parse(body)
    console.log('Received webhook event:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabaseClient, event)
        break
      
      case 'payment.failed':
        await handlePaymentFailed(supabaseClient, event)
        break
      
      case 'payment.authorized':
        await handlePaymentAuthorized(supabaseClient, event)
        break
      
      default:
        console.log('Unhandled event type:', event.event)
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify Razorpay webhook signature
 */
async function verifyWebhookSignature(
  body: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  try {
    // Create HMAC SHA256 hash
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(supabaseClient: any, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment captured:', payment.id)

    // Find the payment record
    const { data: paymentRecord, error: findError } = await supabaseClient
      .from('membership_transactions')
      .select('*')
      .eq('gateway_order_id', payment.order_id)
      .eq('status', 'pending')
      .single()

    if (findError || !paymentRecord) {
      console.error('Payment record not found:', findError)
      return
    }

    // Process payment and create membership
    const { data: result, error: processError } = await supabaseClient.rpc(
      'process_payment_and_membership',
      {
        p_payment_id: paymentRecord.id,
        p_payment_gateway_id: payment.id,
        p_user_id: paymentRecord.user_id,
        p_plan_id: paymentRecord.plan_id,
        p_amount: payment.amount / 100 // Convert from paise to rupees
      }
    )

    if (processError) {
      console.error('Error processing payment:', processError)
      return
    }

    console.log('Payment processed successfully:', result)

  } catch (error) {
    console.error('Error in handlePaymentCaptured:', error)
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(supabaseClient: any, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment failed:', payment.id)

    // Update payment status to failed
    const { error: updateError } = await supabaseClient
      .from('membership_transactions')
      .update({
        status: 'failed',
        gateway_payment_id: payment.id,
        failure_reason: 'Payment failed',
        updated_at: new Date().toISOString()
      })
      .eq('gateway_order_id', payment.order_id)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error updating failed payment:', updateError)
    } else {
      console.log('Payment marked as failed')
    }

  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(supabaseClient: any, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment authorized:', payment.id)

    // Update payment status to authorized
    const { error: updateError } = await supabaseClient
      .from('membership_transactions')
      .update({
        status: 'authorized',
        gateway_payment_id: payment.id,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_order_id', payment.order_id)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error updating authorized payment:', updateError)
    } else {
      console.log('Payment marked as authorized')
    }

  } catch (error) {
    console.error('Error in handlePaymentAuthorized:', error)
  }
}
