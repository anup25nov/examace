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

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status...');
        
        // First check if we have a valid Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Session error (likely invalid refresh token):', sessionError.message);
          // Clear invalid session data
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('lastVisitDate');
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        const isAuth = isUserAuthenticated();
        console.log('isUserAuthenticated result:', isAuth);
        
        if (isAuth && session) {
          const authUser = await getCurrentAuthUser();
          console.log('getCurrentAuthUser result:', authUser);
          if (authUser) {
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
            // Token might be expired - check and refresh if possible
            console.warn('Auth user not found, checking token expiry');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Don't auto-logout on error, just set as not authenticated
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timeout, setting loading to false');
        setLoading(false);
      }
    }, 5000);

    checkAuthStatus();
    
    return () => clearTimeout(timeoutId);
  }, []);

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