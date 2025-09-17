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

    // mark payment verified (upsert minimal row)
    const paidAt = new Date().toISOString();
    const { data: paymentUpsert, error: paymentUpsertError } = await supabase.from('payments').upsert({ user_id: body.user_id, plan: body.plan, razorpay_order_id: body.order_id, razorpay_payment_id: body.payment_id, razorpay_signature: body.signature, status: 'verified', paid_at: paidAt } as any, { onConflict: 'razorpay_payment_id' } as any).select('id');
    
    if (paymentUpsertError) {
      console.error('Error upserting payment:', paymentUpsertError);
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

    // mark referral transaction as completed if present (best-effort) and compute commission
    try {
      // Determine plan amount
      const planAmount = body.plan === 'pro_plus'
        ? Number(((globalThis as any).Deno?.env.get('PLAN_PRO_PLUS_PRICE')) || 2)
        : Number(((globalThis as any).Deno?.env.get('PLAN_PRO_PRICE')) || 1);

      console.log('=== COMMISSION PROCESSING START ===');
      console.log('User ID:', body.user_id);
      console.log('Plan:', body.plan);
      console.log('Plan Amount:', planAmount);

      // Use the payment ID from the upsert if available
      let paymentId = null;
      if (paymentUpsert && paymentUpsert.length > 0) {
        paymentId = paymentUpsert[0].id;
        console.log('Using payment ID from upsert:', paymentId);
      } else {
        console.log('Payment upsert data:', paymentUpsert);
        // Fallback: try to get payment record by razorpay_payment_id
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('payments')
          .select('id')
          .eq('razorpay_payment_id', body.payment_id)
          .single();
        
        console.log('Fallback payment lookup:', { paymentRecord, paymentError });
        
        if (paymentRecord && !paymentError) {
          paymentId = paymentRecord.id;
          console.log('Using payment ID from fallback:', paymentId);
        }
      }

      if (paymentId) {
        console.log('Processing commission for user:', body.user_id, 'payment ID:', paymentId, 'plan:', body.plan, 'amount:', planAmount);
        
        // Process referral commission using the proper function
        const { data: commissionResult, error: commissionError } = await supabase.rpc('process_membership_commission' as any, {
          p_user_id: body.user_id,
          p_payment_id: paymentId,
          p_membership_plan: body.plan,
          p_membership_amount: planAmount
        });

        console.log('Commission processing result:', { commissionResult, commissionError });

        if (commissionError) {
          console.error('Commission processing error:', commissionError);
        } else if (commissionResult && commissionResult.length > 0) {
          console.log('Commission processed successfully:', commissionResult[0]);
        } else {
          console.log('No commission result returned');
        }
      } else {
        console.error('Payment ID not found for commission processing');
        console.log('Payment upsert result:', paymentUpsert);
        console.log('Payment upsert error:', paymentUpsertError);
      }
      
      console.log('=== COMMISSION PROCESSING END ===');
    } catch (error) {
      console.error('Commission processing error:', error);
    }

    return new Response(JSON.stringify({ success: true, membership: activated }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});


