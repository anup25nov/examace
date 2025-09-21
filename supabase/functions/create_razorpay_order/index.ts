import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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

// Fallback prices if database is unavailable
const FALLBACK_PRICES: Record<string, number> = {
  pro: 99, // Pro plan: 99 INR
  pro_plus: 299, // Pro+ plan: 299 INR
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Try to get plan price from database first
    let amount: number;
    try {
      const { data: planData, error: planError } = await supabase
        .from('membership_plans')
        .select('price')
        .eq('id', body.plan)
        .eq('is_active', true)
        .single()
      
      if (planError || !planData) {
        console.warn('Failed to fetch plan from database, using fallback price:', planError)
        amount = FALLBACK_PRICES[body.plan];
      } else {
        amount = planData.price;
      }
    } catch (dbError) {
      console.warn('Database error, using fallback price:', dbError)
      amount = FALLBACK_PRICES[body.plan];
    }
    
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
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount * 100,
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
    return new Response(JSON.stringify({ success: true, order_id: order.id, amount, currency: 'INR', key_id: RZP_KEY_ID, receipt }), { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders })
  }
})