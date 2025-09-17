import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { 
  sendOTPCode, 
  verifyOTPCode
} from '@/lib/supabaseAuthSimple';
import OTPInput from './OTPInput';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseAuthFlowProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'phone' | 'otp' | 'referral';

const SupabaseAuthFlow: React.FC<SupabaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [referralInvalid, setReferralInvalid] = useState<string | null>(null);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Start timer when OTP step is reached
  useEffect(() => {
    if (step === 'otp') {
      setResendTimer(60);
      setCanResend(false);
    }
  }, [step]);

  // Capture referral code from URL (?ref=CODE) and prefill
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        const cleaned = ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        setReferralCode(cleaned);
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic phone validation (10 digits for Indian numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Always send OTP - no PIN concept
      const result = await sendOTPCode(phone);
      if (result.success) {
        setStep('otp');
        setError('');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTPCode(phone, otp);
      console.log('OTP verification result:', result);
      
      if (result.success && result.data) {
        const isNewUser = !!result.isNewUser;
        console.log('Is new user:', isNewUser);
        setIsNewUser(isNewUser);
        
        // Step 1 Complete: OTP verified successfully
        // Now check if user is new or existing
        if (isNewUser) {
          console.log('New user detected - going to referral step');
          setStep('referral');
        } else {
          console.log('Existing user detected - going to dashboard');
          onAuthSuccess();
        }
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async () => {
    setLoading(true);
    setError('');
    setReferralInvalid('');

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      if (referralCode.trim()) {
        console.log('Validating referral code:', referralCode);
        console.log('User ID for referral application:', user.id);
        
        // Use the database function to validate and apply referral code
        const { data, error } = await supabase.rpc('validate_and_apply_referral_code' as any, {
          p_user_id: user.id,
          p_referral_code: referralCode.trim().toUpperCase()
        });

        console.log('Referral code validation result:', { data, error });

        if (error) {
          console.error('Error applying referral code:', error);
          setReferralInvalid('Failed to apply referral code');
          setLoading(false);
          return;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const result = data[0];
          console.log('Referral code validation result details:', result);
          
          if (result.success) {
            console.log('Referral code applied successfully:', result.message);
            // Proceed to dashboard
            onAuthSuccess();
          } else {
            console.log('Referral code validation failed:', result.message);
            setReferralInvalid('Referral code not found. Try again or skip.');
            setLoading(false);
            return;
          }
        } else {
          console.log('No data returned from referral code validation');
          setReferralInvalid('Referral code not found. Try again or skip.');
          setLoading(false);
          return;
        }
      } else {
        // No referral code provided, proceed to dashboard
        console.log('No referral code provided, proceeding to dashboard');
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      setReferralInvalid('An error occurred. Try again or skip.');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await sendOTPCode(phone);
      if (result.success) {
        setResendTimer(60);
        setCanResend(false);
        setError('');
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipReferral = () => {
    console.log('Skipping referral code');
    onAuthSuccess();
  };

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setReferralCode('');
    setError('');
    setIsNewUser(false);
    setReferralInvalid(null);
  };

  // Removed unused functions - referral handling is now simplified

  const renderPhoneStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome to ExamAce</CardTitle>
        <CardDescription className="text-center">
          Enter your phone number to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your 10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="pl-10"
                maxLength={10}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We'll send you an OTP to verify your number
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderOTPStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verify Phone</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code sent to +91{phone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Verification Code</Label>
            <OTPInput
              value={otp}
              onChange={setOtp}
              length={6}
              disabled={loading}
              className="my-4"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>

          <div className="text-center">
            {canResend ? (
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                className="text-sm"
                disabled={loading}
              >
                Resend OTP
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend OTP in {resendTimer}s
              </p>
            )}
          </div>
        </form>


      </CardContent>
    </Card>
  );

  const renderReferralStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">🎉 Welcome!</CardTitle>
        <CardDescription className="text-center">
          You're a new user. Do you have a referral code?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Referral Code Input */}
          <div className="space-y-3">
            <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Enter referral code (e.g., ABC12345)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
              className="text-center font-mono tracking-wider"
              maxLength={20}
            />
            {referralInvalid && (
              <p className="text-sm text-red-600 text-center">{referralInvalid}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSkipReferral}
              disabled={loading}
              className="flex-1"
            >
              Skip
            </Button>
            <Button 
              type="button" 
              onClick={handleReferralSubmit} 
              disabled={loading || !referralCode.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply & Continue'
              )}
            </Button>
          </div>
          
          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              You can earn 50% commission by referring friends!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  switch (step) {
    case 'phone':
      return renderPhoneStep();
    case 'otp':
      return renderOTPStep();
    case 'referral':
      return renderReferralStep();
    default:
      return renderPhoneStep();
  }
};

export default SupabaseAuthFlow;