// Supabase email authentication service
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Send OTP to email using Supabase
export const sendOTPCode = async (email: string) => {
  try {
    console.log('Starting OTP send process for email:', email);
    
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + '/auth'
      }
    });

    if (error) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP';
      
      if (error.message?.includes('Invalid email')) {
        errorMessage = 'Invalid email format.';
      } else if (error.message?.includes('too many requests')) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }

    console.log('OTP sent successfully to email');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

// Verify OTP code using Supabase
export const verifyOTPCode = async (email: string, otp: string) => {
  try {
    console.log('Verifying OTP for email:', email);
    
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email'
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message || 'Invalid OTP' };
    }

    if (data.user) {
      console.log('OTP verified successfully');
      
      // Create or update user profile in Supabase
      await createOrUpdateUserProfile(data.user.id, email);
      
      // Store authentication data for persistence
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('isAuthenticated', 'true');
      
      return { success: true, data: data.user };
    }
    
    return { success: false, error: 'Authentication failed' };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Create or update user profile in Supabase
export const createOrUpdateUserProfile = async (userId: string, email: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error creating/updating user profile:', error);
      return { success: false, error: error.message };
    }

    console.log('User profile created/updated successfully');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Check if user exists
export const checkUserStatus = async (email: string) => {
  try {
    console.log('Checking user status for email:', email);
    
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !userProfile) {
      console.log('User not found');
      return { exists: false, data: null };
    }
    
    console.log('User data found:', { exists: true });
    
    return {
      exists: true,
      data: userProfile
    };
  } catch (error: any) {
    console.error('Error checking user status:', error);
    return { exists: false, data: null };
  }
};

// Get current authenticated user
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Fallback to localStorage for persistent login
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      if (userId && userEmail) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userProfile) {
          return {
            id: userProfile.id,
            email: userProfile.email,
            createdAt: userProfile.created_at,
            updatedAt: userProfile.updated_at
          };
        }
      }
      
      return null;
    }
    
    // Get user profile from Supabase
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userProfile) {
      return {
        id: userProfile.id,
        email: userProfile.email,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at
      };
    }
    
    return null;
  } catch (error: any) {
    console.error('Error getting current user:', error);
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
  const userEmail = localStorage.getItem('userEmail');
  
  console.log('Auth check result:', { isAuth, userId: !!userId, userEmail: !!userEmail });
  return isAuth && !!userId && !!userEmail;
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
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('isAuthenticated', 'true');
      
      return { success: true, user };
    }
    
    return { success: false, error: 'No user found' };
  } catch (error: any) {
    console.error('Error refreshing user:', error);
    return { success: false, error: error.message };
  }
};