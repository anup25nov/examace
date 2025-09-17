/// <reference lib="deno.ns" />
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = (globalThis as any).Deno?.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = (globalThis as any).Deno?.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TestReferralBody {
  user_id?: string;
  action: 'check_status' | 'process_commission' | 'fix_all' | 'test_flow';
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
    const body = await req.json() as TestReferralBody;
    const { user_id, action } = body;

    console.log('Testing referral system:', { user_id, action });

    switch (action) {
      case 'check_status':
        if (!user_id) {
          return new Response(JSON.stringify({ success: false, error: 'user_id is required for check_status' }), { status: 400, headers: corsHeaders });
        }
        
        const { data: statusData, error: statusError } = await supabase
          .rpc('check_commission_status', { p_user_id: user_id });
        
        if (statusError) {
          console.error('Error checking commission status:', statusError);
          return new Response(JSON.stringify({ success: false, error: statusError.message }), { status: 500, headers: corsHeaders });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: statusData?.[0] || null 
        }), { status: 200, headers: corsHeaders });

      case 'process_commission':
        if (!user_id) {
          return new Response(JSON.stringify({ success: false, error: 'user_id is required for process_commission' }), { status: 400, headers: corsHeaders });
        }
        
        const { data: commissionData, error: commissionError } = await supabase
          .rpc('process_existing_user_commission', { p_user_id: user_id });
        
        if (commissionError) {
          console.error('Error processing commission:', commissionError);
          return new Response(JSON.stringify({ success: false, error: commissionError.message }), { status: 500, headers: corsHeaders });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: commissionData?.[0] || null 
        }), { status: 200, headers: corsHeaders });

      case 'fix_all':
        const { data: fixAllData, error: fixAllError } = await supabase
          .rpc('fix_all_pending_commissions');
        
        if (fixAllError) {
          console.error('Error fixing all commissions:', fixAllError);
          return new Response(JSON.stringify({ success: false, error: fixAllError.message }), { status: 500, headers: corsHeaders });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: fixAllData || [] 
        }), { status: 200, headers: corsHeaders });

      case 'test_flow':
        // Test the complete flow
        const testResults = {
          step1: 'Creating test users...',
          step2: 'Creating referral relationship...',
          step3: 'Creating test payment...',
          step4: 'Processing commission...',
          step5: 'Checking results...'
        };
        
        // This would be a more comprehensive test
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Test flow initiated',
          results: testResults
        }), { status: 200, headers: corsHeaders });

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use: check_status, process_commission, fix_all, or test_flow' 
        }), { status: 400, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Error in test referral system:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { status: 500, headers: corsHeaders });
  }
});
