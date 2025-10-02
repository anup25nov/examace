// Use built-in Deno serve function

// Deno type declarations
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}

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

Deno.serve(async (req) => {
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
    
    // For Razorpay webhooks, we don't need authorization header
    // The webhook secret verification is sufficient
    
    console.log('Environment variables loaded')
    
    // Get request body
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    console.log('Body length:', body.length)
    console.log('Signature present:', !!signature)
    console.log('Body preview:', body.substring(0, 200) + '...')
    
    // Verify webhook signature for security (optional for testing)
    if (webhookSecret && signature) {
      const isValidSignature = await verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValidSignature) {
        console.error('Invalid webhook signature')
        return new Response('Unauthorized', { status: 401, headers: corsHeaders })
      }
      console.log('✅ Webhook signature verified')
    } else {
      console.log('⚠️ WARNING: Webhook signature verification disabled - proceeding anyway')
    }

    // Parse webhook event
    const event: RazorpayWebhookEvent = JSON.parse(body)
    console.log('Received webhook event:', event.event)

    // Handle different event types with comprehensive error handling
    try {
      switch (event.event) {
        case 'payment.captured':
          console.log('Processing payment.captured event')
          await handlePaymentCaptured(supabaseUrl, supabaseKey, event)
          break
        
        case 'payment.failed':
          console.log('Processing payment.failed event')
          await handlePaymentFailed(supabaseUrl, supabaseKey, event)
          break
        
        case 'payment.authorized':
          console.log('Processing payment.authorized event')
          await handlePaymentAuthorized(supabaseUrl, supabaseKey, event)
          break
        
        case 'refund.created':
          console.log('Processing refund.created event')
          await handleRefundCreated(supabaseUrl, supabaseKey, event)
          break
        
        case 'refund.processed':
          console.log('Processing refund.processed event')
          await handleRefundProcessed(supabaseUrl, supabaseKey, event)
          break
        
        case 'refund.failed':
          console.log('Processing refund.failed event')
          await handleRefundFailed(supabaseUrl, supabaseKey, event)
          break
        
        case 'order.paid':
          console.log('Processing order.paid event')
          await handleOrderPaid(supabaseUrl, supabaseKey, event)
          break
        
        case 'payment.dispute.created':
          console.log('Processing payment.dispute.created event')
          await handleDisputeCreated(supabaseUrl, supabaseKey, event)
          break
        
        default:
          console.log('Unhandled event type:', event.event)
          return new Response('Event type not supported', { 
            status: 200, 
            headers: corsHeaders 
          })
      }
    } catch (eventError) {
      console.error('Error processing event:', event.event, eventError)
      // Don't fail the webhook for individual event processing errors
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log detailed error information
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    // Return appropriate error response
    const errorResponse = {
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(errorResponse), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Retry operation with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>, 
  operationName: string, 
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      console.error(`${operationName} attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`Retrying ${operationName} in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error(`${operationName} failed after ${maxRetries} attempts`)
}

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
 * Make Supabase API call using service role key
 */
async function supabaseCall(url: string, key: string, method: string, table: string, operation: string, data?: any) {
  let requestUrl = `${url}/rest/v1/${table}`
  
  // Handle different operations
  if (operation === 'select') {
    // GET request for selecting data
    if (data) {
      const params = new URLSearchParams()
      Object.keys(data).forEach(key => {
        params.append(key, data[key])
      })
      requestUrl += `?${params.toString()}`
    }
  } else if (operation === 'update') {
    // PATCH request for updating
    if (data && data.id) {
      requestUrl += `?id=eq.${data.id}`
      delete data.id // Remove id from body
    }
  } else if (operation === 'insert') {
    // POST request for inserting
    // data should be the record to insert
    // No URL modifications needed for insert
  } else if (operation === 'delete') {
    // DELETE request for deleting
    if (data && data.id) {
      requestUrl += `?id=eq.${data.id}`
    }
  }

  const response = await fetch(requestUrl, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: (method === 'POST' || method === 'PATCH') && data ? JSON.stringify(data) : undefined
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Supabase API error for ${operation} on ${table}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url: requestUrl,
      method,
      data
    })
    throw new Error(`Supabase API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log(`Supabase API success for ${operation} on ${table}:`, result)
  return result
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(supabaseUrl: string, supabaseKey: string, event: RazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity
    console.log('Processing payment captured:', payment.id)

    // Find the payment record by order_id
    const paymentRecords = await supabaseCall(
      supabaseUrl, 
      supabaseKey, 
      'GET', 
      'payments', 
      'select',
      { razorpay_order_id: `eq.${payment.order_id}` }
    )

    let paymentRecord = paymentRecords.find((p: any) => p.status === 'pending')

    if (!paymentRecord) {
      console.log('No pending payment found for order:', payment.order_id)
      return
    }

    console.log('Found payment record:', paymentRecord.id)

    // Check if payment is already processed
    if (paymentRecord.status === 'completed') {
      console.log('Payment already processed, skipping:', paymentRecord.id)
      return
    }

    // Check for duplicate processing (idempotency)
    const existingTransactions = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'membership_transactions',
      'select',
      { transaction_id: `eq.${paymentRecord.id}` }
    )

    if (existingTransactions.length > 0) {
      console.log('Membership transaction already exists, skipping:', paymentRecord.id)
      return
    }

    // Update payment to completed with retry logic
    await retryOperation(async () => {
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
    }, 'Payment update')

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
      { user_id: `eq.${paymentRecord.user_id}` }
    )

    const existingMembership = existingMemberships.find((m: any) => m.user_id === paymentRecord.user_id)
    let membershipId: string

    if (existingMembership) {
      // Update existing membership with retry
      await retryOperation(async () => {
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
      }, 'Membership update')
      console.log('Updated existing membership:', existingMembership.id)
      membershipId = existingMembership.id
    } else {
      // Create new membership with retry
      const newMembership = await retryOperation(async () => {
        return await supabaseCall(
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
      }, 'Membership creation')
      console.log('Created new membership:', newMembership[0].id)
      membershipId = newMembership[0].id
    }

    // Create membership transaction record
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'POST',
      'membership_transactions',
      'insert',
      {
        user_id: paymentRecord.user_id,
        membership_id: membershipId,
        transaction_id: paymentRecord.id,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency || 'INR',
        status: 'completed',
        payment_method: 'razorpay'
      }
    )
    console.log('Created membership transaction record')

    // Update user profile
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'user_profiles',
      'update',
      {
        id: paymentRecord.user_id,
        membership_status: 'pro',
        membership_plan: 'pro',
        membership_expiry: membershipEnd,
        updated_at: new Date().toISOString()
      }
    )
    console.log('Updated user profile')

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

/**
 * Handle order.paid event (alternative to payment.captured)
 */
async function handleOrderPaid(supabaseUrl: string, supabaseKey: string, event: any) {
  try {
    const order = event.payload.order.entity
    console.log('Processing order.paid event:', order.id)
    
    // Find payment record by order_id
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      { razorpay_order_id: `eq.${order.id}` }
    )

    const paymentRecord = paymentRecords.find((p: any) => p.status === 'pending')
    
    if (!paymentRecord) {
      console.log('No pending payment found for order:', order.id)
      return
    }

    // Update payment status
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'payments',
      'update',
      {
        id: paymentRecord.id,
        status: 'completed',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    )

    // Process the same as payment.captured
    await handlePaymentCaptured(supabaseUrl, supabaseKey, {
      ...event,
      payload: {
        payment: {
          entity: {
            id: order.id,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: 'captured'
          }
        }
      }
    })

  } catch (error) {
    console.error('Error in handleOrderPaid:', error)
  }
}

/**
 * Handle payment dispute created event
 */
async function handleDisputeCreated(supabaseUrl: string, supabaseKey: string, event: any) {
  try {
    const dispute = event.payload.dispute.entity
    console.log('Processing payment.dispute.created event:', dispute.id)

    // Find the payment record
    const paymentRecords = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'payments',
      'select',
      { razorpay_payment_id: `eq.${dispute.payment_id}` }
    )

    const paymentRecord = paymentRecords.find((p: any) => p.razorpay_payment_id === dispute.payment_id)
    
    if (!paymentRecord) {
      console.log('Payment record not found for dispute:', dispute.payment_id)
      return
    }

    // Update payment status to disputed
    await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'PATCH',
      'payments',
      'update',
      {
        id: paymentRecord.id,
        status: 'disputed',
        updated_at: new Date().toISOString(),
        metadata: {
          dispute_id: dispute.id,
          dispute_reason: dispute.reason,
          dispute_amount: dispute.amount,
          dispute_created_at: dispute.created_at
        }
      }
    )

    // Deactivate membership if active
    const memberships = await supabaseCall(
      supabaseUrl,
      supabaseKey,
      'GET',
      'user_memberships',
      'select',
      { user_id: `eq.${paymentRecord.user_id}` }
    )

    const activeMembership = memberships.find((m: any) => m.status === 'active')
    if (activeMembership) {
      await supabaseCall(
        supabaseUrl,
        supabaseKey,
        'PATCH',
        'user_memberships',
        'update',
        {
          id: activeMembership.id,
          status: 'disputed',
          updated_at: new Date().toISOString()
        }
      )
      console.log('Membership deactivated due to dispute')
    }

    console.log('Dispute processed successfully')

  } catch (error) {
    console.error('Error in handleDisputeCreated:', error)
  }
}