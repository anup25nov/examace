// Simplified Referral Service - Works without database tables
// This is a temporary implementation until the referral database schema is set up

import { defaultConfig } from '@/config/appConfig';

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCode: string;
  referralLink: string;
}

class ReferralServiceSimple {
  private getCommissionPercentage(): number {
    return defaultConfig.commission?.percentage || 50;
  }

  // Generate unique referral code for user
  async generateReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Generate a simple referral code based on user ID
      const code = `${defaultConfig.commission?.referralCodePrefix || 'S2S'}${userId.substring(0, 6).toUpperCase()}`;
      
      // Store in localStorage for now
      localStorage.setItem(`referral_code_${userId}`, code);
      
      return { success: true, code };
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      return { success: false, error: error.message };
    }
  }

  // Process referral when user makes a purchase
  async processReferral(
    refereeId: string,
    referralCode: string,
    purchaseAmount: number,
    purchaseId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, just log the referral
      const commissionPercentage = this.getCommissionPercentage();
      console.log('Referral processed:', {
        refereeId,
        referralCode,
        purchaseAmount,
        purchaseId,
        commission: (purchaseAmount * commissionPercentage) / 100
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error processing referral:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's referral stats
  async getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
      // Get or generate referral code
      let referralCode = localStorage.getItem(`referral_code_${userId}`);
      
      if (!referralCode) {
        const generateResult = await this.generateReferralCode(userId);
        if (!generateResult.success) {
          return null;
        }
        referralCode = generateResult.code!;
      }

      // Get stats from localStorage (mock data for now)
      const stats = JSON.parse(localStorage.getItem(`referral_stats_${userId}`) || '{}');
      
      const referralLink = `${window.location.origin}?ref=${referralCode}`;

      return {
        totalReferrals: stats.totalReferrals || 0,
        totalEarnings: stats.totalEarnings || 0,
        pendingEarnings: stats.pendingEarnings || 0,
        paidEarnings: stats.paidEarnings || 0,
        referralCode,
        referralLink
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return null;
    }
  }

  // Get referral history
  async getReferralHistory(userId: string): Promise<any[]> {
    try {
      // Return mock data for now
      return [];
    } catch (error) {
      console.error('Error getting referral history:', error);
      return [];
    }
  }

  // Validate referral code
  async validateReferralCode(code: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Simple validation - check if it starts with correct prefix and has proper length
      if (!code || !code.startsWith(defaultConfig.commission?.referralCodePrefix || 'S2S') || code.length < (defaultConfig.commission?.referralCodeLength || 8)) {
        return { valid: false, error: 'Invalid referral code format' };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false, error: 'Failed to validate code' };
    }
  }

  // Process referral code from URL
  async processReferralFromURL(code: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate the referral code
      const validation = await this.validateReferralCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Store referral code in localStorage for later use
      localStorage.setItem('pendingReferralCode', code);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error processing referral from URL:', error);
      return { success: false, error: error.message };
    }
  }

  // Apply pending referral code to purchase
  async applyPendingReferralCode(userId: string, purchaseAmount: number, purchaseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const pendingCode = localStorage.getItem('pendingReferralCode');
      if (!pendingCode) {
        return { success: true }; // No pending referral
      }

      const result = await this.processReferral(userId, pendingCode, purchaseAmount, purchaseId);
      
      if (result.success) {
        localStorage.removeItem('pendingReferralCode');
      }

      return result;
    } catch (error: any) {
      console.error('Error applying pending referral code:', error);
      return { success: false, error: error.message };
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10): Promise<Array<{
    user_id: string;
    email: string;
    total_referrals: number;
    total_earnings: number;
    rank: number;
  }>> {
    try {
      // Return mock leaderboard data
      return [
        { user_id: '1', email: 'user1@example.com', total_referrals: 5, total_earnings: 150, rank: 1 },
        { user_id: '2', email: 'user2@example.com', total_referrals: 3, total_earnings: 90, rank: 2 },
        { user_id: '3', email: 'user3@example.com', total_referrals: 2, total_earnings: 60, rank: 3 }
      ];
    } catch (error) {
      console.error('Error getting referral leaderboard:', error);
      return [];
    }
  }
}

export const referralService = new ReferralServiceSimple();
