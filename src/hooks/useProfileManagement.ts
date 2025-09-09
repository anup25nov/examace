import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { profileService, ProfileData } from '@/lib/profileService';

export const useProfileManagement = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileData = await profileService.getUserProfile(user.id);
      setProfile(profileData);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData: Partial<ProfileData>) => {
    if (!user?.id) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await profileService.updateUserProfile(user.id, profileData);
      if (success) {
        await loadProfile(); // Reload profile data
      }
      return success;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const sendOTP = async (phone: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await profileService.sendOTP(phone);
      return result;
    } catch (err) {
      setError('Failed to send OTP');
      console.error('Error sending OTP:', err);
      return { success: false, message: 'Failed to send OTP' };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (phone: string, otp: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await profileService.verifyOTP(phone, otp);
      if (result.success && result.verified) {
        // Update profile with verified phone
        await updateProfile({ phone, phone_verified: true });
      }
      return result;
    } catch (err) {
      setError('Failed to verify OTP');
      console.error('Error verifying OTP:', err);
      return { success: false, message: 'Failed to verify OTP' };
    } finally {
      setLoading(false);
    }
  };

  // Check if profile is complete
  const isProfileComplete = () => {
    return !!(
      profile?.name &&
      profile?.phone &&
      profile?.phone_verified
    );
  };

  // Get daily visit status
  const getDailyVisitStatus = async () => {
    if (!user?.id) return { isFirstVisit: false, lastVisitDate: null };
    
    try {
      return await profileService.getDailyVisitStatus(user.id);
    } catch (err) {
      console.error('Error getting daily visit status:', err);
      return { isFirstVisit: false, lastVisitDate: null };
    }
  };

  // Get referral stats
  const getReferralStats = async () => {
    if (!user?.id) return { totalReferrals: 0, totalEarnings: 0, pendingEarnings: 0 };
    
    try {
      return await profileService.getReferralStats(user.id);
    } catch (err) {
      console.error('Error getting referral stats:', err);
      return { totalReferrals: 0, totalEarnings: 0, pendingEarnings: 0 };
    }
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    sendOTP,
    verifyOTP,
    isProfileComplete,
    getDailyVisitStatus,
    getReferralStats
  };
};
