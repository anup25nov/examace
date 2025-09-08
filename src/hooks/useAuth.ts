import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentAuthUser, 
  getCurrentUserId, 
  isUserAuthenticated, 
  signOutUser 
} from '@/lib/supabaseAuth';
import { supabaseStatsService } from '@/lib/supabaseStats';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: any;
  updatedAt: any;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('Checking auth status...');
        
        const isAuth = isUserAuthenticated();
        console.log('isUserAuthenticated result:', isAuth);
        
        if (isAuth) {
          const authUser = await getCurrentAuthUser();
          console.log('getCurrentAuthUser result:', authUser);
          if (authUser) {
            setUser(authUser);
            setIsAuthenticated(true);
            
            // Update daily visit streak (only once per day)
            try {
              // Use UTC date for consistency with database
              const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
              const lastVisitDate = localStorage.getItem('lastVisitDate');
              
              console.log('Streak check - Today:', today, 'Last visit:', lastVisitDate);
              
              if (lastVisitDate !== today) {
                const result = await supabaseStatsService.updateDailyVisit();
                console.log('Daily visit update result:', result);
                localStorage.setItem('lastVisitDate', today);
                console.log('Daily visit updated for:', today);
              } else {
                console.log('Daily visit already updated today');
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
      await signOutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
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