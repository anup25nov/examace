// Simplified Supabase phone authentication service with custom OTP
import { supabase } from '@/integrations/supabase/client';
import { databaseOTPService } from './databaseOTPService';
import { generateUserID } from './uuidUtils';

export interface AuthUser {
  id: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// Send OTP to phone using custom WhatsApp service
export const sendOTPCode = async (phone: string) => {
  try {
    console.log('Starting custom OTP send process for phone:', phone);
    
    // Ensure phone number is in international format
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    // Use custom OTP service with WhatsApp integration
    const result = await databaseOTPService.sendOTP(formattedPhone);
    
    if (result.success) {
      console.log('Custom OTP sent successfully via WhatsApp');
      return { success: true, data: result };
    } else {
      console.error('Error sending custom OTP:', result.error);
      return { success: false, error: result.error || 'Failed to send OTP' };
    }
  } catch (error: any) {
    console.error('Error sending custom OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

// Check if phone number exists in database
export const checkPhoneExists = async (phone: string) => {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, phone, created_at')
      .eq('phone', formattedPhone)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking phone existence:', error);
      return { exists: false, error: error.message };
    }
    
    const exists = !!data;
    console.log('Phone existence check:', { phone: formattedPhone, exists });
    
    return { exists, data };
  } catch (error: any) {
    console.error('Error checking phone existence:', error);
    return { exists: false, error: error.message };
  }
};

// Verify OTP code using custom service
export const verifyOTPCode = async (phone: string, otp: string) => {
  try {
    console.log('Verifying custom OTP for phone:', phone);
    
    // Ensure phone number is in international format
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    // Use custom OTP verification service
    const result = await databaseOTPService.verifyOTP(formattedPhone, otp);
    
    if (result.success) {
      console.log('Custom OTP verified successfully');
      
      // Check if phone number already exists in database
      const phoneCheck = await checkPhoneExists(phone);
      const isNewUser = !phoneCheck.exists;
      
      console.log('Phone existence check result:', {
        phone: formattedPhone,
        exists: phoneCheck.exists,
        isNewUser,
        existingUserId: phoneCheck.data?.id
      });
      
      // Use existing user ID if phone exists, otherwise generate new one
      const userId = phoneCheck.exists && phoneCheck.data?.id 
        ? phoneCheck.data.id 
        : (result.data?.userId || generateUserID());
      
      console.log('User ID determined:', { userId, isNewUser });
      
      // Create or update user profile
      const profileResult = await createOrUpdateUserProfile(userId, formattedPhone, isNewUser);
      
      // Store authentication data for persistence
      localStorage.setItem('userId', userId);
      localStorage.setItem('userPhone', formattedPhone);
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('Authentication data stored:', {
        userId: userId,
        phone: formattedPhone,
        isAuthenticated: 'true',
        isNewUser
      });
      
      return { 
        success: true, 
        data: { id: userId, phone: formattedPhone }, 
        isNewUser 
      };
    } else {
      console.error('Error verifying custom OTP:', result.error);
      return { success: false, error: result.error || 'Invalid OTP' };
    }
  } catch (error: any) {
    console.error('Error verifying custom OTP:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Create or update user profile in Supabase
export const createOrUpdateUserProfile = async (userId: string, phone: string, isNewUser: boolean = false) => {
  try {
    console.log('Creating/updating user profile for:', { userId, phone, isNewUser });
    
    const profileData = {
      id: userId,
      phone: phone,
      updated_at: new Date().toISOString()
    };

    // Handle user profile creation with proper conflict resolution
    let data, error;
    
    try {
      // First check if phone number already exists with a different user ID
      const { data: existingPhoneUser, error: phoneCheckError } = await supabase
        .from('user_profiles')
        .select('id, phone')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneCheckError) {
        console.error('Error checking phone number:', phoneCheckError);
        error = phoneCheckError;
      } else if (existingPhoneUser && existingPhoneUser.id !== userId) {
        // Phone number exists with different user ID - this is a conflict
        console.warn(`Phone number ${phone} already exists with user ID ${existingPhoneUser.id}, but trying to create with ${userId}`);
        error = new Error('Phone number already registered with a different account');
      } else if (existingPhoneUser && existingPhoneUser.id === userId) {
        // Phone number exists with same user ID - just update last login
        console.log('Updating existing user profile for login:', userId);
        const updateResult = await supabase
          .from('user_profiles')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
        
        data = updateResult.data;
        error = updateResult.error;
      } else {
        // No existing phone user - safe to proceed with upsert (new user)
        console.log('Creating new user profile:', userId);
        const upsertResult = await supabase
          .from('user_profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single();
        
        data = upsertResult.data;
        error = upsertResult.error;
      }
    } catch (upsertError: any) {
      console.error('Error in user profile upsert:', upsertError);
      error = upsertError;
    }

    if (error) {
      console.error('Error upserting user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('User profile upserted successfully:', data);
    
    // Ensure referral code exists for all users (new and existing)
    console.log('🔍 Checking referral code for user:', userId);
    
    // Always check and create referral code if missing
    {
      try {
        console.log('Ensuring referral code exists for user:', userId);
        
        // First check if referral code already exists
        const { data: existingCodes, error: checkError } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing referral code:', checkError);
        }

        if (existingCodes && existingCodes.length > 0) {
          console.log('Referral code already exists for user:', existingCodes[0].code);
        } else {
          // Use the database function to create referral code (bypasses RLS)
          const { data: createResult, error: createError } = await supabase
            .rpc('create_user_referral_code', {
              p_user_uuid: userId,
              p_custom_code: null
            } as any);

          if (createError) {
            console.error('Error creating referral code via RPC:', createError);
            
            // Fallback: Try direct insert (may fail due to RLS)
            try {
              const referralCode = userId.substring(0, 8).toUpperCase();
              const { error: directError } = await supabase
                .from('referral_codes')
                .insert({
                  user_id: userId,
                  code: referralCode,
                  total_referrals: 0,
                  total_earnings: 0.00,
                  is_active: true
                });

              if (directError) {
                console.error('Direct referral code creation also failed:', directError);
                console.warn('Referral code creation failed due to RLS policies. User can still use the app.');
              } else {
                console.log('Referral code created via direct insert:', referralCode);
              }
            } catch (fallbackError) {
              console.error('Fallback referral code creation failed:', fallbackError);
              console.warn('Referral code creation failed. User can still use the app.');
            }
          } else if (createResult && Array.isArray(createResult) && createResult.length > 0) {
            // Handle table response format: [{success: boolean, message: string, referral_code: string}]
            const result = createResult[0] as { success: boolean; message: string; referral_code: string };
            if (result.success) {
              console.log('Referral code created successfully via RPC:', result.referral_code);
            } else {
              console.error('Referral code creation failed:', result.message);
              console.warn('Referral code creation failed. User can still use the app.');
            }
          } else {
            console.log('Referral code created successfully via RPC (no result data)');
          }
        }
      } catch (referralError) {
        console.error('Error creating referral code for new user:', referralError);
        console.warn('Referral code creation failed. User can still use the app.');
      }
      
      // Create default exam stats for new users
      try {
        console.log('Creating default exam stats for new user:', userId);
        
        const { error: statsError } = await supabase
          .rpc('create_all_default_exam_stats', { p_user_id: userId });

        if (statsError) {
          console.error('Error creating exam stats:', statsError);
        } else {
          console.log('Default exam stats created successfully');
        }
      } catch (statsError) {
        console.error('Error creating exam stats for new user:', statsError);
      }
    }
    
    return { 
      success: true, 
      data: { id: userId, phone }, 
      isNewUser: false // This will be determined by phone existence check
    };
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Check if user exists (for phone-based auth, we don't need PIN check)
export const checkUserStatus = async (phone: string) => {
  try {
    console.log('Checking user status for phone:', phone);
    
    // Check local cache first
    const cacheKey = `user_status_${phone}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      const now = Date.now();
      if (now - data.timestamp < 300000) { // 5 minutes cache
        console.log('Using cached user status:', data);
        return { success: true, data: data.user, exists: data.exists };
      }
    }
    
    // Check if phone exists in database
    const phoneCheck = await checkPhoneExists(phone);
    
    // Cache the result
    const cacheData = {
      user: phoneCheck.data,
      exists: phoneCheck.exists,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    return { 
      success: true, 
      data: phoneCheck.data, 
      exists: phoneCheck.exists 
    };
  } catch (error: any) {
    console.error('Error checking user status:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
    
    // Clear local storage
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('isAuthenticated');
    
    // Clear user status cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user_status_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('User logged out successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return null;
  }
};
