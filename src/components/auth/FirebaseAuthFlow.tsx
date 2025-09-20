import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Phone, Key, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { 
  sendOTPCode, 
  verifyOTPCode, 
  checkUserStatus
} from '@/lib/supabaseAuth';
import { 
  setUserPIN, 
  verifyUserPIN
} from '@/lib/firebaseAuth';

interface SupabaseAuthFlowProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'phone' | 'otp' | 'pin-setup' | 'pin-login' | 'forgot-pin';

const SupabaseAuthFlow: React.FC<SupabaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [userStatus, setUserStatus] = useState<{ exists: boolean; hasPin: boolean } | null>(null);
  const [referralCode, setReferralCode] = useState('');

  // Check user status when phone is entered
  useEffect(() => {
    const checkStatus = async () => {
      if (phone.length === 10) {
        setLoading(true);
        try {
          const status = await checkUserStatus(phone);
          console.log('User status:', status);
          setUserStatus(status);
          
          if (status.exists && status.hasPin) {
            setStep('pin-login');
          } else if (status.exists && !status.hasPin) {
            setStep('pin-setup');
          }
        } catch (error) {
          console.error('Error checking user status:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(checkStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [phone]);

  // Capture referral code from URL (?ref=CODE) and prefill
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        const cleaned = ref.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
        setReferralCode(cleaned);
        // Store in localStorage for later use
        localStorage.setItem('pendingReferralCode', cleaned);
      }
    } catch {
      // ignore
    }
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await sendOTPCode(phone);
      if (result.success) {
        setStep('otp');
        setError(''); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
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
      if (result.success) {
        // Check if user has PIN set
        const status = await checkUserStatus(phone);
        if (status.exists && status.hasPin) {
          setStep('pin-login');
        } else {
          setStep('pin-setup');
        }
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const result = await setUserPIN(pin);
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Failed to set PIN');
      }
    } catch (error) {
      console.error('PIN setup error:', error);
      setError('Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePINLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyUserPIN(phone, pin);
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Invalid PIN');
      }
    } catch (error) {
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPIN = async () => {
    setStep('otp');
    setError('');
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setPin('');
    setConfirmPin('');
    setError('');
    setUserStatus(null);
  };

  const handleBackToPIN = () => {
    setStep('pin-login');
    setPin('');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-foreground">
            {step === 'phone' && 'Welcome to Step2Sarkari'}
            {step === 'otp' && 'Verify Phone Number'}
            {step === 'pin-setup' && 'Set Your PIN'}
            {step === 'pin-login' && 'Enter Your PIN'}
            {step === 'forgot-pin' && 'Reset PIN'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'phone' && 'Enter your phone number to get started'}
            {step === 'otp' && `We sent a 6-digit code to +91${phone}`}
            {step === 'pin-setup' && 'Create a 6-digit PIN for quick access'}
            {step === 'pin-login' && 'Enter your 6-digit PIN to continue'}
            {step === 'forgot-pin' && 'Verify your phone to reset PIN'}
          </CardDescription>
          
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant={error.includes('Development Mode') ? 'default' : 'destructive'}>
              <AlertDescription>
                {error}
                {error.includes('Development Mode') && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    This is a development environment. The OTP has been auto-filled for testing.
                  </div>
                )}
                {error.includes('OTP') && step === 'phone' && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setError('');
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Phone Number Input */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-10"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your 10-digit mobile number
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || phone.length !== 10}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToPhone}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || otp.length !== 6}>
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
            </form>
          )}

          {/* PIN Setup */}
          {step === 'pin-setup' && (
            <form onSubmit={handlePINSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Create PIN</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 pr-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? 'text' : 'password'}
                    placeholder="123456"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 pr-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                  >
                    {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Create a 6-digit PIN for quick access to your account
              </p>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToPhone}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set PIN'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* PIN Login */}
          {step === 'pin-login' && (
            <form onSubmit={handlePINLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter PIN</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="123456"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 pr-10 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Enter your 6-digit PIN to continue
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToPhone}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || pin.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>

              <Separator className="my-4" />

              <Button
                type="button"
                variant="ghost"
                onClick={handleForgotPIN}
                className="w-full text-sm"
              >
                Forgot PIN? Verify with OTP
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default SupabaseAuthFlow;
