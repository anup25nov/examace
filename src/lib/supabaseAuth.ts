// Supabase phone authentication service
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
      
      // Create or update user profile in Supabase
      const profileResult = await createOrUpdateUserProfile(data.user.id, formattedPhone);
      console.log('Profile creation result:', profileResult);
      
      // Store authentication data for persistence
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userPhone', formattedPhone);
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('Authentication data stored:', {
        userId: data.user.id,
        phone: formattedPhone,
        isAuthenticated: 'true'
      });
      
      return { 
        success: true, 
        data: data.user, 
        isNewUser: profileResult.isNewUser || false 
      };
    }
    
    return { success: false, error: 'Authentication failed' };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Create or update user profile in Supabase using direct approach
export const createOrUpdateUserProfile = async (userId: string, phone: string) => {
  try {
    console.log('Creating/updating user profile for:', { userId, phone });
    
    // Check if user profile already exists to determine if this is a new user
    let isNewUser = false;
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, phone')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        return { success: false, error: checkError.message };
      }

      // If no data returned, this is a new user
      if (!existingProfile) {
        isNewUser = true;
      } else {
        // Check if phone has changed (this shouldn't happen in normal flow)
        if (existingProfile.phone !== phone) {
          console.warn('Phone mismatch detected:', { 
            existing: existingProfile.phone, 
            new: phone 
          });
        }
      }
    } catch (checkError) {
      console.error('Error in profile check:', checkError);
      isNewUser = true;
    }

    const profileData: any = {
      id: userId,
      phone: phone,
      updated_at: new Date().toISOString()
    };

    // Use a direct approach to handle phone conflicts
    let data, error;
    
    try {
      // First, try to delete any existing records with this phone (except current user)
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('phone', phone)
        .neq('id', userId);

      if (deleteError) {
        console.warn('Error deleting duplicate phones:', deleteError);
        // Continue anyway, the insert might still work
      }

      // Now try to insert the new record
      const insertResult = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();
      
      data = insertResult.data;
      error = insertResult.error;
      
      // If insert fails, try update
      if (error && (error.code === '23505' || error.message.includes('already in use'))) {
        console.log('Insert failed, trying update...');
        const updateResult = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', userId)
          .select()
          .single();
        
        data = updateResult.data;
        error = updateResult.error;
        isNewUser = false;
      }
      
    } catch (upsertError: any) {
      console.error('Error in direct upsert logic:', upsertError);
      error = upsertError;
    }

    if (error) {
      console.error('Error upserting user profile:', error);
      return { success: false, error: error.message };
    }

    // If this is a new user, try to create referral code
    if (isNewUser) {
      try {
        const { data: referralCode, error: referralError } = await supabase
          .rpc('create_user_referral_code', { user_uuid: userId });

        if (referralError) {
          console.error('Error creating referral code:', referralError);
          // Don't fail the entire process if referral code creation fails
        } else {
          console.log('Referral code created for new user:', referralCode);
        }
      } catch (referralError) {
        console.error('Error in referral code creation:', referralError);
        // Don't fail the entire process if referral code creation fails
      }

      // Try to create default exam stats
      try {
        const { error: statsError } = await supabase
          .rpc('create_all_default_exam_stats', { p_user_id: userId });

        if (statsError) {
          console.error('Error creating exam stats:', statsError);
          // Don't fail the entire process if exam stats creation fails
        } else {
          console.log('Default exam stats created for new user');
        }
      } catch (statsError) {
        console.error('Error in exam stats creation:', statsError);
      }
    }

    return { 
      success: true, 
      data: { id: userId, phone }, 
      isNewUser 
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
    const cachedStatus = localStorage.getItem(cacheKey);
    if (cachedStatus) {
      const parsed = JSON.parse(cachedStatus);
      // Cache for 5 minutes
      if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
        console.log('Using cached user status:', parsed.data);
        return parsed.data;
      }
    }
    
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();
    
    if (error || !userProfile) {
      console.log('User not found');
      const result = { exists: false, data: null };
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
      return result;
    }
    
    const result = {
      exists: true,
      data: userProfile
    };
    
    console.log('User data found:', result);
    
    // Cache the result
    localStorage.setItem(cacheKey, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));
    
    return result;
  } catch (error: any) {
    console.error('Error checking user status:', error);
    return { exists: false, data: null };
  }
};

// Note: PIN-based authentication has been removed in favor of OTP-only authentication

// Cache for user profile to prevent infinite loops
let userProfileCache: { [key: string]: { data: AuthUser | null; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear user profile cache
export const clearUserProfileCache = () => {
  userProfileCache = {};
  console.log('User profile cache cleared');
};

// Get current authenticated user
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    // For phone-based authentication, we rely on localStorage
    const userId = localStorage.getItem('userId');
    const userPhone = localStorage.getItem('userPhone');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    console.log('getCurrentAuthUser - localStorage check:', {
      userId: !!userId,
      userPhone: !!userPhone,
      isAuthenticated
    });
    
    if (userId && userPhone && isAuthenticated === 'true') {
      // Check cache first
      const cacheKey = `${userId}-${userPhone}`;
      const cached = userProfileCache[cacheKey];
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('✅ Using cached user profile (preventing infinite loop)');
        return cached.data;
      }
      
      
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully
      
      if (userProfile && !error) {
        console.log('User profile found:', userProfile);
        const authUser = {
          id: userProfile.id,
          phone: userProfile.phone,
          createdAt: userProfile.created_at,
          updatedAt: userProfile.updated_at
        };
        
        // Cache the result
        userProfileCache[cacheKey] = {
          data: authUser,
          timestamp: Date.now()
        };
        
        return authUser;
      } else if (error) {
        console.log('User profile not found or error:', error.message);
        // Cache null result to prevent repeated calls
        userProfileCache[cacheKey] = {
          data: null,
          timestamp: Date.now()
        };
      }
    }
    
    console.log('No valid user found in localStorage or database');
    return null;
  } catch (error: any) {
    console.error('Error getting current auth user:', error);
    return null;
  }
};

// Get user ID
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('userId');
};

// Check if user is authenticated (persistent login)
export const isUserAuthenticated = (): boolean => {
  const isAuth = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId');
  const userPhone = localStorage.getItem('userPhone');
  
  console.log('Auth check result:', { isAuth, userId: !!userId, userPhone: !!userPhone });
  return isAuth && !!userId && !!userPhone;
};

// Sign out user (only when explicitly requested)
export const signOutUser = async () => {
  try {
    console.log('Signing out user');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage
    localStorage.clear();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message || 'Failed to sign out' };
  }
};

// Refresh user session (for persistent login)
export const refreshUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update localStorage with fresh data
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userPhone', user.phone || '');
      localStorage.setItem('isAuthenticated', 'true');
      
      return { success: true, user };
    }
    
    return { success: false, error: 'No user found' };
  } catch (error: any) {
    console.error('Error refreshing user:', error);
    return { success: false, error: error.message };
  }
};