import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

interface RequestBody {
  user_id: string;
  plan: 'pro' | 'pro_plus';
}

const RZP_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RZP_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

// Centralized pricing configuration - SINGLE SOURCE OF TRUTH
// This should match the pricing in src/config/pricingConfig.ts
const PLAN_PRICES: Record<string, number> = {
  pro: 1, // Pro plan: 1 INR (test price)
  pro_plus: 2, // Pro+ plan: 2 INR (test price)
  premium: 1, // Premium plan: 1 INR (alias for pro)
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
    
    // Note: Supabase client not needed for this function as we only create Razorpay orders
    
    // Use centralized pricing configuration
    let amount = PLAN_PRICES[body.plan];
    console.log('Using centralized pricing for plan', body.plan, ':', amount);
    console.log('PLAN_PRICES:', PLAN_PRICES);
    
    // Final validation - ensure amount is valid
    if (!amount || amount <= 0) {
      console.warn('Invalid amount, using fallback price. Amount was:', amount);
      amount = PLAN_PRICES[body.plan];
    }
    
    console.log('Final amount for plan', body.plan, ':', amount);
    
    if (!amount) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid plan' }), { status: 400, headers: corsHeaders })
    }

    if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Function secrets.' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const receipt = `PAY_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    // Create Razorpay order via REST
    const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`)
    const razorpayAmount = amount * 100; // Convert to paise
    console.log('Creating Razorpay order with amount:', amount, 'paise:', razorpayAmount);
    
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: razorpayAmount,
        currency: 'INR',
        receipt,
        notes: { user_id: body.user_id, plan: body.plan },
      }),
    })
    
    if (!r.ok) {
      const t = await r.text()
      return new Response(JSON.stringify({ success: false, error: `Razorpay error: ${t}` }), { status: 500, headers: corsHeaders })
    }
    
    const order = await r.json()

    // Return minimal data; client will store payment via existing flow
    console.log('Order created successfully:', { order_id: order.id, amount, currency: 'INR' });
    return new Response(JSON.stringify({ success: true, order_id: order.id, amount, currency: 'INR', key_id: RZP_KEY_ID, receipt }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders })
  }
})