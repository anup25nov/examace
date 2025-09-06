import { useState, useEffect } from 'react';
import { supabaseStatsService } from '@/lib/supabaseStats';
import { useAuth } from './useAuth';

export const useUserStreak = () => {
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchStreak = async () => {
      if (!isAuthenticated || !user) {
        setStreak({ current_streak: 0, longest_streak: 0 });
        setLoading(false);
        return;
      }

      try {
        const streakData = await supabaseStatsService.getUserStreak();
        if (streakData?.data) {
          setStreak({
            current_streak: streakData.data.current_streak,
            longest_streak: streakData.data.longest_streak
          });
        }
      } catch (error) {
        console.error('Failed to fetch user streak:', error);
        setStreak({ current_streak: 0, longest_streak: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user, isAuthenticated]);

  return { streak, loading };
};