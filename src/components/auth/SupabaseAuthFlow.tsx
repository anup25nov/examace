import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, Lock, Key } from 'lucide-react';
import { 
  sendOTPCode, 
  verifyOTPCode, 
  checkUserStatus,
  verifyPIN,
  setUserPIN
} from '@/lib/supabaseAuth';

interface SupabaseAuthFlowProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'email' | 'otp' | 'pin-setup' | 'pin-login' | 'forgot-pin';

const SupabaseAuthFlow: React.FC<SupabaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [userId, setUserId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user exists and has PIN
      const status = await checkUserStatus(email);
      setUserExists(status.exists);
      setHasPin(status.hasPin || false);

      if (status.exists && status.hasPin) {
        // User exists and has PIN - go to PIN login
        setStep('pin-login');
      } else {
        // New user or user without PIN - send OTP
        const result = await sendOTPCode(email);
        if (result.success) {
          setStep('otp');
          setError('');
        } else {
          setError(result.error || 'Failed to send OTP');
        }
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
      const result = await verifyOTPCode(email, otp);
      if (result.success && result.data) {
        setUserId(result.data.id);
        
        if (userExists && !hasPin) {
          // Existing user without PIN - go to PIN setup
          setStep('pin-setup');
        } else if (!userExists) {
          // New user - go to PIN setup
          setStep('pin-setup');
        } else {
          // Should not happen, but handle gracefully
          onAuthSuccess();
        }
      } else {
        setError(result.error || 'Invalid OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await setUserPIN(userId, pin);
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Failed to set PIN');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handlePINLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyPIN(email, pin);
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Invalid PIN');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPIN = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await sendOTPCode(email);
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

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await sendOTPCode(email);
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
    setStep('email');
    setEmail('');
    setOtp('');
    setPin('');
    setConfirmPin('');
    setError('');
    setUserExists(false);
    setHasPin(false);
    setUserId('');
  };

  const renderEmailStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome to ExamAce</CardTitle>
        <CardDescription className="text-center">
          Enter your email to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
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
                Checking...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderOTPStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verify Email</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              required
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

  const renderPINSetupStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Set Your PIN</CardTitle>
        <CardDescription className="text-center">
          Create a 6-digit PIN for quick login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePINSetup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="pin"
                type="password"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="pl-10 text-center text-lg tracking-widest"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPin"
                type="password"
                placeholder="Confirm 6-digit PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="pl-10 text-center text-lg tracking-widest"
                required
              />
            </div>
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
                Setting PIN...
              </>
            ) : (
              'Set PIN & Continue'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderPINLoginStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Enter Your PIN</CardTitle>
        <CardDescription className="text-center">
          Welcome back! Enter your 6-digit PIN
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePINLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="pin"
                type="password"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="pl-10 text-center text-lg tracking-widest"
                required
              />
            </div>
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
                'Login'
              )}
            </Button>
          </div>
          
          <Button
            type="button"
            variant="link"
            onClick={handleForgotPIN}
            className="w-full text-sm"
            disabled={loading}
          >
            Forgot PIN? Reset with OTP
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  switch (step) {
    case 'email':
      return renderEmailStep();
    case 'otp':
      return renderOTPStep();
    case 'pin-setup':
      return renderPINSetupStep();
    case 'pin-login':
      return renderPINLoginStep();
    default:
      return renderEmailStep();
  }
};

export default SupabaseAuthFlow;