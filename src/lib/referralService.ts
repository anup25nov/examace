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
  pending_earnings: number;
  paid_earnings: number;
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

  // Ensure user has a referral code (create if missing)
  async ensureReferralCodeExists(userId: string): Promise<{ success: boolean; referralCode?: string; error?: string }> {
    try {
      // Check if referral code already exists
      const { data: existingCode, error: checkError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing referral code:', checkError);
        return { success: false, error: checkError.message };
      }

      // If referral code exists, return it
      if (existingCode && existingCode.code) {
        console.log('Referral code already exists:', existingCode.code);
        return { success: true, referralCode: existingCode.code };
      }

      // Create referral code if it doesn't exist
      console.log('Creating referral code for user:', userId);
      const { data: createResult, error: createError } = await supabase
        .rpc('create_user_referral_code', {
          user_uuid: userId,
          custom_code: null
        } as any);

      if (createError) {
        console.error('Error creating referral code:', createError);
        return { success: false, error: createError.message };
      }

      if (createResult && Array.isArray(createResult) && createResult.length > 0) {
        const result = createResult[0] as { success: boolean; referral_code: string };
        if (result.success) {
          console.log('Referral code created successfully:', result.referral_code);
          return { success: true, referralCode: result.referral_code };
        } else {
          return { success: false, error: 'Failed to create referral code' };
        }
      }

      return { success: false, error: 'No result from referral code creation' };
    } catch (error: any) {
      console.error('Error ensuring referral code exists:', error);
      return { success: false, error: error.message };
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
        pending_earnings: 0,
        paid_earnings: 0,
        pending_rewards: 0,
        verified_referrals: 0,
        rewarded_referrals: 0
      };
      }

      // Get referral code first
      const { data: referralCodeData, error: referralCodeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (referralCodeError) {
        console.error('Error fetching referral code:', referralCodeError);
      }

      // If no referral code exists, try to create one
      let finalReferralCode = referralCodeData?.code || '';
      if (!finalReferralCode) {
        try {
          console.log('No referral code found, attempting to create one...');
          const { data: createResult, error: createError } = await supabase
            .rpc('create_user_referral_code', {
              user_uuid: user.id,
              custom_code: null
            } as any);

          if (!createError && createResult && Array.isArray(createResult) && createResult.length > 0) {
            const result = createResult[0] as { success: boolean; referral_code: string };
            if (result.success) {
              finalReferralCode = result.referral_code;
              console.log('Referral code created successfully:', finalReferralCode);
            }
          }
        } catch (createError) {
          console.error('Error creating referral code:', createError);
        }
      }

      // Get earnings info using the new function
      const { data: earningsData, error: earningsError } = await supabase
        .rpc('get_user_referral_earnings' as any, { user_uuid: user.id });

      if (earningsError) {
        console.error('Error fetching referral earnings:', earningsError);
      }

      // Get referral count
      const { count: referralCount, error: countError } = await supabase
        .from('referral_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      if (countError) {
        console.error('Error fetching referral count:', countError);
      }

      const earnings = earningsData?.[0] || {};

      return {
        total_referrals: referralCount || 0,
        total_earnings: earnings.total_earnings || 0,
        referral_code: finalReferralCode,
        max_referrals: 20,
        commission_rate: 50.00,
        pending_earnings: earnings.pending_earnings || 0,
        paid_earnings: earnings.paid_earnings || 0,
        pending_rewards: earnings.available_for_withdrawal || 0,
        verified_referrals: referralCount || 0,
        rewarded_referrals: earnings.paid_earnings || 0
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return {
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

  // Get detailed referral network
  async getReferralNetwork(): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_referral_network_detailed' as any, { user_uuid: user.id });

      if (error) {
        console.error('Error fetching referral network:', error);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getReferralNetwork:', error);
      return [];
    }
  }

  // Request withdrawal
  async requestWithdrawal(amount: number, method: string, accountDetails: string): Promise<{ success: boolean; message: string; withdrawalId?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .rpc('request_withdrawal' as any, {
          p_user_id: user.id,
          p_amount: amount,
          p_withdrawal_method: method,
          p_account_details: accountDetails
        });

      if (error) {
        console.error('Error requesting withdrawal:', error);
        return { success: false, message: error.message };
      }

      const result = data?.[0];
      return {
        success: result?.success || false,
        message: result?.message || 'Withdrawal request failed',
        withdrawalId: result?.withdrawal_id
      };
    } catch (error) {
      console.error('Error in requestWithdrawal:', error);
      return { success: false, message: 'Withdrawal request failed' };
    }
  }

  // Validate referral code using database function
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

      // Use the database function for validation
      const { data, error } = await supabase
        .rpc('validate_referral_code_for_signup' as any, {
          p_referral_code: referralCode.toUpperCase()
        });

      if (error) {
        console.error('Error validating referral code:', error);
        return {
          valid: false,
          message: 'Error validating referral code'
        };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return {
          valid: false,
          message: 'Referral code not found. Please check the code and try again.'
        };
      }

      const result = data[0];
      
      // Check if user is trying to use their own referral code
      const user = await this.getCurrentUser();
      if (user && result.referrer_id === user.id) {
        return {
          valid: false,
          message: 'Cannot use your own referral code'
        };
      }

      return {
        valid: result.valid,
        message: result.message,
        referrerId: result.referrer_id
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

  // Get referral dashboard data
  async getReferralDashboard(): Promise<{
    referralCode: string;
    totalReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    recentReferrals: any[];
  }> {
    const stats = await this.getReferralStats();
    return {
      referralCode: stats.referral_code,
      totalReferrals: stats.total_referrals,
      totalEarnings: stats.total_earnings,
      pendingEarnings: stats.pending_earnings,
      paidEarnings: stats.paid_earnings,
      recentReferrals: []
    };
  }

  // Apply referral code using the database function
  async applyReferralCode(referralCode: string): Promise<{
    success: boolean;
    message: string;
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

      const { data, error } = await supabase
        .rpc('validate_and_apply_referral_code' as any, {
          p_user_id: user.id,
          p_referral_code: referralCode.toUpperCase()
        });

      if (error) {
        console.error('Error applying referral code:', error);
        return {
          success: false,
          message: error.message
        };
      }

      const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!result) {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }

      return {
        success: result.success,
        message: result.message,
        referrerId: result.referrer_id
      };
    } catch (error) {
      console.error('Error in applyReferralCode:', error);
      return {
        success: false,
        message: 'Failed to apply referral code'
      };
    }
  }

  // Generate referral link (alias for createReferralLink)
  async generateReferralLink(customLink?: string) {
    return this.createReferralLink(customLink);
  }

  // Get referral leaderboard
  async getReferralLeaderboard() {
    try {
      const { data, error } = await supabase
        .rpc('get_referral_leaderboard', { limit_count: 10 });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReferralLeaderboard:', error);
      return [];
    }
  }

  // Request referral payout
  async requestReferralPayout(amount: number, paymentMethod: string, paymentDetails: any) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .rpc('request_referral_payout', {
          user_uuid: user.id,
          amount_param: amount,
          payment_method_param: paymentMethod,
          payment_details_param: paymentDetails
        });

      if (error) {
        console.error('Error requesting payout:', error);
        return { success: false, message: error.message };
      }

      return { success: data, message: data ? 'Payout requested successfully' : 'Insufficient funds' };
    } catch (error) {
      console.error('Error in requestReferralPayout:', error);
      return { success: false, message: 'Failed to request payout' };
    }
  }

  // Process referral from URL
  async processReferralFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (referralCode) {
        // Track the click
        await this.trackReferralClick(referralCode);
        
        // Store in session for later use during signup
        sessionStorage.setItem('pendingReferralCode', referralCode);
        
        return { success: true, referralCode };
      }
      
      return { success: false, message: 'No referral code in URL' };
    } catch (error) {
      console.error('Error processing referral from URL:', error);
      return { success: false, message: 'Failed to process referral' };
    }
  }
}

export const referralService = new ReferralService();