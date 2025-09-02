import { useState, useEffect } from 'react';
import { getCurrentUserId, isUserAuthenticated, getCurrentAuthUser, signOutUser } from '@/lib/firebaseAuth';
import type { AuthUser } from '@/lib/firebaseAuth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = isUserAuthenticated();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const currentUser = await getCurrentAuthUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getUserId = () => {
    return getCurrentUserId();
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentAuthUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    getUserId,
    refreshUser
  };
};