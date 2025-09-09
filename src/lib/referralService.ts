// Professional Referral Service with Database Integration
import { supabase } from '@/integrations/supabase/client';

export interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  recent_referrals: Array<{
    referee_email: string;
    amount: number;
    created_at: string;
    status: string;
  }>;
}

export interface ReferralLeaderboard {
  user_id: string;
  email: string;
  total_referrals: number;
  total_earnings: number;
  rank_position: number;
}

class ReferralService {
  // Get or create user's referral code
  async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_user_referral_code', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting referral code:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserReferralCode:', error);
      return null;
    }
  }

  // Get comprehensive referral dashboard data
  async getReferralDashboard(userId: string): Promise<ReferralStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_referral_dashboard', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error getting referral dashboard:', error);
        return null;
      }

      return data as unknown as ReferralStats;
    } catch (error) {
      console.error('Error in getReferralDashboard:', error);
      return null;
    }
  }

  // Validate referral code
  async validateReferralCode(code: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!code || code.length < 6) {
        return { valid: false, error: 'Invalid referral code format' };
      }

      const { data, error } = await supabase
        .from('referral_codes')
        .select('id, user_id')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, error: 'Referral code not found' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false, error: 'Failed to validate code' };
    }
  }

  // Apply referral code for a user
  async applyReferralCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await this.validateReferralCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check if referral code belongs to the same user
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', code)
        .single();

      if (codeError || !codeData) {
        return { success: false, error: 'Invalid referral code' };
      }

      if (codeData.user_id === userId) {
        return { success: false, error: 'You cannot use your own referral code' };
      }

      // Update user profile with referral code
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ referred_by: code })
        .eq('id', userId);

      if (updateError) {
        console.error('Error applying referral code:', updateError);
        return { success: false, error: 'Failed to apply referral code' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in applyReferralCode:', error);
      return { success: false, error: error.message };
    }
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10): Promise<ReferralLeaderboard[]> {
    try {
      const { data, error } = await supabase.rpc('get_referral_leaderboard', {
        limit_count: limit
      });

      if (error) {
        console.error('Error getting referral leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReferralLeaderboard:', error);
      return [];
    }
  }

  // Get referral history for a user
  async getReferralHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('referral_transactions')
        .select(`
          *,
          referee_id (email)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting referral history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReferralHistory:', error);
      return [];
    }
  }

  // Request referral payout
  async requestReferralPayout(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('request_referral_payout', {
        user_uuid: userId,
        amount_param: amount,
        payment_method_param: paymentMethod,
        payment_details_param: paymentDetails
      });

      if (error) {
        console.error('Error requesting referral payout:', error);
        return { success: false, error: error.message };
      }

      return { success: data || false };
    } catch (error: any) {
      console.error('Error in requestReferralPayout:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate referral link
  generateReferralLink(code: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${code}`;
  }

  // Process referral code from URL
  async processReferralFromURL(code: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!code || !userId) {
        return { success: false, error: 'Missing code or user ID' };
      }

      return await this.applyReferralCode(userId, code);
    } catch (error: any) {
      console.error('Error processing referral from URL:', error);
      return { success: false, error: error.message };
    }
  }
}

export const referralService = new ReferralService();