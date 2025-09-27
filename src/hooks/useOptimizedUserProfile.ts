import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { optimizedApiService } from '@/lib/optimizedApiService';
import type { SupabaseUserProfile } from '@/lib/supabaseStats';

export const useOptimizedUserProfile = () => {
  const [profile, setProfile] = useState<SupabaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('🔍 [useOptimizedUserProfile] Starting profile fetch:', {
        isAuthenticated,
        userId: user?.id,
        timestamp: new Date().toISOString()
      });

      if (!isAuthenticated || !user) {
        console.log('🔍 [useOptimizedUserProfile] Not authenticated or no user, setting profile to null');
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [useOptimizedUserProfile] Calling optimizedApiService.getUserProfileData...');
        // Use optimized API service with extended caching
        const profileData = await optimizedApiService.getUserProfileData(user.id);
        console.log('🔍 [useOptimizedUserProfile] Profile data received:', profileData);
        
        if (profileData?.profile) {
          console.log('🔍 [useOptimizedUserProfile] Setting profile from API data:', profileData.profile);
          setProfile(profileData.profile);
        } else {
          console.log('🔍 [useOptimizedUserProfile] No profile data from API, checking localStorage...');
          // Fallback to localStorage email if no profile exists
          const email = localStorage.getItem("userEmail");
          console.log('🔍 [useOptimizedUserProfile] localStorage email:', email);
          if (email) {
            const fallbackProfile = { 
              id: user.id, 
              email, 
              created_at: '', 
              updated_at: ''
            };
            console.log('🔍 [useOptimizedUserProfile] Setting fallback profile:', fallbackProfile);
            setProfile(fallbackProfile);
          } else {
            console.log('🔍 [useOptimizedUserProfile] No email in localStorage, profile will be null');
          }
        }
      } catch (error) {
        console.error('🔍 [useOptimizedUserProfile] Failed to fetch user profile:', error);
        // Fallback to localStorage email
        const email = localStorage.getItem("userEmail");
        console.log('🔍 [useOptimizedUserProfile] Error fallback - localStorage email:', email);
        if (email) {
          const fallbackProfile = { 
            id: user.id, 
            email, 
            created_at: '', 
            updated_at: ''
          };
          console.log('🔍 [useOptimizedUserProfile] Setting error fallback profile:', fallbackProfile);
          setProfile(fallbackProfile);
        }
      } finally {
        console.log('🔍 [useOptimizedUserProfile] Setting loading to false');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, isAuthenticated]);

  // Method to refresh profile data (useful after profile updates)
  const refreshProfile = async () => {
    if (!user) return;
    
    // Clear cache and refetch
    optimizedApiService.clearProfileCache(user.id);
    
    try {
      setLoading(true);
      const profileData = await optimizedApiService.getUserProfileData(user.id);
      if (profileData?.profile) {
        setProfile(profileData.profile);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refreshProfile };
};
