// Simplified Supabase phone authentication service
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

// Send OTP to phone using Supabase
export const sendOTPCode = async (phone: string) => {
  try {
    console.log('Starting OTP send process for phone:', phone);
    
    // Ensure phone number is in international format
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP';
      
      if (error.message?.includes('Invalid phone')) {
        errorMessage = 'Invalid phone number format.';
      } else if (error.message?.includes('too many requests')) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }

    console.log('OTP sent successfully to phone');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
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

// Verify OTP code using Supabase
export const verifyOTPCode = async (phone: string, otp: string) => {
  try {
    console.log('Verifying OTP for phone:', phone);
    
    // Ensure phone number is in international format
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms'
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message || 'Invalid OTP' };
    }

    if (data.user) {
      console.log('OTP verified successfully');
      
      // Check if phone number already exists in database
      const phoneCheck = await checkPhoneExists(phone);
      const isNewUser = !phoneCheck.exists;
      
      console.log('Phone existence check result:', {
        phone: formattedPhone,
        exists: phoneCheck.exists,
        isNewUser
      });
      
      // Create or update user profile
      const profileResult = await createOrUpdateUserProfile(data.user.id, formattedPhone, isNewUser);
      
      // Store authentication data for persistence
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userPhone', formattedPhone);
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('Authentication data stored:', {
        userId: data.user.id,
        phone: formattedPhone,
        isAuthenticated: 'true',
        isNewUser
      });
      
      return { 
        success: true, 
        data: data.user, 
        isNewUser 
      };
    }
    
    return { success: false, error: 'Authentication failed' };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
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

    // Use upsert to create or update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('User profile upserted successfully:', data);
    
    // Create referral code for new users
    if (isNewUser) {
      try {
        console.log('Creating referral code for new user:', userId);
        
        // Check if referral code already exists
        const { data: existingReferral, error: checkError } = await supabase
          .from('referral_codes')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing referral code:', checkError);
        } else if (!existingReferral) {
          // Generate referral code from user ID
          const referralCode = userId.substring(0, 8).toUpperCase();
          
          const { error: referralError } = await supabase
            .from('referral_codes')
            .insert({
              user_id: userId,
              code: referralCode,
              total_referrals: 0,
              total_earnings: 0.00,
              is_active: true
            });

          if (referralError) {
            console.error('Error creating referral code:', referralError);
          } else {
            console.log('Referral code created successfully:', referralCode);
          }
        } else {
          console.log('Referral code already exists for user');
        }
      } catch (referralError) {
        console.error('Error creating referral code for new user:', referralError);
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
