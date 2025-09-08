import { supabase } from '@/integrations/supabase/client';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  total_referrals: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  purchase_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: 'pending' | 'paid' | 'cancelled';
  purchase_id: string;
  created_at: string;
  paid_at?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCode: string;
  referralLink: string;
}

class ReferralService {
  private readonly COMMISSION_PERCENTAGE = 50; // 50% commission
  private readonly MINIMUM_PAYOUT = 100; // Minimum ₹100 for payout

  // Generate unique referral code for user
  async generateReferralCode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      // Check if user already has a referral code
      const { data: existingCode, error: checkError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing referral code:', checkError);
        return { success: false, error: 'Failed to check existing code' };
      }

      if (existingCode) {
        return { success: true, code: existingCode.code };
      }

      // Generate new referral code
      const code = await this.createUniqueReferralCode();
      
      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: code,
          is_active: true,
          total_referrals: 0,
          total_earnings: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating referral code:', error);
        return { success: false, error: 'Failed to create referral code' };
      }

      return { success: true, code: data.code };
    } catch (error: any) {
      console.error('Error in generateReferralCode:', error);
      return { success: false, error: error.message };
    }
  }

  // Create unique referral code
  private async createUniqueReferralCode(): Promise<string> {
    const generateCode = () => {
      const prefix = 'EXAM';
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${randomPart}`;
    };

    let code = generateCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (error) {
        throw new Error('Failed to check code uniqueness');
      }

      if (!data) {
        isUnique = true;
      } else {
        code = generateCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code');
    }

    return code;
  }

  // Process referral when user makes a purchase
  async processReferral(
    refereeId: string,
    referralCode: string,
    purchaseAmount: number,
    purchaseId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the referrer by code
      const { data: referralCodeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode)
        .eq('is_active', true)
        .single();

      if (codeError || !referralCodeData) {
        return { success: false, error: 'Invalid referral code' };
      }

      // Check if user is trying to refer themselves
      if (referralCodeData.user_id === refereeId) {
        return { success: false, error: 'Cannot refer yourself' };
      }

      // Check if this referee has already been referred by this referrer
      const { data: existingReferral, error: existingError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referralCodeData.user_id)
        .eq('referee_id', refereeId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing referral:', existingError);
        return { success: false, error: 'Failed to check existing referral' };
      }

      if (existingReferral) {
        return { success: false, error: 'User already referred by this referrer' };
      }

      // Calculate commission
      const commissionAmount = (purchaseAmount * this.COMMISSION_PERCENTAGE) / 100;

      // Create referral record
      const { data: referralRecord, error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referralCodeData.user_id,
          referee_id: refereeId,
          referral_code: referralCode,
          purchase_amount: purchaseAmount,
          commission_amount: commissionAmount,
          commission_percentage: this.COMMISSION_PERCENTAGE,
          status: 'pending',
          purchase_id: purchaseId
        })
        .select()
        .single();

      if (referralError) {
        console.error('Error creating referral record:', referralError);
        return { success: false, error: 'Failed to create referral record' };
      }

      // Update referral code stats
      await supabase
        .from('referral_codes')
        .update({
          total_referrals: referralCodeData.total_referrals + 1,
          total_earnings: referralCodeData.total_earnings + commissionAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referralCodeData.id);

      return { success: true };
    } catch (error: any) {
      console.error('Error in processReferral:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's referral stats
  async getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
      // Get referral code
      const { data: referralCode, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (codeError) {
        console.error('Error fetching referral code:', codeError);
        return null;
      }

      if (!referralCode) {
        // Generate a new referral code if none exists
        const generateResult = await this.generateReferralCode(userId);
        if (!generateResult.success) {
          return null;
        }
        
        // Return basic stats with new code
        const referralLink = `${window.location.origin}?ref=${generateResult.code}`;
        return {
          totalReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          referralCode: generateResult.code!,
          referralLink
        };
      }

      // Get referral records
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
        return null;
      }

      const totalReferrals = referrals?.length || 0;
      const totalEarnings = referrals?.reduce((sum, ref) => sum + ref.commission_amount, 0) || 0;
      const pendingEarnings = referrals?.filter(ref => ref.status === 'pending').reduce((sum, ref) => sum + ref.commission_amount, 0) || 0;
      const paidEarnings = referrals?.filter(ref => ref.status === 'paid').reduce((sum, ref) => sum + ref.commission_amount, 0) || 0;

      const referralLink = `${window.location.origin}?ref=${referralCode.code}`;

      return {
        totalReferrals,
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        referralCode: referralCode.code,
        referralLink
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return null;
    }
  }

  // Get referral history
  async getReferralHistory(userId: string): Promise<ReferralRecord[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:user_profiles!referrals_referee_id_fkey(email)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching referral history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReferralHistory:', error);
      return [];
    }
  }

  // Validate referral code
  async validateReferralCode(code: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { valid: false, error: 'Invalid referral code' };
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
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          user_id,
          total_referrals,
          total_earnings,
          user:user_profiles!referral_codes_user_id_fkey(email)
        `)
        .eq('is_active', true)
        .order('total_earnings', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data?.map((item, index) => ({
        user_id: item.user_id,
        email: item.user?.email || 'Anonymous',
        total_referrals: item.total_referrals,
        total_earnings: item.total_earnings,
        rank: index + 1
      })) || [];
    } catch (error) {
      console.error('Error in getReferralLeaderboard:', error);
      return [];
    }
  }
}

export const referralService = new ReferralService();
