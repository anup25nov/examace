import { supabase } from '@/integrations/supabase/client';
import { smsService } from './smsService';

export interface ProfileData {
  id?: string;
  user_id: string;
  name?: string;
  phone?: string;
  phone_verified?: boolean;
  upi_id?: string;
  referral_earnings?: number;
  total_referrals?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp_id?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  verified?: boolean;
}

class ProfileService {
  // Get current authenticated user
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Get user profile from existing user_profiles table
  async getUserProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.id, // In existing schema, id is the user_id
        name: (data as any).name || '',
        phone: data.phone || '',
        phone_verified: (data as any).phone_verified || false,
        upi_id: (data as any).upi_id || '',
        referral_earnings: (data as any).referral_earnings || 0,
        total_referrals: (data as any).total_referrals || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Check if email is unique
  async isEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('check_email_uniqueness', {
        p_email: email
      });

      if (error) {
        console.error('Error checking email uniqueness:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in isEmailUnique:', error);
      return false;
    }
  }

  // Check if phone is unique
  async isPhoneUnique(phone: string, excludeUserId?: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('check_phone_uniqueness', {
        p_phone: phone
      });

      if (error) {
        console.error('Error checking phone uniqueness:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in isPhoneUnique:', error);
      return false;
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: Partial<ProfileData>): Promise<boolean> {
    try {
      // Check uniqueness before updating
      if (profileData.phone) {
        const isPhoneUnique = await this.isPhoneUnique(profileData.phone, userId);
        if (!isPhoneUnique) {
          throw new Error('Phone number is already in use by another user');
        }
      }

      const updateData: any = {
        phone: profileData.phone,
        updated_at: new Date().toISOString()
      };

      // Only update fields that exist in the current schema
      if (profileData.name) updateData.name = profileData.name;
      if (profileData.phone_verified !== undefined) updateData.phone_verified = profileData.phone_verified;
      if (profileData.upi_id) updateData.upi_id = profileData.upi_id;
      if (profileData.referral_earnings !== undefined) updateData.referral_earnings = profileData.referral_earnings;
      if (profileData.total_referrals !== undefined) updateData.total_referrals = profileData.total_referrals;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  // Send OTP for phone verification using database function
  async sendOTP(phone: string): Promise<OTPResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      // For now, generate OTP locally and send via SMS
      // In production, you would call the database function
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send SMS with the OTP
      const smsResult = await smsService.sendOTP(phone, otp);
      
      if (smsResult.success) {
        // Store OTP in localStorage for verification (temporary solution)
        localStorage.setItem(`otp_${phone}`, JSON.stringify({
          otp: otp,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        }));

        return {
          success: true,
          message: 'OTP sent successfully to your phone number',
          otp_id: smsResult.messageId || 'sent'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send SMS. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error in sendOTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
  }

  // Verify OTP (simplified version using localStorage)
  async verifyOTP(phone: string, otp: string): Promise<VerificationResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      // Get stored OTP from localStorage
      const storedOtpData = localStorage.getItem(`otp_${phone}`);
      
      if (!storedOtpData) {
        return {
          success: false,
          message: 'OTP not found. Please request a new OTP.'
        };
      }

      const { otp: storedOtp, expires_at } = JSON.parse(storedOtpData);
      
      if (new Date() > new Date(expires_at)) {
        localStorage.removeItem(`otp_${phone}`);
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      if (storedOtp !== otp) {
        return {
          success: false,
          message: 'Invalid OTP. Please try again.'
        };
      }

      // Mark OTP as used
      localStorage.removeItem(`otp_${phone}`);

      // Update user profile with verified phone
      await this.updateUserProfile(user.id, {
        phone: phone,
        phone_verified: true
      });

      return {
        success: true,
        message: 'Phone number verified successfully',
        verified: true
      };
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  // Update referral earnings
  async updateReferralEarnings(userId: string, amount: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          referral_earnings: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating referral earnings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateReferralEarnings:', error);
      return false;
    }
  }

  // Get referral statistics
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching referral stats:', error);
        return {
          totalReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0
        };
      }

      return {
        totalReferrals: (data as any).total_referrals || 0,
        totalEarnings: (data as any).referral_earnings || 0,
        pendingEarnings: 0 // Calculate based on business logic
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return {
        totalReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0
      };
    }
  }

  // Check if user has completed profile
  async isProfileComplete(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return false;

      return !!(
        profile.name &&
        profile.phone &&
        profile.phone_verified
      );
    } catch (error) {
      console.error('Error in isProfileComplete:', error);
      return false;
    }
  }

  // Get daily visit status (simplified version using localStorage)
  async getDailyVisitStatus(userId: string): Promise<{
    isFirstVisit: boolean;
    lastVisitDate: string | null;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastVisitKey = `lastVisit_${userId}`;
      const lastVisit = localStorage.getItem(lastVisitKey);
      
      const isFirstVisit = lastVisit !== today;

      if (isFirstVisit) {
        // Record today's visit
        localStorage.setItem(lastVisitKey, today);
      }

      return {
        isFirstVisit,
        lastVisitDate: lastVisit
      };
    } catch (error) {
      console.error('Error in getDailyVisitStatus:', error);
      return { isFirstVisit: false, lastVisitDate: null };
    }
  }
}

export const profileService = new ProfileService();