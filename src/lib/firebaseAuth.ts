import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AuthUser {
  id: string;
  phone: string;
  pin?: string;
  createdAt: any;
  updatedAt: any;
}

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

// Initialize reCAPTCHA for phone auth with better error handling
export const initializeRecaptcha = () => {
  try {
    // Clear existing verifier
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      console.error('reCAPTCHA container not found');
      return null;
    }

    console.log('Initializing reCAPTCHA verifier...');
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA solved successfully:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired, clearing verifier');
        recaptchaVerifier = null;
      }
    });

    console.log('reCAPTCHA verifier initialized successfully');
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
};

// Development mode check
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Mock OTP for development
const MOCK_OTP = '123456';
let mockConfirmationResult: any = null;

// Send OTP to phone number with improved error handling
export const sendOTPCode = async (phone: string) => {
  try {
    console.log('Starting OTP send process for phone:', phone);
    
    // Use mock authentication in development if Firebase billing isn't configured
    if (isDevelopment) {
      console.log('Development mode: Using mock OTP authentication');
      mockConfirmationResult = {
        confirm: async (otp: string) => {
          if (otp === MOCK_OTP) {
            return {
              user: {
                uid: `mock_${phone}`,
                phoneNumber: `+91${phone}`
              }
            };
          } else {
            throw new Error('Invalid OTP');
          }
        }
      };
      confirmationResult = mockConfirmationResult;
      return { 
        success: true, 
        data: mockConfirmationResult,
        isDevelopment: true,
        mockOTP: MOCK_OTP
      };
    }
    
    const verifier = initializeRecaptcha();
    if (!verifier) {
      throw new Error('Failed to initialize reCAPTCHA verifier');
    }

    const phoneNumber = `+91${phone}`;
    console.log('Formatted phone number:', phoneNumber);
    
    console.log('Calling Firebase signInWithPhoneNumber...');
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    
    console.log('OTP sent successfully, confirmation result received');
    return { success: true, data: confirmationResult };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Clear the verifier on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    
    // Provide more specific error messages and fallback to mock in development
    let errorMessage = 'Failed to send OTP';
    if (error.code === 'auth/billing-not-enabled') {
      if (isDevelopment) {
        console.log('Billing not enabled, falling back to mock authentication');
        mockConfirmationResult = {
          confirm: async (otp: string) => {
            if (otp === MOCK_OTP) {
              return {
                user: {
                  uid: `mock_${phone}`,
                  phoneNumber: `+91${phone}`
                }
              };
            } else {
              throw new Error('Invalid OTP');
            }
          }
        };
        confirmationResult = mockConfirmationResult;
        return { 
          success: true, 
          data: mockConfirmationResult,
          isDevelopment: true,
          mockOTP: MOCK_OTP
        };
      }
      errorMessage = 'Phone authentication billing is not enabled. Please enable billing in Firebase Console and configure phone authentication.';
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Invalid phone number format.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Verify OTP code
export const verifyOTPCode = async (otp: string) => {
  try {
    console.log('Verifying OTP:', otp);
    
    if (!confirmationResult) {
      throw new Error('No OTP request found. Please request OTP first.');
    }

    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    
    if (user) {
      console.log('OTP verified successfully');
      
      // Store user data in Firestore
      const userDoc = doc(db, 'users', user.uid);
      const phone = user.phoneNumber?.replace('+91', '') || '';
      
      await setDoc(userDoc, {
        id: user.uid,
        phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Also create a lookup doc by phone number
      await setDoc(doc(db, 'users_by_phone', phone), {
        userId: user.uid,
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Store in localStorage
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Clear confirmation result
      confirmationResult = null;
      
      return { success: true, data: user };
    }
    
    throw new Error('Authentication failed');
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    confirmationResult = null;
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

// Set 6-digit PIN for user
export const setUserPIN = async (pin: string) => {
  try {
    console.log('Setting PIN for user');
    
    if (pin.length !== 6) {
      throw new Error('PIN must be exactly 6 digits');
    }

    const userId = localStorage.getItem('userId');
    const phone = localStorage.getItem('userPhone');
    
    if (!userId || !phone) {
      throw new Error('No authenticated user found');
    }

    // Update user document
    const userDoc = doc(db, 'users', userId);
    await updateDoc(userDoc, {
      pin,
      updatedAt: serverTimestamp()
    });

    // Update lookup document
    const phoneDoc = doc(db, 'users_by_phone', phone);
    await updateDoc(phoneDoc, {
      pin,
      updatedAt: serverTimestamp()
    });
    
    localStorage.setItem('pinSet', 'true');
    
    console.log('PIN set successfully');
    return { success: true, data: { pin } };
  } catch (error: any) {
    console.error('Error setting PIN:', error);
    return { success: false, error: error.message || 'Failed to set PIN' };
  }
};

// Verify PIN for login
export const verifyUserPIN = async (phone: string, pin: string) => {
  try {
    console.log('Verifying PIN for phone:', phone);
    
    if (pin.length !== 6) {
      throw new Error('PIN must be exactly 6 digits');
    }

    // Query users by phone number
    const usersRef = doc(db, 'users_by_phone', phone);
    const userDoc = await getDoc(usersRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    
    if (userData.pin !== pin) {
      return { success: false, error: 'Invalid PIN' };
    }
    
    // Store authentication data
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('pinSet', 'true');
    
    console.log('PIN verified successfully');
    return { success: true, data: userData };
  } catch (error: any) {
    console.error('Error verifying PIN:', error);
    return { success: false, error: error.message || 'Failed to verify PIN' };
  }
};

// Check if user exists and has PIN set
export const checkUserStatus = async (phone: string) => {
  try {
    console.log('Checking user status for phone:', phone);
    
    // Add a small delay to prevent conflicts with Lovable messaging
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const usersRef = doc(db, 'users_by_phone', phone);
    const userDoc = await getDoc(usersRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data found:', { exists: true, hasPin: !!userData.pin });
      return {
        exists: true,
        hasPin: !!userData.pin && userData.pin.length === 6,
        data: userData
      };
    }
    
    console.log('User not found');
    return { exists: false, hasPin: false, data: null };
  } catch (error: any) {
    console.error('Error checking user status:', error);
    // Return safe defaults on error
    return { exists: false, hasPin: false, data: null };
  }
};

// Get current authenticated user
export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.log('No user ID in localStorage');
      return null;
    }
    
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    
    if (docSnap.exists()) {
      return docSnap.data() as AuthUser;
    }
    
    console.log('User document not found');
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

// Check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Sign out user
export const signOutUser = async () => {
  try {
    console.log('Signing out user');
    
    await auth.signOut();
    localStorage.clear();
    
    // Clear reCAPTCHA verifier
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    
    confirmationResult = null;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { success: false, error: error.message || 'Failed to sign out' };
  }
};

// Update PIN
export const updateUserPIN = async (phone: string, newPin: string) => {
  try {
    console.log('Updating PIN for phone:', phone);
    
    if (newPin.length !== 6) {
      throw new Error('PIN must be exactly 6 digits');
    }

    const usersRef = doc(db, 'users_by_phone', phone);
    await updateDoc(usersRef, {
      pin: newPin,
      updatedAt: serverTimestamp()
    });
    
    console.log('PIN updated successfully');
    return { success: true, data: { pin: newPin } };
  } catch (error: any) {
    console.error('Error updating PIN:', error);
    return { success: false, error: error.message || 'Failed to update PIN' };
  }
};
