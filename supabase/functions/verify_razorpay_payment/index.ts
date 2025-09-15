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
    await supabase.from('payments').upsert({ user_id: body.user_id, plan: body.plan, razorpay_order_id: body.order_id, razorpay_payment_id: body.payment_id, razorpay_signature: body.signature, status: 'verified', paid_at: paidAt } as any, { onConflict: 'razorpay_payment_id' } as any);

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

      // Try to read referral commission config
      let commissionAmount = 0;
      try {
        const { data: cfg } = await supabase
          .from('referral_config' as any)
          .select('commission_percentage, commission_amount')
          .eq('plan_id', body.plan)
          .eq('is_active', true)
          .maybeSingle();
        const pct = (cfg as any)?.commission_percentage as number | null | undefined;
        const fixed = (cfg as any)?.commission_amount as number | null | undefined;
        commissionAmount = typeof fixed === 'number' ? fixed : Math.round((planAmount * ((pct ?? 10) / 100)) * 100) / 100;
      } catch {
        commissionAmount = Math.round((planAmount * 0.1) * 100) / 100; // default 10%
      }

      // Update referral transaction and fetch referrer
      const { data: tx } = await supabase
        .from('referral_transactions' as any)
        .update({
          membership_purchased: true,
          status: 'completed',
          commission_amount: commissionAmount,
          commission_status: 'pending',
          updated_at: upgradeAt
        } as any)
        .eq('referred_id', body.user_id)
        .eq('status', 'pending')
        .select('referrer_id')
        .maybeSingle();

      const referrerId = (tx as any)?.referrer_id as string | undefined;
      if (referrerId) {
        // Increment referrer's total earnings tally
        await supabase
          .from('referral_codes' as any)
          .update({
            total_earnings: (null as any), // placeholder to use RPC style update
          } as any)
          .eq('user_id', referrerId);
        // Fallback: run raw SQL via RPC if available is limited; otherwise, do a separate select+update
        try {
          const { data: rc } = await supabase
            .from('referral_codes' as any)
            .select('total_earnings')
            .eq('user_id', referrerId)
            .maybeSingle();
          const current = (rc as any)?.total_earnings ?? 0;
          await supabase
            .from('referral_codes' as any)
            .update({ total_earnings: Number(current) + Number(commissionAmount), updated_at: upgradeAt } as any)
            .eq('user_id', referrerId);
        } catch { /* ignore */ }
      }
    } catch (_) {}

    return new Response(JSON.stringify({ success: true, membership: activated }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});


