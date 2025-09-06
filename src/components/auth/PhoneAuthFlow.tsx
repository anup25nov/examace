import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const PhoneAuthFlow = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signOut } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate phone number
      if (!phone.trim() || phone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      // Send OTP using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setIsOtpSent(true);
        toast({
          title: "OTP Sent!",
          description: "Please check your phone for the verification code.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms'
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Create or update user profile
        try {
          await supabase
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              phone: phone,
              updated_at: new Date().toISOString()
            });
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
        }

        toast({
          title: "Welcome!",
          description: "You have been signed in successfully.",
        });
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "OTP Resent!",
          description: "Please check your phone for the new verification code.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setIsOtpSent(false);
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            {isOtpSent ? 'Verify Phone Number' : 'Sign In with Phone'}
          </CardTitle>
          <p className="text-muted-foreground text-center">
            {isOtpSent 
              ? 'Enter the verification code sent to your phone' 
              : 'Enter your phone number to get started'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    disabled={isLoading}
                    className="rounded-l-none"
                    maxLength={10}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || phone.length !== 10}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-sm text-muted-foreground text-center">
                  Code sent to +91{phone}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Resend OTP
                </Button>
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToPhone}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Change Phone Number
                  </Button>
                </div>
              </div>
            </form>
          )}

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
