import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        // For now, use a simplified streak system
        // In production, you would call the database functions
        const today = new Date().toISOString().split('T')[0];
        const lastVisitKey = `lastVisit_${user.id}`;
        const lastVisit = localStorage.getItem(lastVisitKey);
        
        let currentStreak = 0;
        let longestStreak = 0;
        
        if (lastVisit === today) {
          // Already visited today, get existing streak
          const streakData = localStorage.getItem(`streak_${user.id}`);
          if (streakData) {
            const { current_streak, longest_streak } = JSON.parse(streakData);
            currentStreak = current_streak || 0;
            longestStreak = longest_streak || 0;
          }
        } else {
          // First visit today, update streak
          const streakData = localStorage.getItem(`streak_${user.id}`);
          if (streakData) {
            const { current_streak, longest_streak } = JSON.parse(streakData);
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            if (lastVisit === yesterday) {
              // Consecutive day
              currentStreak = (current_streak || 0) + 1;
            } else {
              // Streak broken
              currentStreak = 1;
            }
            
            longestStreak = Math.max(longest_streak || 0, currentStreak);
          } else {
            // First time
            currentStreak = 1;
            longestStreak = 1;
          }
          
          // Save streak data
          localStorage.setItem(`streak_${user.id}`, JSON.stringify({
            current_streak: currentStreak,
            longest_streak: longestStreak
          }));
          
          // Record today's visit
          localStorage.setItem(lastVisitKey, today);
        }
        
        setStreak({
          current_streak: currentStreak,
          longest_streak: longestStreak
        });
      } catch (error) {
        console.error('Failed to fetch user streak:', error);
        setStreak({ current_streak: 0, longest_streak: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user, isAuthenticated]);

  const refreshStreak = async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    try {
      // Refresh streak data from localStorage
      const streakData = localStorage.getItem(`streak_${user.id}`);
      if (streakData) {
        const { current_streak, longest_streak } = JSON.parse(streakData);
        setStreak({
          current_streak: current_streak || 0,
          longest_streak: longest_streak || 0
        });
      } else {
        setStreak({ current_streak: 0, longest_streak: 0 });
      }
    } catch (error) {
      console.error('Failed to refresh user streak:', error);
    } finally {
      setLoading(false);
    }
  };

  return { streak, loading, refreshStreak };
};