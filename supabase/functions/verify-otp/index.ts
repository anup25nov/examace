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

// Helper function to normalize phone numbers for consistent searching
function normalizePhoneNumber(phone: string): string[] {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Remove leading 91 if present (since OTPs are stored without country code)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2)
  }
  
  // Return all possible formats for searching
  return [
    `+91${cleaned}`,  // +917050959444
    `91${cleaned}`,   // 917050959444
    cleaned,          // 7050959444
    `+91${cleaned}`.replace('+', '')  // 917050959444
  ]
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

      // Handle user profile creation/update with robust UPSERT pattern
      let userId: string
      let isNewUser = false
      
      console.log('🔍 [verify-otp] Starting user profile UPSERT for phone:', `+91${formattedPhone}`)
      console.log('🔍 [verify-otp] Original phone input:', phone)
      console.log('🔍 [verify-otp] Formatted phone for DB lookup:', formattedPhone)
      
      // First, try to find existing user with comprehensive search
      let existingUser = null
      
      // Try exact matches first with all possible phone formats
      const phoneFormats = normalizePhoneNumber(phone)
      
      console.log('🔍 [verify-otp] Phone formats to try:', phoneFormats)
      
      for (const phoneFormat of phoneFormats) {
        console.log(`🔍 [verify-otp] Trying exact match for: ${phoneFormat}`)
        
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const searchResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=eq.${encodeURIComponent(phoneFormat)}&select=id,phone,created_at`, {
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log(`🔍 [verify-otp] Exact match result for ${phoneFormat}:`, searchData.length, 'users found')
          if (searchData && searchData.length > 0) {
            existingUser = searchData[0]
            console.log(`✅ Found existing user with exact match ${phoneFormat}:`, existingUser.id, 'phone:', existingUser.phone)
            break
          }
        } else {
          console.log(`❌ Exact match failed for ${phoneFormat}:`, searchResponse.status)
        }
      }
      
      // If no exact match found, try pattern matching
      if (!existingUser) {
        console.log('🔍 [verify-otp] No exact match found, trying pattern matching...')
        
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const patternResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=ilike.*${formattedPhone}*&select=id,phone,created_at`, {
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (patternResponse.ok) {
          const patternData = await patternResponse.json()
          console.log(`🔍 [verify-otp] Pattern match result:`, patternData.length, 'users found')
          if (patternData && patternData.length > 0) {
            existingUser = patternData[0]
            console.log(`✅ Found existing user with pattern match:`, existingUser.id, 'phone:', existingUser.phone)
          }
        } else {
          console.log(`❌ Pattern match failed:`, patternResponse.status)
        }
      }

      // Additional fallback: Search for the exact phone format that would be created
      if (!existingUser) {
        console.log('🔍 [verify-otp] No pattern match found, trying exact +91 format...')
        
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const exactResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=eq.${encodeURIComponent(`+91${formattedPhone}`)}&select=id,phone,created_at`, {
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (exactResponse.ok) {
          const exactData = await exactResponse.json()
          console.log(`🔍 [verify-otp] Exact +91 match result:`, exactData.length, 'users found')
          if (exactData && exactData.length > 0) {
            existingUser = exactData[0]
            console.log(`✅ Found existing user with exact +91 match:`, existingUser.id, 'phone:', existingUser.phone)
          }
        } else {
          console.log(`❌ Exact +91 match failed:`, exactResponse.status)
        }
      }

      // Final fallback: Search for any user with the same phone number (any format)
      if (!existingUser) {
        console.log('🔍 [verify-otp] No exact match found, trying broad search...')
        
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const broadResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=ilike.*${formattedPhone}*&select=id,phone,created_at`, {
          headers: {
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            // @ts-ignore: Deno.env is available in Supabase Edge Functions
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
            'Content-Type': 'application/json'
          }
        })

        if (broadResponse.ok) {
          const broadData = await broadResponse.json()
          console.log(`🔍 [verify-otp] Broad search result:`, broadData.length, 'users found')
          if (broadData && broadData.length > 0) {
            existingUser = broadData[0]
            console.log(`✅ Found existing user with broad search:`, existingUser.id, 'phone:', existingUser.phone)
          }
        } else {
          console.log(`❌ Broad search failed:`, broadResponse.status)
        }
      }

      if (existingUser) {
        // Update existing user
        userId = existingUser.id
        isNewUser = false
        console.log('🔍 [verify-otp] Updating existing user:', userId)
        
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const updateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?id=eq.${userId}`, {
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

        if (!updateResponse.ok) {
          const updateErrorText = await updateResponse.text()
          console.error('❌ Failed to update existing user:', updateResponse.status, updateErrorText)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update user profile: ' + updateErrorText }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        console.log('✅ Existing user updated successfully')
      } else {
        // No existing user found - create new user with proper error handling
        userId = crypto.randomUUID()
        isNewUser = true
        console.log('🔍 [verify-otp] Creating new user profile:', userId)
        
        // Try to create new user
        // @ts-ignore: Deno.env is available in Supabase Edge Functions
        const createResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles`, {
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

        if (!createResponse.ok) {
          const createErrorText = await createResponse.text()
          console.error('❌ Failed to create user profile:', createResponse.status, createErrorText)
          
          // If creation fails due to duplicate key (23505), try to find the user
          if (createResponse.status === 409 || createErrorText.includes('23505')) {
            console.log('🔍 [verify-otp] User creation failed due to duplicate phone, searching for existing user...')
            
            // Try to find the existing user that caused the conflict
            let foundUser = null
            
            // Try all phone formats again
            const retryPhoneFormats = normalizePhoneNumber(phone)
            for (const retryFormat of retryPhoneFormats) {
              console.log(`🔍 [verify-otp] Retry exact match for: ${retryFormat}`)
              
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              const retryExactResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=eq.${encodeURIComponent(retryFormat)}&select=id,phone,created_at`, {
                headers: {
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
                  'Content-Type': 'application/json'
                }
              })

              if (retryExactResponse.ok) {
                const retryExactData = await retryExactResponse.json()
                if (retryExactData && retryExactData.length > 0) {
                  foundUser = retryExactData[0]
                  console.log(`✅ Found existing user with retry exact match ${retryFormat}:`, foundUser.id, 'phone:', foundUser.phone)
                  break
                }
              }
            }
            
            // If no exact match found, try pattern matching
            if (!foundUser) {
              console.log('🔍 [verify-otp] Retry pattern search with ILIKE for:', formattedPhone)
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              const retrySearchResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?phone=ilike.*${formattedPhone}*&select=id,phone,created_at`, {
                headers: {
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`,
                  'Content-Type': 'application/json'
                }
              })

              if (retrySearchResponse.ok) {
                const retryData = await retrySearchResponse.json()
                console.log('🔍 [verify-otp] Retry pattern search found:', retryData.length, 'users')
                if (retryData && retryData.length > 0) {
                  foundUser = retryData[0]
                  console.log('✅ Found existing user with retry pattern match:', foundUser.id, 'phone:', foundUser.phone)
                }
              }
            }

            if (foundUser) {
              userId = foundUser.id
              isNewUser = false
              console.log('✅ Found existing user on retry:', userId, 'phone:', foundUser.phone)
                
              // Update the found user
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              const retryUpdateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/user_profiles?id=eq.${userId}`, {
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

              if (!retryUpdateResponse.ok) {
                const retryErrorText = await retryUpdateResponse.text()
                console.error('❌ Failed to update user on retry:', retryErrorText)
                return new Response(
                  JSON.stringify({ success: false, error: 'Failed to update existing user: ' + retryErrorText }),
                  { 
                    status: 500, 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                  }
                )
              }

              console.log('✅ User updated successfully on retry')
            } else {
              return new Response(
                JSON.stringify({ success: false, error: 'User creation failed and no existing user found: ' + createErrorText }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }
          } else {
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to create user profile: ' + createErrorText }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        } else {
          console.log('✅ User profile created successfully')
        }
      }

      // Create referral code for new users
      if (isNewUser) {
        try {
          console.log('🔍 [verify-otp] Creating referral code for new user:', userId)
          
          // Check if referral code already exists
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          const referralCheckResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/referral_codes?user_id=eq.${userId}&select=id`, {
            headers: {
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
              'Content-Type': 'application/json'
            }
          })

          if (referralCheckResponse.ok) {
            const referralCheckData = await referralCheckResponse.json()
            
            if (!referralCheckData || referralCheckData.length === 0) {
              // Generate referral code from user ID
              const referralCode = userId.substring(0, 8).toUpperCase()
              
              // Create referral code
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              const referralCreateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/referral_codes`, {
                method: 'POST',
                headers: {
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
                  // @ts-ignore: Deno.env is available in Supabase Edge Functions
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  user_id: userId,
                  code: referralCode,
                  total_referrals: 0,
                  total_earnings: 0.00,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
              })

              if (referralCreateResponse.ok) {
                console.log('✅ Referral code created successfully:', referralCode)
              } else {
                const referralErrorText = await referralCreateResponse.text()
                console.error('❌ Failed to create referral code:', referralErrorText)
              }
            } else {
              console.log('✅ Referral code already exists for user')
            }
          } else {
            console.error('❌ Failed to check existing referral code')
          }
        } catch (referralError) {
          console.error('❌ Error creating referral code for new user:', referralError)
        }
        
        // Create default exam stats for new users
        try {
          console.log('🔍 [verify-otp] Creating default exam stats for new user:', userId)
          
          // @ts-ignore: Deno.env is available in Supabase Edge Functions
          const statsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/create_all_default_exam_stats`, {
            method: 'POST',
            headers: {
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
              // @ts-ignore: Deno.env is available in Supabase Edge Functions
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              p_user_id: userId
            })
          })

          if (statsResponse.ok) {
            console.log('✅ Default exam stats created successfully')
          } else {
            const statsErrorText = await statsResponse.text()
            console.error('❌ Failed to create exam stats:', statsErrorText)
          }
        } catch (statsError) {
          console.error('❌ Error creating exam stats for new user:', statsError)
        }
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
