/**
 * Optimized API Service
 * Reduces multiple API calls by batching and caching
 */

import { supabase } from '@/integrations/supabase/client';

export interface OptimizedApiService {
  // Batch multiple referral calls into one
  getReferralData(userId: string): Promise<{
    earnings: any;
    network: any[];
    stats: any;
  }>;
  
  // Batch user profile and membership data
  getUserProfileData(userId: string): Promise<{
    profile: any;
    membership: any;
    referralStats: any;
  }>;
  
  // Batch exam stats and test data
  getExamData(examId: string, userId: string): Promise<{
    stats: any;
    completions: any[];
    performance: any;
  }>;
}

class OptimizedApiServiceImpl implements OptimizedApiService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Profile cache with longer duration since profile data changes less frequently
  private profileCache = new Map<string, { data: any; timestamp: number }>();
  private readonly PROFILE_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Get all referral data in a single call
   */
  async getReferralData(userId: string) {
    const cacheKey = `referral_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Single comprehensive call
      const { data: statsData, error: statsError } = await supabase.rpc('get_comprehensive_referral_stats' as any, {
        user_uuid: userId
      });

      if (statsError) {
        console.error('Error loading referral stats:', statsError);
        return { earnings: null, network: [], stats: null };
      }

      const stats = statsData && Array.isArray(statsData) && statsData.length > 0 ? statsData[0] : null;
      
      // Get network data if not included in stats
      let network = [];
      if (stats && !stats.referral_network) {
        const { data: networkData } = await supabase.rpc('get_referral_network_detailed' as any, {
          user_uuid: userId
        });
        network = Array.isArray(networkData) ? networkData : [];
      } else if (stats && stats.referral_network) {
        network = Array.isArray(stats.referral_network) ? stats.referral_network : [];
      }

      const result = {
        earnings: stats,
        network,
        stats
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error in getReferralData:', error);
      return { earnings: null, network: [], stats: null };
    }
  }

  /**
   * Get user profile data with membership and referral info
   */
  async getUserProfileData(userId: string) {
    const cacheKey = `profile_${userId}`;
    const cached = this.profileCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.PROFILE_CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return { profile: null, membership: null, referralStats: null };
      }

      // Load membership data with proper parameters
      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Load referral stats only if user has referral data
      let referralStats = null;
      const hasReferralData = localStorage.getItem('hasReferralData') === 'true';
      if (hasReferralData) {
        const { data: referralData } = await supabase.rpc('get_user_referral_earnings' as any, {
          user_uuid: userId
        });
        referralStats = referralData && Array.isArray(referralData) && referralData.length > 0 ? referralData[0] : null;
      }

      const result = {
        profile,
        membership: membershipError ? null : membership,
        referralStats
      };

      this.profileCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Error in getUserProfileData:', error);
      return { profile: null, membership: null, referralStats: null };
    }
  }

  /**
   * Get exam data with stats and completions
   */
  async getExamData(examId: string, userId: string) {
    const cacheKey = `exam_${examId}_${userId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Load comprehensive stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_comprehensive_stats' as any, {
        exam_id: examId
      });

      // Load test completions
      const { data: completions, error: completionsError } = await supabase
        .from('test_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('exam_id', examId)
        .order('completed_at', { ascending: false });

      // Load performance stats
      const { data: performanceData } = await supabase.rpc('get_user_performance_stats' as any, {
        user_uuid: userId,
        exam_name: examId
      });

      const result = {
        stats: statsError ? null : statsData,
        completions: completionsError ? [] : (completions || []),
        performance: performanceData && Array.isArray(performanceData) && performanceData.length > 0 ? performanceData[0] : null
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error in getExamData:', error);
      return { stats: null, completions: [], performance: null };
    }
  }

  /**
   * Get cached data if still valid
   */
  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache for specific key or all
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Clear profile cache for a specific user (call after profile updates)
   */
  clearProfileCache(userId: string) {
    this.profileCache.delete(`profile_${userId}`);
  }

  /**
   * Clear all profile cache
   */
  clearAllProfileCache() {
    this.profileCache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

export const optimizedApiService = new OptimizedApiServiceImpl();
