// Comprehensive Referral Service for handling referral system
import { supabase } from '@/integrations/supabase/client';

export interface ReferralTracking {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  referral_link: string;
  signup_date: string;
  verification_completed: boolean;
  verification_date?: string;
  first_purchase_completed: boolean;
  first_purchase_date?: string;
  first_purchase_amount?: number;
  milestone_achieved: boolean;
  milestone_date?: string;
  milestone_type?: string;
  reward_credited: boolean;
  reward_amount?: number;
  reward_date?: string;
  status: 'pending' | 'verified' | 'rewarded' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referred_id: string;
  tracking_id: string;
  reward_type: 'verification' | 'purchase' | 'milestone';
  reward_amount: number;
  commission_rate: number;
  base_amount?: number;
  transaction_id?: string;
  status: 'pending' | 'credited' | 'failed' | 'cancelled';
  credited_at?: string;
  created_at: string;
}

export interface ReferralLink {
  id: string;
  user_id: string;
  referral_code: string;
  custom_link?: string;
  click_count: number;
  signup_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  referral_code: string;
  max_referrals: number;
  commission_rate: number;
  pending_rewards: number;
  verified_referrals: number;
  rewarded_referrals: number;
}

class ReferralService {
  // Get current authenticated user
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Create referral tracking when user signs up with referral code
  async createReferralTracking(referralCode: string): Promise<{
    success: boolean;
    message: string;
    trackingId?: string;
    referrerId?: string;
  }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      // First validate the referral code
      const validation = await this.validateReferralCode(referralCode);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Update user profile with referrer information
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          referred_by: validation.referrerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user profile with referrer:', updateError);
        return {
          success: false,
          message: 'Failed to update referral information'
        };
      }

      // For now, simulate referral tracking creation
      // In production, you would call the database function after running the migration
      console.log('Creating referral tracking for:', referralCode, 'referrer:', validation.referrerId);
      
      // Simulate successful referral tracking
      return {
        success: true,
        message: 'Referral tracking created successfully',
        trackingId: 'simulated-tracking-id',
        referrerId: validation.referrerId
      };
    } catch (error) {
      console.error('Error in createReferralTracking:', error);
      return {
        success: false,
        message: 'Failed to create referral tracking'
      };
    }
  }

  // Process referral reward when referred user completes verification/purchase/milestone
  async processReferralReward(
    trackingId: string,
    rewardType: 'verification' | 'purchase' | 'milestone',
    baseAmount?: number
  ): Promise<{
    success: boolean;
    message: string;
    rewardAmount?: number;
    rewardId?: string;
  }> {
    try {
      // For now, simulate referral reward processing
      // In production, you would call the database function after running the migration
      console.log('Processing referral reward:', trackingId, rewardType, baseAmount);
      
      let rewardAmount = 0;
      if (rewardType === 'verification') {
        rewardAmount = 10.00;
      } else if (rewardType === 'purchase' && baseAmount) {
        rewardAmount = baseAmount * 0.5; // 50% commission
      } else if (rewardType === 'milestone') {
        rewardAmount = 25.00;
      }
      
      return {
        success: true,
        message: 'Referral reward processed successfully',
        rewardAmount: rewardAmount,
        rewardId: 'simulated-reward-id'
      };
    } catch (error) {
      console.error('Error in processReferralReward:', error);
      return {
        success: false,
        message: 'Failed to process referral reward'
      };
    }
  }

  // Get user's referral code
  async getUserReferralCode(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      // Get referral code from referral_codes table
      const { data: referralCodes, error } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting referral code:', error);
        return null;
      }

      // Return the first active referral code, or null if none found
      return referralCodes && referralCodes.length > 0 ? referralCodes[0].code : null;
    } catch (error) {
      console.error('Error in getUserReferralCode:', error);
      return null;
    }
  }

  // Generate referral code for user using database function
  async generateReferralCode(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      // Use the database function to create referral code
      const { data: referralCode, error } = await supabase
        .rpc('create_user_referral_code', { user_uuid: user.id });

      if (error) {
        console.error('Error creating referral code:', error);
        return null;
      }

      return referralCode;
    } catch (error) {
      console.error('Error in generateReferralCode:', error);
      return null;
    }
  }

  // Get referral statistics for user
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          total_referrals: 0,
          total_earnings: 0,
          referral_code: '',
          max_referrals: 20,
          commission_rate: 50.00,
          pending_rewards: 0,
          verified_referrals: 0,
          rewarded_referrals: 0
        };
      }

      // Use database function to get referral stats
      const { data: stats, error } = await supabase
        .rpc('get_user_referral_stats', { user_uuid: user.id });

      if (error || !stats || stats.length === 0) {
        console.error('Error fetching referral stats:', error);
        return {
          total_referrals: 0,
          total_earnings: 0,
          referral_code: '',
          max_referrals: 20,
          commission_rate: 50.00,
          pending_rewards: 0,
          verified_referrals: 0,
          rewarded_referrals: 0
        };
      }

      const stat = stats[0];
      return {
        total_referrals: stat.total_referrals || 0,
        total_earnings: stat.total_earnings || 0,
        referral_code: stat.referral_code || '',
        max_referrals: 20,
        commission_rate: 50.00,
        pending_rewards: stat.pending_earnings || 0,
        verified_referrals: 0,
        rewarded_referrals: stat.paid_earnings || 0
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return {
        total_referrals: 0,
        total_earnings: 0,
        referral_code: '',
        max_referrals: 20,
        commission_rate: 50.00,
        pending_rewards: 0,
        verified_referrals: 0,
        rewarded_referrals: 0
      };
    }
  }

  // Get referral earnings history
  async getReferralRewards(): Promise<ReferralReward[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      // For now, return empty array
      // In production, you would query the referral_rewards table after running the migration
      return [];
    } catch (error) {
      console.error('Error in getReferralRewards:', error);
      return [];
    }
  }

  // Get referral tracking history
  async getReferralTracking(): Promise<ReferralTracking[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      // For now, return empty array
      // In production, you would query the referral_tracking table after running the migration
      return [];
    } catch (error) {
      console.error('Error in getReferralTracking:', error);
      return [];
    }
  }

  // Validate referral code
  async validateReferralCode(referralCode: string): Promise<{
    valid: boolean;
    message: string;
    referrerId?: string;
  }> {
    try {
      if (!referralCode || referralCode.length < 3) {
        return {
          valid: false,
          message: 'Referral code must be at least 3 characters'
        };
      }

      // Check if referral code exists in referral_codes table
      const { data, error } = await supabase
        .from('referral_codes')
        .select('user_id, code')
        .eq('code', referralCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return {
          valid: false,
          message: 'Invalid referral code'
        };
      }

      // Check if user is trying to use their own referral code
      const user = await this.getCurrentUser();
      if (user && data.user_id === user.id) {
        return {
          valid: false,
          message: 'Cannot use your own referral code'
        };
      }

      return {
        valid: true,
        message: 'Valid referral code',
        referrerId: data.user_id
      };
    } catch (error) {
      console.error('Error in validateReferralCode:', error);
      return {
        valid: false,
        message: 'Error validating referral code'
      };
    }
  }

  // Create trackable referral link
  async createReferralLink(customLink?: string): Promise<{
    success: boolean;
    message: string;
    link?: ReferralLink;
  }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      const referralCode = await this.getUserReferralCode();
      if (!referralCode) {
        return {
          success: false,
          message: 'No referral code found. Please generate one first.'
        };
      }

      // For now, simulate referral link creation
      // In production, you would insert into referral_links table after running the migration
      const simulatedLink: ReferralLink = {
        id: 'simulated-link-id',
        user_id: user.id,
        referral_code: referralCode,
        custom_link: customLink,
        click_count: 0,
        signup_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Referral link created successfully',
        link: simulatedLink
      };
    } catch (error) {
      console.error('Error in createReferralLink:', error);
      return {
        success: false,
        message: 'Failed to create referral link'
      };
    }
  }

  // Track referral link click
  async trackReferralClick(referralCode: string): Promise<void> {
    try {
      // For now, just log the click
      // In production, you would update the referral_links table after running the migration
      console.log('Referral link clicked:', referralCode);
    } catch (error) {
      console.error('Error tracking referral click:', error);
    }
  }
}

export const referralService = new ReferralService();