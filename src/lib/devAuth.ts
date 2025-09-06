// Development authentication bypass for when Firebase permissions are not configured

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { supabase } from '@/integrations/supabase/client';

export interface DevUser {
  uid: string;
  phone: string;
  pin?: string;
  createdAt: any;
  updatedAt: any;
}

// Local storage key for dev users
const DEV_USERS_KEY = 'examace_dev_users';

// Get dev users from localStorage
const getDevUsersFromStorage = (): Record<string, DevUser> => {
  try {
    const stored = localStorage.getItem(DEV_USERS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading dev users from localStorage:', error);
    return {};
  }
};

// Save dev users to localStorage
const saveDevUsersToStorage = (users: Record<string, DevUser>): void => {
  try {
    localStorage.setItem(DEV_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving dev users to localStorage:', error);
  }
};

// Create or update a mock user for development
export const createDevUser = async (phone: string, pin?: string): Promise<DevUser> => {
  console.log('Creating dev user for phone:', phone, 'with pin:', pin);
  
  // In development mode, use localStorage for auth bypass but also store in Supabase
  const users = getDevUsersFromStorage();
  const existingUser = users[phone];
  
  if (existingUser) {
    // Update existing user
    const updatedUser = {
      ...existingUser,
      pin,
      updatedAt: new Date().toISOString()
    };
    users[phone] = updatedUser;
    saveDevUsersToStorage(users);
    
    // Also update in Supabase
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: updatedUser.uid,
          email: phone + '@example.com',
          phone: phone,
          pin: pin,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.warn('Failed to update user in Supabase:', error);
      } else {
        console.log('Updated user in Supabase successfully');
      }
    } catch (error) {
      console.warn('Error updating user in Supabase:', error);
    }
    
    // Set authentication state in localStorage
    localStorage.setItem('userId', updatedUser.uid);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('isAuthenticated', 'true');
    if (pin) {
      localStorage.setItem('pinSet', 'true');
    }
    
    console.log('Updated existing dev user:', updatedUser);
    return updatedUser;
  } else {
    // Create new user
    const newUser: DevUser = {
      uid: `dev_${phone}_${Date.now()}`,
      phone: `+91${phone}`,
      pin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users[phone] = newUser;
    saveDevUsersToStorage(users);
    
    // Also store in Supabase
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: newUser.uid,
          email: phone + '@example.com',
          phone: phone,
          pin: pin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.warn('Failed to create user in Supabase:', error);
      } else {
        console.log('Created user in Supabase successfully');
      }
    } catch (error) {
      console.warn('Error creating user in Supabase:', error);
    }
    
    // Set authentication state in localStorage
    localStorage.setItem('userId', newUser.uid);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('isAuthenticated', 'true');
    if (pin) {
      localStorage.setItem('pinSet', 'true');
    }
    
    console.log('Created new dev user:', newUser);
    return newUser;
  }
};

// Get dev user by phone
export const getDevUserByPhone = async (phone: string): Promise<DevUser | null> => {
  console.log('Getting dev user for phone:', phone);
  
  // First check localStorage
  const users = getDevUsersFromStorage();
  let user = users[phone] || null;
  
  // If not found in localStorage, try to get from Supabase
  if (!user) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (data && !error) {
        // Convert Supabase data to DevUser format
        user = {
          uid: data.id,
          phone: `+91${data.phone}`,
          pin: data.pin,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        // Store in localStorage for future use
        users[phone] = user;
        saveDevUsersToStorage(users);
        
        console.log('Retrieved user from Supabase:', user);
      } else if (error) {
        console.warn('Error retrieving user from Supabase:', error);
      }
    } catch (error) {
      console.warn('Error checking Supabase for user:', error);
    }
  }
  
  console.log('Found dev user:', user);
  return user;
};

// Verify dev user PIN
export const verifyDevUserPIN = async (phone: string, pin: string): Promise<boolean> => {
  console.log('Verifying PIN for phone:', phone);
  
  const user = await getDevUserByPhone(phone);
  const isValid = user?.pin === pin;
  
  console.log('PIN verification result:', { user: !!user, isValid, userPin: user?.pin, providedPin: pin });
  
  if (isValid && user) {
    // Set authentication state in localStorage
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('pinSet', 'true');
    
    console.log('Authentication state set for verified user');
  }
  
  return isValid;
};

// Update existing user PIN
export const updateDevUserPIN = async (phone: string, pin: string): Promise<boolean> => {
  console.log('Updating PIN for phone:', phone);
  
  try {
    const users = getDevUsersFromStorage();
    const user = users[phone];
    if (user) {
      const updatedUser = {
        ...user,
        pin,
        updatedAt: new Date().toISOString()
      };
      users[phone] = updatedUser;
      saveDevUsersToStorage(users);
      
      // Also update in Supabase
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            pin: pin,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.uid);
        
        if (error) {
          console.warn('Failed to update PIN in Supabase:', error);
        } else {
          console.log('PIN updated in Supabase successfully');
        }
      } catch (error) {
        console.warn('Error updating PIN in Supabase:', error);
      }
      
      // Set authentication state in localStorage
      localStorage.setItem('userId', updatedUser.uid);
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('pinSet', 'true');
      
      console.log('PIN updated successfully for dev user');
      return true;
    }
  } catch (error) {
    console.error('Error updating dev user PIN in localStorage:', error);
  }
  
  console.log('No user found to update PIN');
  return false;
};

// Clear all dev users from localStorage (for testing)
export const clearDevUsers = (): void => {
  try {
    localStorage.removeItem(DEV_USERS_KEY);
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('pinSet');
    console.log('Dev users and authentication state cleared from localStorage');
  } catch (error) {
    console.error('Error clearing dev users:', error);
  }
};

// Check if we should use dev authentication
export const shouldUseDevAuth = (): boolean => {
  return import.meta.env.DEV || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost');
};

// Check if user is authenticated (dev auth version)
export const isDevUserAuthenticated = (): boolean => {
  if (!shouldUseDevAuth()) {
    return false;
  }
  
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId');
  
  // If we have authentication state, check if user exists in dev storage
  if (isAuthenticated && userId) {
    const users = getDevUsersFromStorage();
    const phone = localStorage.getItem('userPhone');
    return phone ? users[phone] !== undefined : false;
  }
  
  return false;
};

// Test function for debugging (available in browser console)
if (typeof window !== 'undefined') {
  (window as any).testDevAuth = {
    createUser: createDevUser,
    getUser: getDevUserByPhone,
    updatePIN: updateDevUserPIN,
    verifyPIN: verifyDevUserPIN,
    clearUsers: clearDevUsers,
    shouldUseDev: shouldUseDevAuth,
    isAuthenticated: isDevUserAuthenticated,
    checkAuth: () => {
      console.log('Auth State:', {
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        userId: localStorage.getItem('userId'),
        userPhone: localStorage.getItem('userPhone'),
        pinSet: localStorage.getItem('pinSet')
      });
    },
    setAuth: (phone: string) => {
      const userId = `dev_${phone}_${Date.now()}`;
      localStorage.setItem('userId', userId);
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('pinSet', 'true');
      console.log('Auth state set manually for phone:', phone);
    },
    testLocalStorage: () => {
      console.log('Testing localStorage...');
      const testKey = 'test_key';
      const testValue = 'test_value';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      console.log('localStorage test result:', retrieved === testValue ? 'PASS' : 'FAIL');
      return retrieved === testValue;
    },
    testFullFlow: async (phone: string, pin: string) => {
      console.log('🧪 Testing full authentication flow...');
      console.log('Phone:', phone, 'PIN:', pin);
      
      // Step 1: Clear everything
      clearDevUsers();
      console.log('✅ Step 1: Cleared all data');
      
      // Step 2: Create user
      const user = await createDevUser(phone, pin);
      console.log('✅ Step 2: Created user:', user);
      
      // Step 3: Check auth state
      const authState = {
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        userId: localStorage.getItem('userId'),
        userPhone: localStorage.getItem('userPhone'),
        pinSet: localStorage.getItem('pinSet')
      };
      console.log('✅ Step 3: Auth state:', authState);
      
      // Step 4: Verify PIN
      const pinValid = await verifyDevUserPIN(phone, pin);
      console.log('✅ Step 4: PIN verification:', pinValid ? 'PASS' : 'FAIL');
      
      // Step 5: Get user
      const retrievedUser = await getDevUserByPhone(phone);
      console.log('✅ Step 5: Retrieved user:', retrievedUser);
      
      // Step 6: Check final auth state
      const finalAuthState = {
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        userId: localStorage.getItem('userId'),
        userPhone: localStorage.getItem('userPhone'),
        pinSet: localStorage.getItem('pinSet')
      };
      console.log('✅ Step 6: Final auth state:', finalAuthState);
      
      const allPassed = pinValid && !!retrievedUser && finalAuthState.isAuthenticated === 'true';
      console.log('🎯 Full flow test result:', allPassed ? 'PASS' : 'FAIL');
      
      return allPassed;
    }
  };
}
