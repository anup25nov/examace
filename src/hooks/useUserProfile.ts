import { useState, useEffect } from 'react';
import { supabaseStatsService } from '@/lib/supabaseStats';
import { useAuth } from './useAuth';
import type { SupabaseUserProfile } from '@/lib/supabaseStats';

export const useUserProfile = () => {
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
        const { data, error } = await supabaseStatsService.getUserProfile();
        if (!error && data) {
          setProfile(data);
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

  return { profile, loading };
};