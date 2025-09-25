import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Gift, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  IndianRupee,
  Crown,
  Sparkles
} from 'lucide-react';
import { referralService } from '@/lib/referralService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (referralCode: string) => void;
  isExistingUser?: boolean;
}

export const ReferralCodeModal: React.FC<ReferralCodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isExistingUser = false
}) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    referrerInfo?: any;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAppliedReferral, setHasAppliedReferral] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check if user already has a referral code applied
      checkExistingReferral();
    }
  }, [isOpen, user]);

  const checkExistingReferral = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('referral_code_applied, referral_code_used')
        .eq('id', user.id)
        .single();
      
      if (profile && (profile as any).referral_code_applied) {
        setHasAppliedReferral(true);
      }
    } catch (error) {
      console.error('Error checking existing referral:', error);
    }
  };

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 3) {
      setValidationResult({
        isValid: false,
        message: 'Referral code must be at least 3 characters'
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await referralService.validateReferralCode(code);
      setValidationResult({
        isValid: result.valid,
        message: result.message,
        referrerInfo: result.referrerId ? { id: result.referrerId } : null
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'Error validating referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validationResult?.isValid) return;

    setIsSubmitting(true);
    try {
      const result = await referralService.applyReferralCode(referralCode);
      if (result.success) {
        setHasAppliedReferral(true);
        onSuccess?.(referralCode);
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setValidationResult({
          isValid: false,
          message: result.message
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'Failed to apply referral code'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Card 
        className="w-full max-w-md mx-auto"
        style={{
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 2rem)',
          overflowY: 'auto'
        }}
      >
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {isExistingUser ? 'Apply Referral Code' : 'Welcome Bonus!'}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {hasAppliedReferral ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Referral Code Applied Successfully!
                </h3>
                <p className="text-gray-600">
                  You'll earn 50% commission on every purchase made by your referrals.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Benefits Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-gray-900">Earn 50% Commission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Refer friends and earn from their purchases</span>
                </div>
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Withdraw earnings anytime (min ₹10)</span>
                </div>
              </div>

              {/* Referral Code Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                    Enter Referral Code
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="referralCode"
                      type="text"
                      placeholder="e.g., ABC12345"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        setValidationResult(null);
                      }}
                      onBlur={() => {
                        if (referralCode.length >= 3) {
                          validateReferralCode(referralCode);
                        }
                      }}
                      className={`pr-10 ${
                        validationResult?.isValid === true
                          ? 'border-green-500 focus:border-green-500'
                          : validationResult?.isValid === false
                          ? 'border-red-500 focus:border-red-500'
                          : ''
                      }`}
                    />
                    {isValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {validationResult?.isValid === true && !isValidating && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {validationResult?.isValid === false && !isValidating && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  
                  {validationResult && (
                    <div className={`mt-2 text-sm flex items-center space-x-1 ${
                      validationResult.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {validationResult.isValid ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span>{validationResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!validationResult?.isValid || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Applying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Apply Code</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-6"
                  >
                    Skip
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Don't have a referral code? You can still continue and create your own referral code later.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralCodeModal;
