import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, Lock, Key } from 'lucide-react';
import { 
  sendOTPCode, 
  verifyOTPCode
} from '@/lib/supabaseAuth';

interface SupabaseAuthFlowProps {
  onAuthSuccess: () => void;
}

type AuthStep = 'email' | 'otp';

const SupabaseAuthFlow: React.FC<SupabaseAuthFlowProps> = ({ onAuthSuccess }) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      // Always send OTP - no PIN concept
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
        // OTP verified successfully - proceed to app
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



  switch (step) {
    case 'email':
      return renderEmailStep();
    case 'otp':
      return renderOTPStep();
    default:
      return renderEmailStep();
  }
};

export default SupabaseAuthFlow;