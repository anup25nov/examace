import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DebugRequest {
  order_id: string;
  payment_id: string;
  signature: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: DebugRequest = await req.json()
    console.log('=== DEBUG SIGNATURE VERIFICATION ===')
    console.log('Order ID:', body.order_id)
    console.log('Payment ID:', body.payment_id)
    console.log('Received Signature:', body.signature)
    
    // Get environment variables
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    
    console.log('Environment Variables:')
    console.log('RAZORPAY_KEY_SECRET present:', !!keySecret)
    console.log('RAZORPAY_KEY_SECRET length:', keySecret ? keySecret.length : 0)
    console.log('RAZORPAY_KEY_SECRET starts with:', keySecret ? keySecret.substring(0, 10) + '...' : 'N/A')
    console.log('RAZORPAY_WEBHOOK_SECRET present:', !!webhookSecret)
    console.log('RAZORPAY_KEY_ID present:', !!keyId)
    
    if (!keySecret || keySecret.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'RAZORPAY_KEY_SECRET not set',
          debug: {
            message: 'RAZORPAY_KEY_SECRET environment variable is not set in Supabase Edge Function secrets',
            order_id: body.order_id,
            payment_id: body.payment_id,
            signature: '[REDACTED]'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Test signature verification
    const encoder = new TextEncoder()
    const keyData = encoder.encode(keySecret)
    
    // Create HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Create signature - Razorpay uses order_id|payment_id format
    const data = encoder.encode(`${body.order_id}|${body.payment_id}`)
    const signature = await crypto.subtle.sign('HMAC', key, data)
    
    // Convert to hex
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    console.log('Signature Generation:')
    console.log('Data to sign:', `${body.order_id}|${body.payment_id}`)
    console.log('Expected signature:', expectedSignature)
    console.log('Received signature:', body.signature)
    console.log('Signatures match:', expectedSignature === body.signature)
    
    const isValid = expectedSignature === body.signature
    
    return new Response(
      JSON.stringify({
        success: isValid,
        error: isValid ? null : 'Invalid signature',
        debug: {
          order_id: body.order_id,
          payment_id: body.payment_id,
          data_to_sign: `${body.order_id}|${body.payment_id}`,
          expected_signature: expectedSignature,
          received_signature: body.signature,
          signatures_match: isValid,
          key_secret_present: !!keySecret,
          key_secret_length: keySecret ? keySecret.length : 0,
          key_secret_prefix: keySecret ? keySecret.substring(0, 10) + '...' : 'N/A'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Debug signature error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: {
          message: 'Error in debug signature verification',
          error: error.message,
          stack: error.stack
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
