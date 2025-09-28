import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Gift, Users } from 'lucide-react';
import { referralService } from '@/lib/referralService';
import { getCommissionPercentage } from '@/config/appConfig';

interface ReferralCodeInputProps {
  onReferralApplied?: (referralCode: string, referrerId: string) => void;
  onSkip?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({
  onReferralApplied,
  onSkip,
  onClose,
  className = ''
}) => {
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  const handleValidateCode = async () => {
    if (!referralCode.trim()) {
      setValidationResult({
        valid: false,
        message: 'Please enter a referral code'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await referralService.validateReferralCode(referralCode.trim());
      setValidationResult(result);
    } catch (error) {
      console.error('Error validating referral code:', error);
      setValidationResult({
        valid: false,
        message: 'Error validating referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!validationResult?.valid) {
      console.log('Cannot apply referral - validation result not valid:', validationResult);
      return;
    }

    console.log('Applying referral code:', referralCode.trim());
    setIsValidating(true);

    try {
      // Use the proper applyReferralCode function that calls the database
      const result = await referralService.applyReferralCode(referralCode.trim());
      console.log('Referral application result:', result);
      
      if (result.success) {
        console.log('Referral code applied successfully');
        setIsApplied(true);
        onReferralApplied?.(referralCode.trim(), result.referrerId || '');
      } else {
        console.log('Referral code application failed:', result.message);
        setValidationResult({
          valid: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      setValidationResult({
        valid: false,
        message: 'Error applying referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (isApplied) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Referral Applied Successfully!</h3>
              <p className="text-sm text-green-600">
                You'll earn rewards when you make your first purchase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Gift className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Have a Referral Code?</CardTitle>
        </div>
        <CardDescription>
          Enter a referral code to earn rewards and help your friend earn too!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referral-code">Referral Code</Label>
          <div className="flex space-x-2">
            <Input
              id="referral-code"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setReferralCode(value);
                setValidationResult(null);
              }}
              className={`flex-1 ${
                referralCode.length > 0 && referralCode.length < 3 
                  ? 'border-orange-300 focus:border-orange-500' 
                  : ''
              }`}
              disabled={isValidating}
              maxLength={20}
            />
            <Button
              onClick={handleValidateCode}
              disabled={isValidating || !referralCode.trim()}
              variant="outline"
              size="sm"
            >
              {isValidating ? 'Validating...' : 'Validate'}
            </Button>
          </div>
          {referralCode.length > 0 && referralCode.length < 3 && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Referral code must be at least 3 characters
            </p>
          )}
        </div>

        {validationResult && (
          <div className={`flex items-start space-x-3 p-4 rounded-lg ${
            validationResult.valid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {validationResult.valid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                validationResult.valid ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.message}
              </p>
              {!validationResult.valid && (
                <div className="mt-2 text-xs text-red-600">
                  <p className="mb-1">💡 <strong>Tips for valid referral codes:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Check for typos or extra spaces</li>
                    <li>Make sure the code is at least 3 characters long</li>
                    <li>Try asking your referrer to share the code again</li>
                    <li>You can skip this step and add a code later</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {validationResult?.valid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">Referral Benefits</h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You'll earn {getCommissionPercentage()}% of your first purchase as rewards</li>
              <li>• Your referrer will also earn rewards</li>
              <li>• Rewards can be withdrawn to your UPI account</li>
            </ul>
          </div>
        )}

        <div className="flex space-x-3">
          {validationResult?.valid && (
            <Button
              onClick={handleApplyReferral}
              disabled={isValidating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isValidating ? 'Applying...' : 'Apply Referral Code'}
            </Button>
          )}
          
          {validationResult && !validationResult.valid && (
            <Button
              onClick={() => {
                setValidationResult(null);
                setReferralCode('');
              }}
              variant="outline"
              disabled={isValidating}
              className="flex-1"
            >
              Try Different Code
            </Button>
          )}
          
          <Button
            onClick={handleSkip}
            variant="outline"
            disabled={isValidating}
            className="flex-1"
          >
            Skip for Now
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You can always add a referral code later in your profile settings
          </p>
        </div>
      </CardContent>
    </Card>
  );
};