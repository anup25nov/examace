import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Check, 
  X, 
  AlertCircle,
  Star
} from 'lucide-react';
import { referralService } from '@/lib/referralServiceSimple';

interface ReferralCodeInputProps {
  onReferralApplied: (code: string) => void;
  onClose: () => void;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({
  onReferralApplied,
  onClose
}) => {
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

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
      const result = await referralService.validateReferralCode(referralCode.trim().toUpperCase());
      
      if (result.valid) {
        setValidationResult({
          valid: true,
          message: 'Valid referral code! You\'ll get 10% off your purchase.'
        });
      } else {
        setValidationResult({
          valid: false,
          message: result.error || 'Invalid referral code'
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Failed to validate referral code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCode = () => {
    if (validationResult?.valid) {
      onReferralApplied(referralCode.trim().toUpperCase());
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Have a Referral Code?</h3>
            <p className="text-gray-600">
              Enter your referral code to get 10% off your purchase and help your friend earn!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="referralCode">Referral Code</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="referralCode"
                  placeholder="Enter referral code (e.g., EXAM123)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="font-mono"
                  maxLength={10}
                />
                <Button
                  onClick={handleValidateCode}
                  disabled={isValidating || !referralCode.trim()}
                  variant="outline"
                >
                  {isValidating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {validationResult && (
              <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                validationResult.valid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {validationResult.valid ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm ${
                  validationResult.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.message}
                </span>
              </div>
            )}

            {validationResult?.valid && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Referral Benefits</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• You get 10% off your purchase</li>
                    <li>• Your friend earns 50% commission</li>
                    <li>• Both of you benefit!</li>
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Skip
              </Button>
              <Button
                onClick={handleApplyCode}
                disabled={!validationResult?.valid}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                Apply Code
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Don't have a code? You can still proceed without one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
