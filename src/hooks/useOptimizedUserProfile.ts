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
      if (!isAuthenticated || !user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Use optimized API service with extended caching
        const profileData = await optimizedApiService.getUserProfileData(user.id);
        
        if (profileData?.profile) {
          setProfile(profileData.profile);
        } else {
          // Fallback to localStorage email if no profile exists
          const email = localStorage.getItem("userEmail");
          if (email) {
            setProfile({ 
              id: user.id, 
              email, 
              created_at: '', 
              updated_at: ''
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback to localStorage email
        const email = localStorage.getItem("userEmail");
        if (email) {
          setProfile({ 
            id: user.id, 
            email, 
            created_at: '', 
            updated_at: ''
          });
        }
      } finally {
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
