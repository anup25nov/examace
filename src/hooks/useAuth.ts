import { useSupabaseAuth } from './useSupabaseAuth';
import { getCurrentUserId, isUserAuthenticated, getCurrentAuthUser, signOutUser } from '@/lib/firebaseAuth';

export const useAuth = () => {
  const supabaseAuth = useSupabaseAuth();
  
  // Fallback to Firebase auth if Supabase auth not available
  const getUserId = () => {
    return supabaseAuth.getUserId() || getCurrentUserId();
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
      // Fallback to Firebase logout
      try {
        await signOutUser();
      } catch (firebaseError) {
        console.error('Firebase logout error:', firebaseError);
      }
    }
  };

  return {
    user: supabaseAuth.user,
    isLoading: supabaseAuth.loading,
    isAuthenticated: supabaseAuth.isAuthenticated,
    logout,
    getUserId,
    refreshUser: () => Promise.resolve() // Not needed with Supabase real-time auth
  };
};