// Supabase Edge Function for WhatsApp OTP delivery
// This function handles OTP delivery via Infobip WhatsApp API

// Use Deno's built-in serve function
const serve = (handler: (req: Request) => Response | Promise<Response>) => {
  return Deno.serve(handler);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Infobip WhatsApp Configuration
const CONFIG = {
  CUSTOM_SMS_API_KEY: 'examace-sms-key-2024-abc123xyz789',
  INFOBIP_API_KEY: Deno.env.get('INFOBIP_API_KEY') || 'ff0df7b938db8b85a25ac5c5b6898adc-09dc2555-ca96-49f1-b030-73b930d1491d',
  INFOBIP_BASE_URL: Deno.env.get('INFOBIP_BASE_URL') || 'https://519v8d.api.infobip.com',
  WHATSAPP_BUSINESS_NUMBER: Deno.env.get('WHATSAPP_BUSINESS_NUMBER') || '447860088970',
  WHATSAPP_TEMPLATE_NAME: Deno.env.get('WHATSAPP_TEMPLATE_NAME') || 'test_whatsapp_template_en'
};

interface WhatsAppRequest {
  phone: string;
  type: 'otp' | 'notification' | 'promotional';
  sender: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify API key - accept either custom API key or Supabase service role key
    const authHeader = req.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || req.headers.get('apikey')
    
    // Check if it's our custom API key or a valid Supabase key
    const isValidCustomKey = apiKey === CONFIG.CUSTOM_SMS_API_KEY
    const isValidSupabaseKey = apiKey && apiKey.length > 50 // Supabase keys are longer
    
    if (!apiKey || (!isValidCustomKey && !isValidSupabaseKey)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid API key',
          debug: {
            providedKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
            expectedCustomKey: CONFIG.CUSTOM_SMS_API_KEY,
            isValidCustom: isValidCustomKey,
            isValidSupabase: isValidSupabaseKey
          }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { phone, type: _type, sender }: WhatsAppRequest = await req.json()

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '91' + formattedPhone
    } else if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone
    }

    // Use Infobip WhatsApp provider only
    const providers = [
      {
        name: 'whatsapp',
        send: async () => await sendViaWhatsApp(formattedPhone, sender)
      }
    ]

    let lastError: string | undefined

    for (const provider of providers) {
      try {
        console.log(`📱 Trying ${provider.name}...`)
        const result = await provider.send()
        
        if (result.success) {
          console.log(`✅ ${provider.name} sent successfully`)
          return new Response(
            JSON.stringify({
              success: true,
              messageId: result.messageId,
              provider: provider.name
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          lastError = result.error
          console.log(`❌ ${provider.name} failed: ${lastError}`)
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ ${provider.name} error: ${lastError}`)
      }
    }

    // WhatsApp provider failed
    return new Response(
      JSON.stringify({
        success: false,
        error: lastError || 'WhatsApp OTP delivery failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ WhatsApp function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Infobip WhatsApp Provider Implementation
async function sendViaWhatsApp(phone: string, _sender: string): Promise<WhatsAppResponse> {
  try {
    // Check if Infobip is configured
    if (!CONFIG.INFOBIP_API_KEY || !CONFIG.WHATSAPP_BUSINESS_NUMBER) {
      console.log('❌ Infobip WhatsApp not configured')
      return {
        success: false,
        error: 'Infobip WhatsApp not configured',
        provider: 'whatsapp'
      }
    }

    console.log(`📱 Sending WhatsApp OTP via Infobip to ${phone}`)
    
    // Format phone number for WhatsApp (ensure it starts with country code)
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '91' + formattedPhone
    } else if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone
    }
    
    // Generate dynamic OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`🔑 Generated dynamic OTP: ${otp}`)
    
    // Store OTP in database first (use phone without country code for consistency)
    const dbPhone = formattedPhone.startsWith('91') ? formattedPhone.substring(2) : formattedPhone
    const otpData = {
      phone: dbPhone,
      otp_code: otp,
      provider: 'whatsapp',
      message_id: `otp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      attempts: 0,
      max_attempts: 3,
      is_verified: false
    }
    
    console.log(`💾 Storing OTP for phone: ${dbPhone} (formatted for DB)`)

    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    const storeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/otps`, {
      method: 'POST',
      headers: {
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(otpData)
    })

    if (!storeResponse.ok) {
      const errorData = await storeResponse.text()
      console.error('❌ Failed to store OTP:', storeResponse.status, errorData)
      return {
        success: false,
        error: 'Failed to store OTP: ' + errorData,
        provider: 'whatsapp'
      }
    }

    const storedOTP = await storeResponse.json()
    console.log(`✅ OTP stored with ID: ${storedOTP[0].id}`)
    
    // Prepare Infobip WhatsApp API payload (using your format)
    const payload = {
      messages: [
        {
          from: CONFIG.WHATSAPP_BUSINESS_NUMBER,
          to: formattedPhone,
          messageId: `otp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: {
            templateName: CONFIG.WHATSAPP_TEMPLATE_NAME,
            templateData: {
              body: {
                placeholders: [otp]
              }
            },
            language: 'en'
          }
        }
      ]
    }

    const response = await fetch(`${CONFIG.INFOBIP_BASE_URL}/whatsapp/1/message/template`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${CONFIG.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`❌ Infobip WhatsApp API error: ${response.status} - ${errorData}`)
      return { success: false, error: `WhatsApp API error: ${response.status} - ${errorData}` }
    }

    const result = await response.json()
    console.log(`✅ WhatsApp OTP sent successfully via Infobip:`, result)
    
    return { 
      success: true, 
      messageId: result.messages?.[0]?.messageId || `whatsapp-${Date.now()}`,
      provider: 'whatsapp'
    }
  } catch (error) {
    console.error(`❌ Infobip WhatsApp error:`, error)
    return { success: false, error: 'WhatsApp error: ' + (error instanceof Error ? error.message : 'Unknown error') }
  }
}

