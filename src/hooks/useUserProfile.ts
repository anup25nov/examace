import { useState, useEffect } from 'react';
import { supabaseStatsService } from '@/lib/supabaseStats';
import { useSupabaseAuth } from './useSupabaseAuth';
import type { SupabaseUserProfile } from '@/lib/supabaseStats';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<SupabaseUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useSupabaseAuth();

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
          // Fallback to localStorage phone number if no profile exists
          const phone = localStorage.getItem("userPhone");
          if (phone) {
            setProfile({ 
              id: user.id, 
              phone, 
              created_at: '', 
              updated_at: '',
              pin: undefined 
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback to localStorage phone number
        const phone = localStorage.getItem("userPhone");
        if (phone) {
          setProfile({ 
            id: user.id, 
            phone, 
            created_at: '', 
            updated_at: '',
            pin: undefined 
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