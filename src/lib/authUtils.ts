// Authentication Utilities
// Helper functions for managing authentication state and preventing infinite loops

/**
 * Clear all authentication-related data from localStorage
 */
export const clearAllAuthData = () => {
  try {
    console.log('Clearing all authentication data...');
    
    // Clear all auth-related keys
    const authKeys = [
      'userId',
      'userPhone',
      'isAuthenticated',
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase.auth.refresh_token',
      'supabase.auth.access_token',
      'lastVisitDate'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any keys that might contain auth data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('user') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset global auth state
    (window as any).authCheckInProgress = false;
    
    console.log('All authentication data cleared successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error clearing authentication data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if auth check is in progress
 */
export const isAuthCheckInProgress = (): boolean => {
  return !!(window as any).authCheckInProgress;
};

/**
 * Set auth check in progress flag
 */
export const setAuthCheckInProgress = (inProgress: boolean) => {
  (window as any).authCheckInProgress = inProgress;
};

/**
 * Get auth state from localStorage
 */
export const getAuthState = () => {
  return {
    userId: localStorage.getItem('userId'),
    userPhone: localStorage.getItem('userPhone'),
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true'
  };
};

/**
 * Set auth state in localStorage
 */
export const setAuthState = (userId: string, userPhone: string) => {
  localStorage.setItem('userId', userId);
  localStorage.setItem('userPhone', userPhone);
  localStorage.setItem('isAuthenticated', 'true');
};

/**
 * Clear auth state from localStorage
 */
export const clearAuthState = () => {
  localStorage.removeItem('userId');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('isAuthenticated');
};

/**
 * Debounce function to prevent rapid auth checks
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to limit auth checks
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
