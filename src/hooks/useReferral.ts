// Professional Referral Hook
import { useState, useEffect } from 'react';
import { referralService, ReferralStats } from '@/lib/referralService';
import { useAuth } from './useAuth';

export function useReferral() {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load referral dashboard data
  const loadReferralDashboard = async () => {
    if (!user?.id) {
      setReferralStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const stats = await referralService.getReferralDashboard(user.id);
      setReferralStats(stats);
      setError(null);
    } catch (err: any) {
      console.error('Error loading referral dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get user's referral code
  const getUserReferralCode = async (): Promise<string | null> => {
    if (!user?.id) return null;
    return await referralService.getUserReferralCode(user.id);
  };

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    return await referralService.validateReferralCode(code);
  };

  // Apply referral code
  const applyReferralCode = async (code: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const result = await referralService.applyReferralCode(user.id, code);
    
    if (result.success) {
      // Refresh dashboard after applying code
      await loadReferralDashboard();
    }

    return result;
  };

  // Generate referral link
  const generateReferralLink = (code: string): string => {
    return referralService.generateReferralLink(code);
  };

  // Get referral leaderboard
  const getReferralLeaderboard = async (limit: number = 10) => {
    return await referralService.getReferralLeaderboard(limit);
  };

  // Request payout
  const requestPayout = async (
    amount: number,
    paymentMethod: string,
    paymentDetails: any
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const result = await referralService.requestReferralPayout(
      user.id,
      amount,
      paymentMethod,
      paymentDetails
    );

    if (result.success) {
      // Refresh dashboard after payout request
      await loadReferralDashboard();
    }

    return result;
  };

  // Refresh referral data
  const refreshReferralData = () => {
    loadReferralDashboard();
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadReferralDashboard();
  }, [user?.id]);

  // Process referral from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && user?.id) {
      referralService.processReferralFromURL(refCode, user.id)
        .then(result => {
          if (result.success) {
            console.log('Referral code applied from URL');
            loadReferralDashboard();
          }
        })
        .catch(err => {
          console.error('Error processing referral from URL:', err);
        });
    }
  }, [user?.id]);

  return {
    referralStats,
    loading,
    error,
    getUserReferralCode,
    validateReferralCode,
    applyReferralCode,
    generateReferralLink,
    getReferralLeaderboard,
    requestPayout,
    refreshReferralData,
    // Computed values
    referralCode: referralStats?.referral_code || '',
    totalReferrals: referralStats?.total_referrals || 0,
    totalEarnings: referralStats?.total_earnings || 0,
    pendingEarnings: referralStats?.pending_earnings || 0,
    paidEarnings: referralStats?.paid_earnings || 0,
  };
}