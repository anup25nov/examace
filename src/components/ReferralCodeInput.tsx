import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Gift, Users } from 'lucide-react';
import { referralService } from '@/lib/referralService';

interface ReferralCodeInputProps {
  onReferralApplied?: (referralCode: string, referrerId: string) => void;
  onSkip?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({
  onReferralApplied,
  onSkip,
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
      setValidationResult({
        valid: false,
        message: 'Error validating referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!validationResult?.valid) return;

    setIsValidating(true);

    try {
      const result = await referralService.createReferralTracking(referralCode.trim());
      
      if (result.success) {
        setIsApplied(true);
        onReferralApplied?.(referralCode.trim(), result.referrerId || '');
      } else {
        setValidationResult({
          valid: false,
          message: result.message
        });
      }
    } catch (error) {
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
                setReferralCode(e.target.value.toUpperCase());
                setValidationResult(null);
              }}
              className="flex-1"
              disabled={isValidating}
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
        </div>

        {validationResult && (
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            validationResult.valid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {validationResult.valid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm ${
              validationResult.valid ? 'text-green-700' : 'text-red-700'
            }`}>
              {validationResult.message}
            </span>
          </div>
        )}

        {validationResult?.valid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-blue-800">Referral Benefits</h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• You'll earn 50% of your first purchase as rewards</li>
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