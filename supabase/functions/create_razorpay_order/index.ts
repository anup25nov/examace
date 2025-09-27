// @ts-ignore - Deno global is available in Supabase Edge Functions
const serve = (handler: (req: Request) => Response | Promise<Response>) => {
  // @ts-ignore: Deno.serve is available in Deno runtime
  return Deno.serve(handler);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

interface RequestBody {
  user_id: string;
  plan: 'pro' | 'pro_plus' | 'premium';
}

const RZP_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

// Centralized pricing configuration - SINGLE SOURCE OF TRUTH
// This should match the pricing in src/config/pricingConfig.ts
const PLAN_PRICES: Record<string, number> = {
  pro: 999, // Pro plan: ₹999 (production price)
  pro_plus: 1999, // Pro+ plan: ₹1999 (production price)
  premium: 999, // Premium plan: ₹999 (alias for pro)
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    
    // Validate required fields
    if (!body.user_id || !body.plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: user_id and plan are required' }), 
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate plan type
    if (!(body.plan in PLAN_PRICES)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid plan. Supported plans: ${Object.keys(PLAN_PRICES).join(', ')}` }), 
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Get amount from centralized pricing configuration
    const amount = PLAN_PRICES[body.plan];
    console.log('Using centralized pricing for plan', body.plan, ':', amount);
    
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid pricing configuration' }), 
        { status: 500, headers: corsHeaders }
      )
    }

    // Validate Razorpay credentials
    if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Function secrets.' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Validate API key format (Razorpay key IDs typically start with 'rzp_')
    if (!RZP_KEY_ID.startsWith('rzp_')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Razorpay key ID format' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Generate unique receipt ID
    const receipt = `PAY_${body.user_id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Create Razorpay order via REST
    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
    const razorpayAmount = amount * 100; // Convert to paise
    console.log('Creating Razorpay order with amount:', amount, 'paise:', razorpayAmount);
    
    // Create Razorpay order
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 
        'Authorization': `Basic ${auth}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        amount: razorpayAmount,
        currency: 'INR',
        receipt,
        notes: { 
          user_id: body.user_id, 
          plan: body.plan,
          created_at: new Date().toISOString()
        },
      }),
    })
    
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error('Razorpay API error:', orderResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Razorpay API error: ${orderResponse.status} - ${errorText}` 
        }), 
        { status: 500, headers: corsHeaders }
      )
    }
    
    const order = await orderResponse.json()

    // Validate order response
    if (!order.id) {
      console.error('Invalid order response:', order)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid order response from Razorpay' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // Return order details
    console.log('Order created successfully:', { 
      order_id: order.id, 
      amount, 
      currency: 'INR',
      receipt,
      user_id: body.user_id,
      plan: body.plan
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id, 
        amount, 
        currency: 'INR', 
        key_id: RZP_KEY_ID, 
        receipt,
        plan: body.plan
      }), 
      { status: 200, headers: corsHeaders }
    )
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders })
  }
})