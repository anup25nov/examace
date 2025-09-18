/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RZP_KEY_SECRET = (globalThis as any).Deno?.env.get('RAZORPAY_KEY_SECRET') || '';
const SUPABASE_URL = (globalThis as any).Deno?.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface VerifyBody {
  user_id: string;
  plan: 'pro' | 'pro_plus';
  order_id: string;
  payment_id: string;
  signature: string;
  referral_code?: string;
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
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
    const body = await req.json() as VerifyBody;
    const expected = await hmacSha256Hex(`${body.order_id}|${body.payment_id}`, RZP_KEY_SECRET);
    if (expected !== body.signature) {
      // store failed attempt
      await supabase.from('payments').insert({ user_id: body.user_id, plan: body.plan, razorpay_order_id: body.order_id, razorpay_payment_id: body.payment_id, razorpay_signature: body.signature, status: 'failed', failed_reason: 'signature_mismatch' } as any);
      return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
    }

    // mark payment completed (upsert minimal row)
    const paidAt = new Date().toISOString();
    console.log('=== PAYMENT VERIFICATION START ===');
    console.log('Payment data:', { user_id: body.user_id, plan: body.plan, order_id: body.order_id, payment_id: body.payment_id });
    
    // Determine plan amount
    const planAmount = body.plan === 'pro_plus'
      ? Number(((globalThis as any).Deno?.env.get('PLAN_PRO_PLUS_PRICE')) || 2)
      : Number(((globalThis as any).Deno?.env.get('PLAN_PRO_PRICE')) || 1);
    
    const { data: paymentUpsert, error: paymentUpsertError } = await supabase
      .from('payments')
      .upsert({ 
        user_id: body.user_id, 
        plan: body.plan, 
        amount: planAmount,
        razorpay_order_id: body.order_id, 
        razorpay_payment_id: body.payment_id, 
        razorpay_signature: body.signature, 
        status: 'completed', 
        paid_at: paidAt 
      } as any, { 
        onConflict: 'razorpay_payment_id' 
      } as any)
      .select('id');
    
    console.log('Payment upsert result:', { paymentUpsert, paymentUpsertError });
    
    if (paymentUpsertError) {
      console.error('Error upserting payment:', paymentUpsertError);
    }

    // Get the payment ID for commission processing
    const paymentId = paymentUpsert?.[0]?.id;
    if (!paymentId) {
      console.error('No payment ID found for commission processing');
    }

    // activate or upgrade membership
    const upgradeAt = new Date().toISOString();
    const { data: act, error: actErr } = await supabase.rpc('activate_or_upgrade_membership', { p_user: body.user_id, p_plan: body.plan, p_upgrade_at: upgradeAt } as any);
    if (actErr) {
      return new Response(JSON.stringify({ success: false, error: actErr.message }), { status: 500, headers: corsHeaders });
    }
    const activated = Array.isArray(act) && act.length > 0 ? act[0] : null;
    // update profile snapshot (best-effort)
    try {
      if (activated) {
        await supabase.from('user_profiles' as any).update({
          membership_plan: activated.plan,
          membership_expiry: activated.end_date,
          membership_status: 'active',
          updated_at: upgradeAt
        } as any).eq('id', body.user_id);
      }
    } catch (_) {}

    // Process referral commission if referral code was provided
    console.log('=== COMMISSION PROCESSING ===');
    if (body.referral_code) {
      console.log('Processing referral commission for code:', body.referral_code);
      
      // First, try to create the referral relationship if it doesn't exist
      const { data: referralResult, error: referralError } = await supabase
        .rpc('apply_referral_code', {
          p_user_id: body.user_id,
          p_referral_code: body.referral_code
        });

      if (referralError) {
        console.error('Error applying referral code:', referralError);
      } else {
        console.log('Referral code applied:', referralResult);
      }

      // Process commission for the membership purchase (regardless of referral code application result)
      console.log('Processing commission for user:', body.user_id);
      const { data: commissionResult, error: commissionError } = await supabase
        .rpc('process_referral_commission', {
          p_membership_amount: planAmount,
          p_membership_plan: body.plan,
          p_payment_id: paymentId,
          p_user_id: body.user_id
        });

      if (commissionError) {
        console.error('Error processing commission:', commissionError);
      } else {
        console.log('Commission processed:', commissionResult);
      }
    } else {
      console.log('No referral code provided, skipping commission processing');
    }

    return new Response(JSON.stringify({ success: true, membership: activated }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});


