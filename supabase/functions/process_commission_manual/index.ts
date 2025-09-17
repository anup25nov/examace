/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = (globalThis as any).Deno?.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ProcessCommissionBody {
  user_id: string;
}

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  
  try {
    const body = await req.json() as ProcessCommissionBody;
    const { user_id } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ success: false, error: 'user_id is required' }), { status: 400, headers: corsHeaders });
    }

    console.log('Processing commission for user:', user_id);

    // Get the latest payment for this user
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .select('id, plan, amount')
      .eq('user_id', user_id)
      .in('status', ['verified', 'paid', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.error('Error fetching payment:', paymentError);
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch payment data' }), { status: 500, headers: corsHeaders });
    }

    if (!paymentData || paymentData.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No verified payment found for user' }), { status: 404, headers: corsHeaders });
    }

    const payment = paymentData[0];
    console.log('Found payment:', payment);

    // Process commission using the function
    const { data: commissionResult, error: commissionError } = await supabase
      .rpc('process_membership_commission', {
        p_user_id: user_id,
        p_payment_id: payment.id,
        p_membership_plan: payment.plan,
        p_membership_amount: payment.amount
      });

    if (commissionError) {
      console.error('Commission processing error:', commissionError);
      return new Response(JSON.stringify({ success: false, error: commissionError.message }), { status: 500, headers: corsHeaders });
    }

    console.log('Commission processing result:', commissionResult);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Commission processed successfully',
      result: commissionResult?.[0] || null
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing commission:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { status: 500, headers: corsHeaders });
  }
});
