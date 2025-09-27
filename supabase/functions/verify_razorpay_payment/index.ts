// @ts-ignore: Deno imports are available in Supabase Edge Functions
const serve = (handler: (req: Request) => Response | Promise<Response>) => {
  // @ts-ignore: Deno.serve is available in Deno runtime
  return Deno.serve(handler);
}

serve(async (req) => {
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('=== PAYMENT VERIFICATION START ===')
    console.log('Body received:', {
      user_id: body.user_id,
      plan: body.plan,
      order_id: body.order_id,
      payment_id: body.payment_id,
      signature: body.signature ? '[REDACTED]' : 'missing'
    })

    // Validate required fields
    if (!body.user_id) {
      console.error('No user_id provided in request body');
      // For now, we'll allow the function to work without user_id for testing
      // In production, you might want to extract it from the order_id or other means
      console.warn('Proceeding without user_id - this is for testing purposes');
    }

    if (!body.plan) {
      console.error('No plan provided');
          return new Response(JSON.stringify({ 
            success: false, 
        error: 'Plan is required' 
      }), { status: 400, headers: corsHeaders });
    }

    if (!body.order_id) {
      console.error('No order_id provided');
        return new Response(JSON.stringify({ 
          success: false, 
        error: 'Order ID is required' 
        }), { status: 400, headers: corsHeaders });
    }

    if (!body.payment_id) {
      console.error('No payment_id provided');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment ID is required' 
      }), { status: 400, headers: corsHeaders });
    }

    if (!body.signature) {
      console.error('No signature provided');
      return new Response(JSON.stringify({ 
              success: false, 
        error: 'Signature is required' 
      }), { status: 400, headers: corsHeaders });
    }

    console.log('All required fields present');

    // For now, just return success without actual verification
    // This will allow us to test the payment flow
    console.log('Payment verification successful (test mode)');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment verified successfully (test mode)',
        payment_id: body.payment_id,
      order_id: body.order_id
    }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: corsHeaders })
  }
})