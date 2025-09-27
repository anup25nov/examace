import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentAuthUser, 
  getCurrentUserId, 
  isUserAuthenticated, 
  signOutUser,
  AuthUser
} from '@/lib/supabaseAuth';
import { supabaseStatsService } from '@/lib/supabaseStats';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentISTDate, isTodayIST, isYesterdayIST } from '@/lib/timeUtils';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    if ((window as any).authCheckInProgress || authChecked) {
      console.log('Auth check already in progress or completed, skipping...');
      return;
    }
    
    (window as any).authCheckInProgress = true;
    
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 [useAuth] Starting auth status check...');
        
        // For phone-based auth, we primarily rely on localStorage
        // Check localStorage first for faster response
        const isAuth = isUserAuthenticated();
        console.log('🔍 [useAuth] isUserAuthenticated result:', isAuth);
        
        if (isAuth) {
          // User is authenticated via localStorage, get user data
          console.log('🔍 [useAuth] User is authenticated, fetching user data...');
          const authUser = await getCurrentAuthUser();
          console.log('🔍 [useAuth] getCurrentAuthUser result:', authUser);
          
          if (authUser) {
            console.log('🔍 [useAuth] Setting user and authentication state...');
            setUser(authUser);
            setIsAuthenticated(true);
            
            // Update daily visit streak (only once per day in IST)
            try {
              // Use IST date for streak calculations
              const todayIST = getCurrentISTDate();
              const lastVisitDate = localStorage.getItem('lastVisitDate');
              
              console.log('Streak check - Today IST:', todayIST, 'Last visit:', lastVisitDate);
              
              if (!isTodayIST(lastVisitDate || '')) {
                // Check if streak should be reset (if last visit was not yesterday in IST)
                if (lastVisitDate && !isYesterdayIST(lastVisitDate)) {
                  console.log('Streak broken - last visit was not yesterday in IST');
                  // Reset streak in localStorage
                  localStorage.removeItem(`streak_${authUser.id}`);
                }
                
                const result = await supabaseStatsService.updateDailyVisit();
                console.log('Daily visit update result:', result);
                localStorage.setItem('lastVisitDate', todayIST);
                console.log('Daily visit updated for IST:', todayIST);
              } else {
                console.log('Daily visit already updated today in IST');
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
          console.log('🔍 [useAuth] User not authenticated, clearing state');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Don't auto-logout on error, just set as not authenticated
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        console.log('🔍 [useAuth] Auth check completed, setting loading to false');
        setLoading(false);
        setAuthChecked(true);
        (window as any).authCheckInProgress = false; // Reset the flag
      }
    };

    // Add timeout to prevent infinite loading (increased to 10 seconds)
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timeout, setting loading to false');
        setLoading(false);
        setAuthChecked(true);
        (window as any).authCheckInProgress = false;
      }
    }, 10000);

    checkAuthStatus();
    
    // Set up session refresh interval for persistent login
    const refreshInterval = setInterval(async () => {
      try {
        // Only refresh if user is authenticated
        if (isUserAuthenticated()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Refresh session every 30 minutes to maintain login
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.warn('Session refresh failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => {
      (window as any).authCheckInProgress = false; // Reset the flag
      clearTimeout(timeoutId);
      clearInterval(refreshInterval);
    };
  }, [authChecked]);

  const logout = async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
      
      // Then use the custom signOutUser function
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
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    getUserId,
    refreshUser
  };
};