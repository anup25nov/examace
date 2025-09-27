// Supabase phone authentication service with custom OTP
import { supabase } from '@/integrations/supabase/client';
import { databaseOTPService } from './databaseOTPService';

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
        isNewUser
      });
      
      // Generate a user ID (since we're not using Supabase auth anymore)
      const userId = result.data?.userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create or update user profile
      const profileResult = await createOrUpdateUserProfile(userId, formattedPhone);
      
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

// Create or update user profile in Supabase using direct approach
export const createOrUpdateUserProfile = async (userId: string, phone: string) => {
  try {
    console.log('Creating/updating user profile for:', { userId, phone });
    
    // Check if user profile already exists to determine if this is a new user
    let isNewUser = false;
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, phone, created_at')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        return { success: false, error: checkError.message };
      }

      // If no data returned, this is a new user
      if (!existingProfile) {
        console.log('No existing profile found - this is a NEW user');
        isNewUser = true;
      } else {
        console.log('Existing profile found - this is an EXISTING user:', existingProfile);
        
        // Additional check: if profile was created very recently (within last 30 seconds), 
        // it might be a new user that was created by a database trigger
        const profileCreatedAt = new Date(existingProfile.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - profileCreatedAt.getTime();
        const isVeryRecent = timeDiff < 30000; // 30 seconds
        
        console.log('Profile creation time check:', {
          profileCreatedAt: profileCreatedAt.toISOString(),
          now: now.toISOString(),
          timeDiffMs: timeDiff,
          isVeryRecent
        });
        
        if (isVeryRecent) {
          console.log('Profile was created very recently - checking if truly new user...');
          
          // Additional check: see if user has any activity (exam stats, referrals, etc.)
          try {
            const { data: examStats, error: examError } = await supabase
              .from('exam_stats')
              .select('id')
              .eq('user_id', userId)
              .limit(1);
            
            const { data: referralTransactions, error: transactionError } = await supabase
              .from('referral_transactions')
              .select('id')
              .eq('referrer_id', userId)
              .limit(1);
            
            const hasActivity = (examStats && examStats.length > 0) || 
                              (referralTransactions && referralTransactions.length > 0);
            
            console.log('User activity check:', {
              hasActivity,
              examStats: examStats?.length || 0,
              referralTransactions: referralTransactions?.length || 0
            });
            
            if (!hasActivity) {
              console.log('No user activity found - confirming as NEW user');
              isNewUser = true;
            } else {
              console.log('User activity found - treating as EXISTING user');
              isNewUser = false;
            }
          } catch (activityError) {
            console.error('Error checking user activity:', activityError);
            // If we can't check, assume it's a new user
            isNewUser = true;
          }
        }
        
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

    // Use a safer approach to handle user profile creation
    let data, error;
    
    try {
      // First, check if user profile already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, phone')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        error = checkError;
      } else if (existingUser) {
        // User already exists, just update if needed
        console.log('User profile already exists, updating...');
        const updateResult = await supabase
          .from('user_profiles')
          .update({
            phone: phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();
        
        data = updateResult.data;
        error = updateResult.error;
        isNewUser = false;
      } else {
        // User doesn't exist, create new profile
        console.log('Creating new user profile...');
        const insertResult = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
      }
      
    } catch (upsertError: any) {
      console.error('Error in user profile operations:', upsertError);
      error = upsertError;
    }

    if (error) {
      console.error('Error upserting user profile:', error);
      return { success: false, error: error.message };
    }

    // Only create referral code for new users (not on every login)
    if (isNewUser) {
      try {
        const { data: existingReferral, error: checkReferralError } = await supabase
          .from('referral_codes')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (checkReferralError) {
          console.error('Error checking existing referral code:', checkReferralError);
        } else if (!existingReferral) {
          const referralCode = userId.substring(0, 8).toUpperCase();
          const { error: referralError } = await supabase
            .from('referral_codes')
            .insert({
              user_id: userId,
              code: referralCode,
              total_referrals: 0,
              total_earnings: 0.00
            });

          if (referralError) {
            console.error('Error creating referral code:', referralError);
          } else {
            console.log('Referral code created for new user:', referralCode);
          }
        }
      } catch (referralError) {
        console.error('Error creating referral code for new user:', referralError);
      }
    }

    // Try to create default exam stats (only for brand new users)
    if (isNewUser) {
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

    console.log('Final profile creation result:', {
      success: true,
      userId,
      phone,
      isNewUser
    });
    
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