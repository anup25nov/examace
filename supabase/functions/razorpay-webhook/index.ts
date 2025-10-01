import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RazorpayWebhookEvent {
  event: string
  created_at: number
  contains: string[]
  payload: {
    payment: {
      entity: {
        id: string
        amount: number
        currency: string
        status: string
        order_id: string
        method: string
        description: string
        created_at: number
      }
    }
  }
}

serve(async (req) => {
  console.log('=== WEBHOOK FUNCTION CALLED ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== WEBHOOK RECEIVED ===')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    
    console.log('Environment variables loaded')
    
    // Get request body
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    console.log('Body length:', body.length)
    console.log('Signature present:', !!signature)
    console.log('Body preview:', body.substring(0, 200) + '...')
    
    // Verify webhook signature for security
    if (webhookSecret && signature) {
      const isValidSignature = await verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValidSignature) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized', { status: 401, headers: corsHeaders })
      }
      console.log('✅ Webhook signature verified')
    } else {
      console.log('⚠️ WARNING: Webhook signature verification disabled')
    }

    // Parse webhook event
    const event: RazorpayWebhookEvent = JSON.parse(body)
    console.log('Received webhook event:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(supabaseUrl, supabaseKey, event)
        break
      
      case 'payment.failed':
        await handlePaymentFailed(supabaseUrl, supabaseKey, event)
        break
      
      case 'payment.authorized':
        await handlePaymentAuthorized(supabaseUrl, supabaseKey, event)
        break
      
      case 'refund.created':
        await handleRefundCreated(supabaseUrl, supabaseKey, event)
        break
      
      case 'refund.processed':
        await handleRefundProcessed(supabaseUrl, supabaseKey, event)
        break
      
      case 'refund.failed':
        await handleRefundFailed(supabaseUrl, supabaseKey, event)
        break
      
      default:
        console.log('Unhandled event type:', event.event)
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Verify Razorpay webhook signature
 */
async function verifyWebhookSignature(
  body: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  try {
    // Create HMAC SHA256 hash
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

/**
 * Make Supabase API call
 */
async function supabaseCall(url: string, key: string, method: string, table: string, operation: string, data?: any) {
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: data ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase API error: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(supabaseUrl: string, supabaseKey: string, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment captured:', payment.id)

    // Find the payment record
    const paymentRecords = await supabaseCall(
      supabaseUrl, 
      supabaseKey, 
      'GET', 
      'payments', 
      'select',
      null
    )

    let paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_order_id === payment.order_id && p.status === 'pending'
    )

    if (!paymentRecord) {
      // Try to find by payment ID as fallback
      paymentRecord = paymentRecords.find((p: any) => 
        p.razorpay_payment_id === payment.id
      )
    }

    if (!paymentRecord) {
      console.error('Payment record not found for order:', payment.order_id)
      return
    }

    console.log('Found payment record:', paymentRecord.id)

    // Check if payment is already processed
    if (paymentRecord.status === 'completed') {
      console.log('Payment already processed, skipping:', paymentRecord.id)
      return
    }

    // Update payment to completed
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'payments',
      'update',
      {
        id: paymentRecord.id,
        status: 'completed',
        razorpay_payment_id: payment.id,
        razorpay_signature: (payment as any).razorpay_signature || null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    )

    console.log('Payment updated to completed')

    // Activate membership
    const membershipStart = new Date().toISOString()
    const membershipEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    // Check if membership already exists
    const existingMemberships = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'user_memberships',
      'select',
      null
    )

    const existingMembership = existingMemberships.find((m: any) => m.user_id === paymentRecord.user_id)

    if (existingMembership) {
      // Update existing membership
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'user_memberships',
        'update',
        {
          id: existingMembership.id,
          plan_id: paymentRecord.plan_id,
          start_date: membershipStart,
          end_date: membershipEnd,
          status: 'active',
          updated_at: new Date().toISOString()
        }
      )
      console.log('Updated existing membership:', existingMembership.id)
    } else {
      // Create new membership
      const newMembership = await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'POST',
        'user_memberships',
        'insert',
        {
          user_id: paymentRecord.user_id,
          plan_id: paymentRecord.plan_id,
          start_date: membershipStart,
          end_date: membershipEnd,
          status: 'active'
        }
      )
      console.log('Created new membership:', newMembership[0].id)
    }

    // Process referral commission
    await processReferralCommission(supabaseUrl, supabaseKey, paymentRecord, payment)

    console.log('Payment processed successfully')

  } catch (error) {
    console.error('Error in handlePaymentCaptured:', error)
  }
}

/**
 * Process referral commission
 */
async function processReferralCommission(supabaseUrl: string, supabaseKey: string, paymentRecord: any, payment: any) {
  try {
    console.log('🔍 Starting referral commission processing for payment:', paymentRecord.id)

    // Get user profile
    const userProfiles = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'user_profiles',
      'select',
      null
    )

    const userProfile = userProfiles.find((p: any) => p.id === paymentRecord.user_id)

    if (!userProfile?.referred_by) {
      console.log('No referrer found for user:', paymentRecord.user_id)
      return
    }

    console.log('✅ Found referrer code:', userProfile.referred_by)

    // Get referral codes
    const referralCodes = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'referral_codes',
      'select',
      null
    )

    const referrerData = referralCodes.find((r: any) => 
      r.code === userProfile.referred_by && r.is_active === true
    )

    if (!referrerData) {
      console.log('Referrer not found or inactive for code:', userProfile.referred_by)
      return
    }

    const referrerId = referrerData.user_id
    const paymentAmount = payment.amount / 100
    const commissionAmount = paymentAmount * 0.15

    console.log('💰 Processing commission:', {
      referrerId,
      referredUserId: paymentRecord.user_id,
      paymentAmount,
      commissionAmount,
      referralCode: userProfile.referred_by
    })

    // Check for existing referral transaction
    const referralTransactions = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'referral_transactions',
      'select',
      null
    )

    const existingTransaction = referralTransactions.find((t: any) => 
      t.referred_id === paymentRecord.user_id &&
      t.referral_code === userProfile.referred_by &&
      t.transaction_type === 'referral'
    )

    if (existingTransaction) {
      console.log('Referral transaction already exists, skipping:', existingTransaction.id)
      return
    }

    // Create referral transaction
    const newTransaction = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'POST',
      'referral_transactions',
      'insert',
      {
        referrer_id: referrerId,
        referred_id: paymentRecord.user_id,
        referral_code: userProfile.referred_by,
        amount: paymentAmount,
        transaction_type: 'referral',
        status: 'completed',
        commission_amount: commissionAmount,
        commission_status: 'pending',
        membership_purchased: true,
        payment_id: paymentRecord.id,
        created_at: new Date().toISOString()
      }
    )

    console.log('✅ Referral transaction created successfully:', newTransaction[0].id)

    // Update referrer's total earnings
    const referrerProfile = userProfiles.find((p: any) => p.id === referrerId)
    const currentEarnings = referrerProfile?.total_referral_earnings || 0
    const newTotalEarnings = currentEarnings + commissionAmount

    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'user_profiles',
      'update',
      {
        id: referrerId,
        total_referral_earnings: newTotalEarnings,
        updated_at: new Date().toISOString()
      }
    )

    console.log('✅ Updated referrer total earnings to:', newTotalEarnings)

  } catch (error) {
    console.error('❌ Error processing referral commission:', error)
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(supabaseUrl: string, supabaseKey: string, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment failed:', payment.id)

    // Update payment status to failed
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      null
    )

    const paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_order_id === payment.order_id && p.status === 'pending'
    )

    if (paymentRecord) {
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'payments',
        'update',
        {
          id: paymentRecord.id,
          status: 'failed',
          razorpay_payment_id: payment.id,
          failed_reason: (payment as any).error_description || 'Payment failed',
          updated_at: new Date().toISOString()
        }
      )
      console.log('Payment marked as failed')
    }

  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(supabaseUrl: string, supabaseKey: string, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment authorized:', payment.id)

    // Update payment status to authorized
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      null
    )

    const paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_order_id === payment.order_id && p.status === 'pending'
    )

    if (paymentRecord) {
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'payments',
        'update',
        {
          id: paymentRecord.id,
          status: 'authorized',
          razorpay_payment_id: payment.id,
          updated_at: new Date().toISOString()
        }
      )
      console.log('Payment marked as authorized')
    }

  } catch (error) {
    console.error('Error in handlePaymentAuthorized:', error)
  }
}

/**
 * Handle refund created event
 */
async function handleRefundCreated(supabaseUrl: string, supabaseKey: string, event: any) {
  try {
    const refund = event.payload.refund.entity
    console.log('Processing refund created:', refund.id)

    // Find the payment record
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      null
    )

    const paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_payment_id === refund.payment_id
    )

    if (!paymentRecord) {
      console.error('Payment record not found for refund:', refund.payment_id)
      return
    }

    // Update payment status to refunded
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'payments',
      'update',
      {
        id: paymentRecord.id,
        status: 'refunded',
        updated_at: new Date().toISOString()
      }
    )

    console.log('Payment marked as refunded')

    // Deactivate membership
    const memberships = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'user_memberships',
      'select',
      null
    )

    const membership = memberships.find((m: any) => m.user_id === paymentRecord.user_id)

    if (membership) {
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'user_memberships',
        'update',
        {
          id: membership.id,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }
      )
      console.log('Membership deactivated due to refund')
    }

  } catch (error) {
    console.error('Error in handleRefundCreated:', error)
  }
}

/**
 * Handle refund processed event
 */
async function handleRefundProcessed(supabaseUrl: string, supabaseKey: string, event: any) {
  try {
    const refund = event.payload.refund.entity
    console.log('Processing refund processed:', refund.id)

    // Find the payment record
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      null
    )

    const paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_payment_id === refund.payment_id
    )

    if (!paymentRecord) {
      console.error('Payment record not found for refund processed:', refund.payment_id)
      return
    }

    // Update payment status to refunded (if not already)
    if (paymentRecord.status !== 'refunded') {
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'payments',
        'update',
        {
          id: paymentRecord.id,
          status: 'refunded',
          updated_at: new Date().toISOString()
        }
      )
      console.log('Payment confirmed as refunded')
    }

  } catch (error) {
    console.error('Error in handleRefundProcessed:', error)
  }
}

/**
 * Handle refund failed event
 */
async function handleRefundFailed(supabaseUrl: string, supabaseKey: string, event: any) {
  try {
    const refund = event.payload.refund.entity
    console.log('Processing refund failed:', refund.id)

    // Find the payment record
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      null
    )

    const paymentRecord = paymentRecords.find((p: any) => 
      p.razorpay_payment_id === refund.payment_id
    )

    if (!paymentRecord) {
      console.error('Payment record not found for refund failed:', refund.payment_id)
      return
    }

    // Log the refund failure but don't change payment status
    console.log('Refund failed for payment:', paymentRecord.id, 'Reason:', refund.notes?.comment || 'Unknown')

  } catch (error) {
    console.error('Error in handleRefundFailed:', error)
  }
}