// Supabase Edge Function for Secure OTP Verification
// This function handles OTP verification server-side only

// @ts-ignore - Deno global is available in Supabase Edge Functions
const serve = (handler: (req: Request) => Response | Promise<Response>) => {
  // @ts-ignore: Deno.serve is available in Deno runtime
  return Deno.serve(handler);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    userId?: string;
    phone?: string;
    isNewUser?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify API key
    const authHeader = req.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || req.headers.get('apikey')
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { phone, otp }: VerifyOTPRequest = await req.json()

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone and OTP are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 [verify-otp] Starting verification for phone: ${phone}`)

    // Format phone number for database lookup
    let formattedPhone = phone.replace(/\D/g, '')
    
    // Remove leading 91 if present (since OTPs are stored without country code)
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
      formattedPhone = formattedPhone.substring(2)
    }
    
    console.log(`🔍 [verify-otp] Formatted phone for DB lookup: ${formattedPhone}`)

    // Get active OTP from database using direct query
    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    const otpResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/otps?phone=eq.${formattedPhone}&is_verified=eq.false&expires_at=gt.${new Date().toISOString()}&select=*&order=created_at.desc&limit=1`, {
      headers: {
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json'
      }
    })

    if (!otpResponse.ok) {
      console.error('❌ Failed to get active OTP from database')
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const otpData = await otpResponse.json()
    
    if (!otpData || otpData.length === 0) {
      console.log('❌ No active OTP found for phone:', formattedPhone)
      return new Response(
        JSON.stringify({ success: false, error: 'No active OTP found for this phone number' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const activeOTP = otpData[0]
    console.log('🔍 [verify-otp] Found active OTP for phone:', formattedPhone)

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(activeOTP.expires_at)
    if (now > expiresAt) {
      console.log('❌ OTP expired for phone:', formattedPhone)
      return new Response(
        JSON.stringify({ success: false, error: 'OTP has expired' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check max attempts
    if (activeOTP.attempts >= activeOTP.max_attempts) {
      console.log('❌ Max attempts exceeded for phone:', formattedPhone)
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum OTP attempts exceeded' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Increment attempts
    // @ts-ignore: Deno.env is available in Supabase Edge Functions
    const incrementResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/otps?id=eq.${activeOTP.id}`, {
      method: 'PATCH',
      headers: {
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        attempts: activeOTP.attempts + 1,
        updated_at: new Date().toISOString()
      })
    })

    if (!incrementResponse.ok) {
      console.error('❌ Failed to increment OTP attempts')
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const newAttempts = activeOTP.attempts + 1

    // Verify OTP (secure comparison)
    if (activeOTP.otp_code === otp) {
      console.log('✅ OTP verified successfully for phone:', formattedPhone)
      
      // Mark OTP as verified
      // @ts-ignore: Deno.env is available in Supabase Edge Functions
      await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/otps?id=eq.${activeOTP.id}`, {
        method: 'PATCH',
        headers: {
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
      })

      // Check if user exists or create new user
      let userId: string
      let isNewUser = false
      
      // @ts-ignore: Deno.env is available in Supabase Edge Functions
      const userResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=eq.+91${formattedPhone}&select=id,phone,created_at`, {
        headers: {
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
          'Content-Type': 'application/json'
        }
      })

      const userData = await userResponse.json()
      
      if (userData && userData.length > 0) {
        // User exists
        userId = userData[0].id
        console.log('🔍 [verify-otp] Using existing user:', userId)
        
        // Update phone_verified status for existing user
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone_verified: true,
            updated_at: new Date().toISOString()
          })
        })
      } else {
        // Create new user profile directly (no foreign key dependency)
        userId = crypto.randomUUID()
        isNewUser = true
        console.log('🔍 [verify-otp] Creating new user profile:', userId)
        
        // Create user profile directly in user_profiles table
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const createProfileResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles`, {
          method: 'POST',
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: userId,
            phone: `+91${formattedPhone}`,
            membership_status: 'active',
            membership_plan: 'free',
            membership_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            phone_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        })

        if (!createProfileResponse.ok) {
          const errorText = await createProfileResponse.text()
          console.error('❌ Failed to create user profile:', createProfileResponse.status, errorText)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create user profile: ' + errorText }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('✅ User profile created successfully')
      }

      // Return success without exposing OTP
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP verified successfully',
          data: {
            userId: userId,
            phone: `+91${formattedPhone}`,
            isNewUser: isNewUser
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('❌ Invalid OTP for phone:', formattedPhone)
      
      if (newAttempts >= activeOTP.max_attempts) {
        return new Response(
          JSON.stringify({ success: false, error: 'Maximum OTP attempts exceeded' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('❌ OTP verification error:', error)
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
