import { useState, useEffect } from 'react';
import { 
  getCurrentAuthUser, 
  getCurrentUserId, 
  isUserAuthenticated, 
  signOutUser 
} from '@/lib/supabaseAuth';

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
        if (isUserAuthenticated()) {
          const authUser = await getCurrentAuthUser();
          if (authUser) {
            setUser(authUser);
            setIsAuthenticated(true);
          } else {
            // Clear invalid auth state
            localStorage.clear();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
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

  const getUserId = () => {
    return getCurrentUserId();
  };

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