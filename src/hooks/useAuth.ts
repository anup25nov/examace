import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentAuthUser, 
  getCurrentUserId, 
  isUserAuthenticated, 
  signOutUser,
  clearRefreshTokens,
  AuthUser
} from '@/lib/supabaseAuth';
import { supabaseStatsService } from '@/lib/supabaseStats';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentISTDate, isTodayIST, isYesterdayIST } from '@/lib/timeUtils';
import { 
  clearAllAuthData, 
  isAuthCheckInProgress, 
  setAuthCheckInProgress,
  debounce 
} from '@/lib/authUtils';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    if (isAuthCheckInProgress()) {
      return;
    }
    
    // If auth is already checked, don't run again
    if (authChecked) {
      return;
    }
    
    setAuthCheckInProgress(true);
    
    const checkAuthStatus = async () => {
      try {
        
        // For phone-based auth, we primarily rely on localStorage
        // Check localStorage first for faster response
        const isAuth = isUserAuthenticated();
        
        if (isAuth) {
          // User is authenticated via localStorage, get user data
          const authUser = await getCurrentAuthUser();
          
          if (authUser) {
            setUser(authUser);
            setIsAuthenticated(true);
            
            // Update daily visit streak (only once per day in IST)
            try {
              // Use IST date for streak calculations
              const todayIST = getCurrentISTDate();
              const lastVisitDate = localStorage.getItem('lastVisitDate');
              
              
              if (!isTodayIST(lastVisitDate || '')) {
                // Check if streak should be reset (if last visit was not yesterday in IST)
                if (lastVisitDate && !isYesterdayIST(lastVisitDate)) {
                  // Reset streak in localStorage
                  localStorage.removeItem(`streak_${authUser.id}`);
                }
                
                const result = await supabaseStatsService.updateDailyVisit();
                
                if (result.success && result.data) {
                  // Update streak data in localStorage
                  localStorage.setItem(`streak_${authUser.id}`, JSON.stringify({
                    current_streak: result.data.current_streak || 0,
                    longest_streak: result.data.longest_streak || 0
                  }));
                }
                
                localStorage.setItem('lastVisitDate', todayIST);
              } else {
              }
            } catch (error) {
              console.error('Error updating daily visit:', error);
            }
          } else {
            // User data not found, clear auth state
            console.warn('🔍 [useAuth] Auth user not found, clearing auth state');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // User not authenticated, clear state
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error checking auth status:', error);
        
        // Handle refresh token errors specifically
        if (error?.message && error.message.includes('Refresh Token')) {
          console.log('Refresh token error detected, clearing all auth data');
          clearAllAuthData();
        }
        
        // Don't auto-logout on error, just set as not authenticated
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
        setAuthCheckInProgress(false); // Reset the flag
      }
    };

    // Add timeout to prevent infinite loading (reduced to 5 seconds)
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timeout, setting loading to false');
        setLoading(false);
        setAuthChecked(true);
        setAuthCheckInProgress(false);
      }
    }, 5000);

    checkAuthStatus();
    
    // Note: Session refresh removed for phone-based authentication
    // Phone-based auth doesn't use Supabase sessions, so no refresh needed
    
    return () => {
      setAuthCheckInProgress(false); // Reset the flag
      clearTimeout(timeoutId);
    };
  }, []); // Remove dependencies to prevent infinite loops

  // Additional safety mechanism - force loading to false after 5 seconds
  useEffect(() => {
    const forceLoadingFalse = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(forceLoadingFalse);
  }, []); // Only run once on mount

  const logout = async () => {
    try {
      // For phone-based auth, we only need to clear localStorage
      // No need to call Supabase auth.signOut() as we don't use sessions
      await signOutUser();
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getUserId = useCallback(() => {
    return getCurrentUserId();
  }, []);

  const refreshUser = async () => {
    try {
      if (isUserAuthenticated()) {
        const authUser = await getCurrentAuthUser();
        setUser(authUser);
        setIsAuthenticated(!!authUser);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const resetAuth = () => {
    setAuthChecked(false);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(true);
    setAuthCheckInProgress(false);
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    getUserId,
    refreshUser,
    resetAuth
  };
};