import { useState, useEffect } from 'react';
import { referralService, ReferralStats } from '@/lib/referralService';

interface ReferralDashboard {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  recentReferrals: any[];
}

export const useReferral = () => {
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_earnings: 0,
    referral_code: '',
    max_referrals: 20,
    commission_rate: 50.00,
    pending_earnings: 0,
    paid_earnings: 0,
    pending_rewards: 0,
    verified_referrals: 0,
    rewarded_referrals: 0
  });
  const [dashboard, setDashboard] = useState<ReferralDashboard>({
    referralCode: '',
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    recentReferrals: []
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load referral dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await referralService.getReferralDashboard();
      setDashboard(dashboardData);
      const stats = await referralService.getReferralStats();
      setReferralStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Get referral code (create if not exists)
  const getReferralCode = async () => {
    try {
      let code = await referralService.getUserReferralCode();
      if (!code) {
        code = await referralService.generateReferralCode();
      }
      return code;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get referral code');
      return null;
    }
  };

  // Validate referral code
  const validateCode = async (code: string) => {
    try {
      return await referralService.validateReferralCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate code');
      return { valid: false, message: 'Validation failed' };
    }
  };

  // Apply referral code
  const applyCode = async (code: string) => {
    try {
      return await referralService.applyReferralCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply code');
      return { success: false, message: 'Failed to apply referral code' };
    }
  };

  // Generate referral link
  const generateLink = async (customLink?: string): Promise<string> => {
    try {
      const result = await referralService.generateReferralLink(customLink);
      return result.success ? (result.link?.custom_link || `https://examace.app?ref=${dashboard.referralCode}`) : '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
      return '';
    }
  };

  // Get leaderboard
  const loadLeaderboard = async () => {
    try {
      const data = await referralService.getReferralLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    }
  };

  // Request payout
  const requestPayout = async (
    amount: number,
    paymentMethod: string,
    paymentDetails: any
  ) => {
    try {
      setLoading(true);
      return await referralService.requestReferralPayout(amount, paymentMethod, paymentDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout');
      return { success: false, message: 'Failed to request payout' };
    } finally {
      setLoading(false);
    }
  };

  // Check earnings eligibility
  const checkEarningsEligibility = () => {
    const minPayout = 100; // Minimum payout amount
    return {
      canWithdraw: referralStats.pending_earnings >= minPayout,
      availableAmount: referralStats.pending_earnings,
      minimumAmount: minPayout,
      remainingAmount: Math.max(0, minPayout - referralStats.pending_earnings)
    };
  };

  // Process referral from URL
  const processReferralFromURL = () => {
    try {
      return referralService.processReferralFromURL();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process referral');
      return { success: false, message: 'Failed to process referral from URL' };
    }
  };

  // Generate referral statistics for display
  const getDisplayStats = () => {
    return {
      totalReferrals: referralStats.total_referrals,
      totalEarnings: referralStats.total_earnings,
      pendingEarnings: referralStats.pending_earnings,
      paidEarnings: referralStats.paid_earnings,
      conversionRate: referralStats.total_referrals > 0 
        ? Math.round((referralStats.verified_referrals / referralStats.total_referrals) * 100)
        : 0,
      averageEarning: referralStats.total_referrals > 0 
        ? Math.round(referralStats.total_earnings / referralStats.total_referrals)
        : 0
    };
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    referralStats,
    dashboard,
    leaderboard,
    loading,
    error,
    loadDashboard,
    getReferralCode,
    validateCode,
    applyCode,
    generateLink,
    loadLeaderboard,
    requestPayout,
    checkEarningsEligibility,
    processReferralFromURL,
    getDisplayStats,
    clearError: () => setError(null)
  };
};