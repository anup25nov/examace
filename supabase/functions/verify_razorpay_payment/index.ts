import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Centralized pricing configuration - SINGLE SOURCE OF TRUTH
const PLAN_PRICES: Record<string, number> = {
  pro: 999, // Pro plan: ₹999 (production price)
  pro_plus: 1999, // Pro+ plan: ₹1999 (production price)
  premium: 999, // Premium plan: ₹999 (alias for pro)
};

/**
 * Initiate refund for failed payments
 */
async function initiateRefund(paymentId: string, amount: number, reason: string): Promise<void> {
  try {
    console.log('🔄 Initiating refund for payment:', paymentId, 'Amount:', amount, 'Reason:', reason);
    
    // Get Razorpay credentials
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!keyId || !keySecret) {
      console.error('❌ Razorpay credentials not found for refund');
      return;
    }
    
    // Create refund request
    const refundData = {
      payment_id: paymentId,
      amount: Math.round(amount * 100), // Convert to paise
      notes: {
        reason: reason,
        refund_initiated_by: 'examace_system'
      }
    };
    
    // Make refund API call
    const response = await fetch('https://api.razorpay.com/v1/payments/' + paymentId + '/refund', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(keyId + ':' + keySecret),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refundData)
    });
    
    if (response.ok) {
      const refundResult = await response.json();
      console.log('✅ Refund initiated successfully:', refundResult.id);
    } else {
      const errorText = await response.text();
      console.error('❌ Refund failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error initiating refund:', error);
  }
}

// Helper function to get plan price
const getPlanPrice = (planId: string): number => {
  return PLAN_PRICES[planId] || 0;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyBody {
  user_id: string;
  plan: string;
  order_id: string;
  payment_id: string;
  signature: string;
  referral_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: VerifyBody = await req.json()
    console.log('=== PAYMENT VERIFICATION START ===')
    // Log without sensitive data
    console.log('Body received:', {
      user_id: body.user_id,
      plan: body.plan,
      order_id: body.order_id,
      payment_id: body.payment_id,
      signature: body.signature ? '[REDACTED]' : 'missing'
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify Razorpay signature
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    
    console.log('Environment check:')
    console.log('RAZORPAY_KEY_SECRET present:', !!keySecret)
    console.log('RAZORPAY_WEBHOOK_SECRET present:', !!webhookSecret)
    
    // For development/testing, allow skipping signature verification
    const isTestMode = Deno.env.get('NODE_ENV') === 'development' || Deno.env.get('RAZORPAY_TEST_MODE') === 'true'
    
    if (!keySecret || keySecret.length === 0) {
      console.log('⚠️ RAZORPAY_KEY_SECRET not set, skipping signature verification for testing')
      console.log('⚠️ This should NOT happen in production!')
    } else if (isTestMode && body.signature === 'test_signature') {
      console.log('🧪 Test mode: Skipping signature verification for test signature')
    } else {
      // Use only RAZORPAY_KEY_SECRET for payment verification (webhook secret is for webhooks only)
      console.log('🔐 Verifying signature with RAZORPAY_KEY_SECRET')
      
      try {
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
        
        console.log('Signature verification details:')
        console.log('Order ID:', body.order_id)
        console.log('Payment ID:', body.payment_id)
        console.log('Data to sign:', `${body.order_id}|${body.payment_id}`)
        console.log('Expected signature:', expectedSignature)
        console.log('Received signature:', '[REDACTED]')
        console.log('Signatures match:', expectedSignature === body.signature)
        
        if (expectedSignature !== body.signature) {
          console.log('❌ Signature verification failed')
          console.log('')
          console.log('🔍 Debug Information:')
          console.log('1. Make sure RAZORPAY_KEY_SECRET is set correctly in Supabase Edge Function secrets')
          console.log('2. The Key Secret should be from Razorpay Dashboard > Settings > API Keys')
          console.log('3. Signature format should be: HMAC-SHA256(order_id|payment_id, key_secret)')
          console.log('4. Use the debug endpoint: /functions/v1/debug-signature')
          console.log('')
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid signature',
              debug: {
                message: 'Signature verification failed. Check logs for details.',
                order_id: body.order_id,
                payment_id: body.payment_id,
                data_to_sign: `${body.order_id}|${body.payment_id}`,
                expected_signature: expectedSignature,
                received_signature: body.signature,
                signatures_match: false,
                has_key_secret: !!keySecret,
                key_secret_length: keySecret ? keySecret.length : 0
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('✅ Signature verified successfully')
      } catch (error) {
        console.log('❌ Signature verification error:', error.message)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Signature verification error: ' + error.message,
            debug: {
              message: 'Error during signature verification',
              error: error.message,
              order_id: body.order_id,
              payment_id: body.payment_id
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get plan amount - use centralized pricing
    const planAmount = getPlanPrice(body.plan)
    console.log('Plan amount:', planAmount)

    // Insert payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: body.user_id,
        plan: body.plan,
        amount: planAmount.toString(),
        currency: 'INR',
        status: 'completed',
        razorpay_payment_id: body.payment_id,
        razorpay_order_id: body.order_id,
        razorpay_signature: body.signature,
        paid_at: new Date().toISOString(),
        payment_id: body.payment_id,
        plan_id: body.plan, // Use the actual plan ID (pro/pro_plus)
        plan_name: body.plan === 'pro' ? 'Pro Plan' : 'Pro Plus Plan',
        payment_method: 'razorpay'
      })
      .select('id')
      .single()

    if (paymentError) {
      console.error('Payment upsert error:', paymentError)
      console.error('Payment data being inserted:', {
        user_id: body.user_id,
        plan: body.plan,
        amount: planAmount.toString(),
        currency: 'INR',
        status: 'completed',
        razorpay_payment_id: body.payment_id,
        razorpay_order_id: body.order_id,
        razorpay_signature: body.signature,
        paid_at: new Date().toISOString(),
        payment_id: body.payment_id,
        plan_id: '00000000-0000-0000-0000-000000000002',
        plan_name: body.plan,
        payment_method: 'razorpay'
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Payment record failed', details: paymentError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentId = paymentData.id
    console.log('Payment ID:', paymentId)

    // Activate membership
    const { error: membershipError } = await supabase
      .from('user_memberships')
      .insert({
        user_id: body.user_id,
        plan_id: body.plan, // Use the actual plan ID (pro/pro_plus)
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        plan: body.plan
      })

    if (membershipError) {
      console.error('Membership activation error:', membershipError)
      return new Response(
        JSON.stringify({ success: false, error: 'Membership activation failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Membership activated successfully')

    // Create membership purchase message
    const planName = body.plan === 'pro' ? 'Pro Plan' : body.plan === 'pro_plus' ? 'Pro Plus Plan' : 'Premium Plan';
    const { error: messageError } = await supabase
      .from('user_messages')
      .insert({
        user_id: body.user_id,
        message_type: 'membership_purchased',
        title: `Welcome to ${planName}!`,
        message: `Congratulations! You have successfully purchased the ${planName} for ₹${planAmount}. Your membership is now active and you can access all premium features.`,
        is_read: false
      });

    if (messageError) {
      console.error('Error creating membership message:', messageError);
      // Don't fail the payment for message creation error
    } else {
      console.log('Membership purchase message created successfully');
    }

    // Process referral commission DIRECTLY (no RPC calls)
    if (body.referral_code) {
      console.log('=== PROCESSING REFERRAL COMMISSION ===')
      console.log('Referral code:', body.referral_code)
      console.log('User ID:', body.user_id)
      console.log('Payment ID:', paymentId)
      console.log('Plan:', body.plan)
      console.log('Amount:', planAmount)

      try {
        // 1. Find the referrer by referral code
        const { data: referrerData, error: referrerError } = await supabase
          .from('referral_codes')
          .select('user_id')
          .eq('code', body.referral_code.toUpperCase())
          .eq('is_active', true)
          .single()

        if (referrerError || !referrerData) {
          console.log('No referrer found for code:', body.referral_code)
        } else {
          const referrerId = referrerData.user_id
          console.log('Found referrer:', referrerId)

          // 2. Check if user already has a referrer
          const { data: existingReferral, error: existingError } = await supabase
            .from('referral_transactions')
            .select('referrer_id, membership_purchased')
            .eq('referred_id', body.user_id)
            .limit(1)

          if (existingError || !existingReferral || existingReferral.length === 0) {
            console.log('No existing referral found, creating new one')

            // 3. Create referral transaction
            const { error: transactionError } = await supabase
              .from('referral_transactions')
              .insert({
                referrer_id: referrerId,
                referred_id: body.user_id,
                referral_code: body.referral_code.toUpperCase(),
                amount: planAmount,
                transaction_type: 'referral',
                status: 'completed',
                commission_amount: planAmount * 0.15,
                commission_status: 'pending',
                membership_purchased: true
              })

            if (transactionError) {
              console.error('Referral transaction error:', transactionError)
            } else {
              console.log('Referral transaction created successfully')

              // 4. Create commission record
              const { error: commissionError } = await supabase
                .from('referral_commissions')
                .insert({
                  referrer_id: referrerId,
                  referred_id: body.user_id,
                  payment_id: paymentId,
                  membership_plan: body.plan,
                  membership_amount: planAmount,
                  commission_rate: 0.15,
                  commission_amount: planAmount * 0.15,
                  status: 'pending'
                })

              if (commissionError) {
                console.error('Commission record error:', commissionError)
              } else {
                console.log('Commission record created successfully')

                // 5. Update referrer's earnings
                const { error: updateError } = await supabase
                  .from('referral_codes')
                  .update({
                    total_earnings: supabase.raw('COALESCE(total_earnings, 0) + ?', [planAmount * 0.15]),
                    total_referrals: supabase.raw('COALESCE(total_referrals, 0) + 1')
                  })
                  .eq('user_id', referrerId)

                if (updateError) {
                  console.error('Update referrer earnings error:', updateError)
                } else {
                  console.log('Referrer earnings updated successfully')
                }
              }
            }
          } else {
            console.log('User already has a referrer:', existingReferral[0].referrer_id)
            
            // Check if this is the first membership purchase
            if (!existingReferral[0].membership_purchased) {
              console.log('First membership purchase, processing commission')
              
              // Update existing referral transaction
              const { error: updateTransactionError } = await supabase
                .from('referral_transactions')
                .update({
                  membership_purchased: true,
                  amount: planAmount,
                  commission_amount: planAmount * 0.15,
                  status: 'completed',
                  commission_status: 'pending'
                })
                .eq('referred_id', body.user_id)
                .eq('referrer_id', existingReferral[0].referrer_id)

              if (updateTransactionError) {
                console.error('Update referral transaction error:', updateTransactionError)
              } else {
                console.log('Referral transaction updated successfully')

                // Create commission record
                const { error: commissionError } = await supabase
                  .from('referral_commissions')
                  .insert({
                    referrer_id: existingReferral[0].referrer_id,
                    referred_id: body.user_id,
                    payment_id: paymentId,
                    membership_plan: body.plan,
                    membership_amount: planAmount,
                    commission_rate: 0.15,
                    commission_amount: planAmount * 0.15,
                    status: 'pending'
                  })

                if (commissionError) {
                  console.error('Commission record error:', commissionError)
                } else {
                  console.log('Commission record created successfully')

                  // Update referrer's earnings
                  const { error: updateError } = await supabase
                    .from('referral_codes')
                    .update({
                      total_earnings: supabase.raw('COALESCE(total_earnings, 0) + ?', [planAmount * 0.15]),
                      total_referrals: supabase.raw('COALESCE(total_referrals, 0) + 1')
                    })
                    .eq('user_id', existingReferral[0].referrer_id)

                  if (updateError) {
                    console.error('Update referrer earnings error:', updateError)
                  } else {
                    console.log('Referrer earnings updated successfully')
                  }
                }
              }
            } else {
              console.log('User already purchased membership, no commission for this purchase')
            }
          }
        }
      } catch (error) {
        console.error('Referral processing error:', error)
      }
    }

    console.log('=== PAYMENT VERIFICATION COMPLETE ===')
    return new Response(
      JSON.stringify({ success: true, payment_id: paymentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})