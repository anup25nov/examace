import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getCurrentISTDate, isTodayIST, isYesterdayIST } from '@/lib/timeUtils';
import { supabaseStatsService } from '@/lib/supabaseStats';

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
        // Use IST timezone for streak calculations
        const todayIST = getCurrentISTDate();
        const lastVisitKey = `lastVisit_${user.id}`;
        const lastVisit = localStorage.getItem(lastVisitKey);
        
        // Check if we need to call API (cache until midnight)
        const cacheKey = `streak_cache_${user.id}`;
        const cachedStreak = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        
        let currentStreak = 0;
        let longestStreak = 0;
        
        // Check if cache is valid (until midnight)
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(23, 59, 59, 999);
        const isCacheValid = cacheTimestamp && new Date(cacheTimestamp) < midnight;
        
        if (cachedStreak && isCacheValid) {
          // Use cached data
          const { current_streak, longest_streak } = JSON.parse(cachedStreak);
          currentStreak = current_streak || 0;
          longestStreak = longest_streak || 0;
          console.log('🔍 [useUserStreak] Using cached streak data');
        } else {
          // Call API to get fresh data
          console.log('🔍 [useUserStreak] Calling API for fresh streak data');
          const { data: apiStreak, error } = await supabaseStatsService.getUserStreak();
          
          if (error || !apiStreak) {
            // Fallback to local calculation
            if (isTodayIST(lastVisit || '')) {
              // Already visited today in IST, get existing streak
              const streakData = localStorage.getItem(`streak_${user.id}`);
              if (streakData) {
                const { current_streak, longest_streak } = JSON.parse(streakData);
                currentStreak = current_streak || 0;
                longestStreak = longest_streak || 0;
              }
            } else {
              // First visit today in IST, update streak
              const streakData = localStorage.getItem(`streak_${user.id}`);
              if (streakData) {
                const { current_streak, longest_streak } = JSON.parse(streakData);
                
                if (lastVisit && isYesterdayIST(lastVisit)) {
                  // Consecutive day in IST
                  currentStreak = (current_streak || 0) + 1;
                } else {
                  // Streak broken (not consecutive days in IST)
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
              
              // Record today's visit in IST
              localStorage.setItem(lastVisitKey, todayIST);
            }
          } else {
            // Use API data
            currentStreak = apiStreak.current_streak || 0;
            longestStreak = apiStreak.longest_streak || 0;
            
            // Cache the API data until midnight
            localStorage.setItem(cacheKey, JSON.stringify({
              current_streak: currentStreak,
              longest_streak: longestStreak
            }));
            localStorage.setItem(`${cacheKey}_timestamp`, new Date().toISOString());
          }
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