import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  IndianRupee,
  QrCode
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProfileManagement } from '@/hooks/useProfileManagement';
import { profileService } from '@/lib/profileService';

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProfileData {
  name: string;
  phone: string;
  upiId: string;
  isPhoneVerified: boolean;
  referralEarnings: number;
  hasWithdrawalAccount: boolean;
}

export const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { updateProfile, sendOTP, verifyOTP, loading } = useProfileManagement();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    upiId: '',
    isPhoneVerified: false,
    referralEarnings: 0,
    hasWithdrawalAccount: false
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: (profile as any)?.name || '',
        phone: (profile as any)?.phone || '',
        upiId: (profile as any)?.upi_id || '',
        isPhoneVerified: (profile as any)?.phone_verified || false,
        referralEarnings: (profile as any)?.referral_earnings || 0,
        hasWithdrawalAccount: (profile as any)?.upi_id ? true : false
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendOTP = async () => {
    if (!profileData.phone || profileData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    // Check if phone number is already in use
    const isPhoneUnique = await profileService.isPhoneUnique(profileData.phone);
    if (!isPhoneUnique) {
      alert('This phone number is already in use by another user. Please use a different number.');
      return;
    }

    const result = await sendOTP(profileData.phone);
    if (result.success) {
      setOtpSent(true);
    } else {
      alert(result.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await verifyOTP(profileData.phone, otpCode);
      if (result.success) {
        handleInputChange('isPhoneVerified', true);
        setOtpSent(false);
        setOtpCode('');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Validation function to check if save button should be enabled
  const isFormValid = () => {
    const hasValidName = profileData.name.trim().length >= 2;
    const hasValidPhone = profileData.phone && profileData.phone.length === 10 && /^[0-9]{10}$/.test(profileData.phone);
    const isPhoneVerified = profileData.isPhoneVerified;
    const hasValidUpi = profileData.referralEarnings === 0 || (profileData.upiId.trim() && /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(profileData.upiId));
    
    return hasValidName && hasValidPhone && isPhoneVerified && hasValidUpi;
  };

  const saveProfile = async () => {
    if (!isFormValid()) {
      alert('Please complete all required fields and verify your phone number before saving.');
      return;
    }

    const success = await updateProfile({
      name: profileData.name.trim(),
      phone: profileData.phone,
      phone_verified: profileData.isPhoneVerified,
      upi_id: profileData.upiId.trim()
    });

    if (success) {
      onSuccess();
      onClose();
    } else {
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`mt-1 ${
                      profileData.name.trim().length >= 2 
                        ? 'border-green-500 focus:border-green-500' 
                        : profileData.name.trim().length > 0 
                          ? 'border-red-500 focus:border-red-500' 
                          : ''
                    }`}
                  />
                  {profileData.name.trim().length > 0 && profileData.name.trim().length < 2 && (
                    <p className="text-red-500 text-xs mt-1">Name must be at least 2 characters</p>
                  )}
                  {profileData.name.trim().length >= 2 && (
                    <p className="text-green-500 text-xs mt-1">✓ Valid name</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className={`flex-1 ${
                        profileData.phone && profileData.phone.length === 10 && /^[0-9]{10}$/.test(profileData.phone)
                          ? 'border-green-500 focus:border-green-500' 
                          : profileData.phone && profileData.phone.length > 0
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                      }`}
                      maxLength={10}
                    />
                    {!profileData.isPhoneVerified && (
                    <Button
                      onClick={handleSendOTP}
                      disabled={loading || !profileData.phone || profileData.phone.length !== 10}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                    </Button>
                    )}
                  </div>
                  
                  {profileData.phone && profileData.phone.length > 0 && profileData.phone.length < 10 && (
                    <p className="text-red-500 text-xs mt-1">Phone number must be 10 digits</p>
                  )}
                  {profileData.phone && profileData.phone.length === 10 && !/^[0-9]{10}$/.test(profileData.phone) && (
                    <p className="text-red-500 text-xs mt-1">Phone number must contain only digits</p>
                  )}
                  {profileData.phone && profileData.phone.length === 10 && /^[0-9]{10}$/.test(profileData.phone) && !profileData.isPhoneVerified && (
                    <p className="text-orange-500 text-xs mt-1">✓ Valid format - Please verify with OTP</p>
                  )}
                  {profileData.isPhoneVerified && (
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Phone verified</span>
                    </div>
                  )}
                </div>

                {otpSent && !profileData.isPhoneVerified && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Verify Phone Number</span>
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleVerifyOTP}
                        disabled={verifyingOtp || !otpCode || otpCode.length !== 6}
                        className="whitespace-nowrap"
                      >
                        {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Earnings & UPI */}
          {profileData.referralEarnings > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold">Referral Earnings</h3>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Available Balance</p>
                      <p className="text-2xl font-bold text-green-800">₹{profileData.referralEarnings}</p>
                    </div>
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="upi">UPI ID for Withdrawals *</Label>
                  <Input
                    id="upi"
                    value={profileData.upiId}
                    onChange={(e) => handleInputChange('upiId', e.target.value)}
                    placeholder="yourname@paytm or yourname@upi"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your UPI ID to enable instant withdrawals
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            {/* Only show Save Profile button if not in OTP verification process */}
            {!otpSent && !verifyingOtp && (
              <Button
                onClick={saveProfile}
                disabled={loading || !isFormValid()}
                className={`flex-1 ${
                  isFormValid() 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
