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
} from '@/lib/supabaseAuth';
import OTPInput from './OTPInput';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseAuthFlowProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'phone' | 'otp';

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
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [refFromLink, setRefFromLink] = useState<string | null>(null);
  const [referralInvalid, setReferralInvalid] = useState<string | null>(null);
  const [showReferralDecision, setShowReferralDecision] = useState(false);

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
      // Keep OTP screen minimal; handle referral post-OTP
      setShowReferralInput(false);
    }
  }, [step]);

  // Capture referral code from URL (?ref=CODE) and prefill
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        const cleaned = ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        setRefFromLink(cleaned);
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
      if (result.success && result.data) {
        setIsNewUser(!!result.isNewUser);
        // If user entered/prefilled a referral code, validate it now
        if (referralCode.trim()) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              setError('User not authenticated');
              setLoading(false);
              return;
            }
            const { data: refData, error: refErr } = await supabase.rpc('validate_and_apply_referral_code' as any, {
              p_user_id: user.id,
              p_referral_code: referralCode.trim().toUpperCase()
            });
            if (refErr) {
              setReferralInvalid('Invalid referral code');
              setShowReferralDecision(true);
              setShowReferralInput(true);
              return;
            }
            const res = Array.isArray(refData) && refData.length > 0 ? refData[0] : null;
            if (!res || !res.success) {
              setReferralInvalid(res?.message || 'Invalid referral code');
              setShowReferralDecision(true);
              setShowReferralInput(true);
              return;
            }
          } catch {
            setReferralInvalid('Invalid referral code');
            setShowReferralDecision(true);
            setShowReferralInput(true);
            return;
          }
        }
        // Referral valid or not provided → proceed
        onAuthSuccess();
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSubmit = async () => {
    if (!referralCode.trim()) {
      // No referral code provided, proceed directly
      onAuthSuccess();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Use the new database function to validate and apply referral code
      const { data, error } = await supabase.rpc('validate_and_apply_referral_code' as any, {
        p_user_id: user.id,
        p_referral_code: referralCode.trim().toUpperCase()
      });

      if (error) {
        console.error('Error applying referral code:', error);
        setError('Failed to apply referral code');
        setLoading(false);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0];
        if (result.success) {
          console.log('Referral code applied successfully:', result.message);
          onAuthSuccess();
        } else {
          setError(result.message);
          setLoading(false);
          return;
        }
      } else {
        setError('Failed to apply referral code');
        setLoading(false);
        return;
      }
    } catch (error: any) {
      console.error('Error applying referral code:', error);
      setError(error.message || 'An error occurred');
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

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setReferralCode('');
    setError('');
    setIsNewUser(false);
    setShowReferralInput(false);
  };

  const skipReferral = () => {
    onAuthSuccess();
  };

  const continueWithoutReferral = () => {
    setShowReferralDecision(false);
    setReferralInvalid(null);
    onAuthSuccess();
  };

  const reenterReferral = () => {
    setShowReferralDecision(false);
    setReferralInvalid(null);
    setShowReferralInput(true);
  };

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

          {/* Referral input on signup (optional, with auto-fill support) */}
          <div className="space-y-2 border rounded-md p-3 bg-muted/20">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Have a referral code? Enter it here"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
              className="text-center font-mono tracking-wider"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-center">Optional. Links like ?ref=CODE will auto-fill.</p>
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

          {/* If referral invalid, allow re-entry on the OTP screen */}
          {showReferralInput && (
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Re-enter referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                className="text-center font-mono tracking-wider"
                maxLength={20}
              />
              <div className="flex space-x-2">
                <Button type="button" variant="outline" className="flex-1" onClick={skipReferral} disabled={loading}>Skip</Button>
                <Button type="button" className="flex-1" onClick={handleReferralSubmit} disabled={loading}>
                  {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying...</>) : 'Apply & Continue'}
                </Button>
              </div>
            </div>
          )}
          
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

          {/* Decision dialog for invalid referral after OTP */}
          {showReferralDecision && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-center">Invalid Referral Code</CardTitle>
                  <CardDescription className="text-center">{referralInvalid || 'The referral code you entered is invalid.'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" onClick={reenterReferral}>Re-enter</Button>
                    <Button className="flex-1" onClick={continueWithoutReferral}>Continue without referral</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
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

  switch (step) {
    case 'phone':
      return renderPhoneStep();
    case 'otp':
      return renderOTPStep();
    default:
      return renderPhoneStep();
  }
};

export default SupabaseAuthFlow;