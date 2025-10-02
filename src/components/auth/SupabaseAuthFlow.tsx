import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, ArrowLeft, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import { 
  sendOTPCode, 
  verifyOTPCode
} from '@/lib/supabaseAuthSimple';
import OTPInput from './OTPInput';
import { supabase } from '@/integrations/supabase/client';
import { defaultConfig } from '@/config/appConfig';

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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [otpAutoFetched, setOtpAutoFetched] = useState(false);
  const otpContainerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard detection for mobile
  useEffect(() => {
    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      const keyboardOpen = heightDifference > 100; // Reduced threshold
      console.log('Keyboard detection:', { initialHeight, currentHeight, heightDifference, keyboardOpen });
      setIsKeyboardOpen(keyboardOpen);
    };

    // Initial check
    handleResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Auto-fetch OTP when step changes to OTP
  useEffect(() => {
    if (step === 'otp' && !otpAutoFetched) {
      // Simulate auto-fetching OTP (in real implementation, this would read from SMS)
      setTimeout(() => {
        // This is a demo - in real app, you'd use SMS reading APIs
        console.log('Auto-fetching OTP...');
        setOtpAutoFetched(true);
      }, 2000);
    }
  }, [step, otpAutoFetched]);

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
        // Go directly to dashboard for both new and existing users
        console.log('User authenticated - going to dashboard');
        onAuthSuccess();
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
    console.log('=== REFERRAL SUBMIT CLICKED ===');
    console.log('Referral code:', referralCode);
    console.log('Loading state before:', loading);
    setLoading(true);
    console.log('Loading state after:', true);
    setError('');
    setReferralInvalid('');

    try {
      // Get current user ID from localStorage (since we're using custom auth)
      console.log('Getting current user from localStorage...');
      const userId = localStorage.getItem('userId');
      console.log('Current user ID:', userId);
      
      if (!userId) {
        console.error('User not authenticated');
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      if (referralCode.trim()) {
        console.log('Validating referral code:', referralCode);
        console.log('User ID for referral application:', userId);
        
        // Use the database function to validate and apply referral code
        const { data, error } = await supabase.rpc('validate_and_apply_referral_code' as any, {
          p_user_id: userId,
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
            // Store referral code in localStorage for payment processing
            localStorage.setItem('referralCode', referralCode.trim().toUpperCase());
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
        console.log('Calling onAuthSuccess...');
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
    <div className="w-full max-w-md mx-auto">
      {/* Hero Section with Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 mb-6">
        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        
        {/* Main Content */}
        <div className="relative z-10 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
              <img 
                src="/logos/logo.jpeg" 
                alt="Step 2 Sarkari Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Step 2 Sarkari</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Your gateway to government exam success
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold text-center text-gray-800">
            Get Started
          </CardTitle>
          {/* <CardDescription className="text-center text-gray-600">
            Enter your phone number to begin your journey
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 z-10 pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 transition-all duration-200 rounded-xl"
                  maxLength={10}
                  required
                />
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Check WhatsApp for OTP</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
              disabled={loading || phone.length !== 10}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-5 w-5" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Features Section */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
          <div className="w-8 h-8 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm">✓</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Free Access</p>
        </div>
        <div className="text-center p-4 bg-white/60 rounded-xl backdrop-blur-sm">
          <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">📱</span>
          </div>
          <p className="text-sm font-medium text-gray-700">WhatsApp OTP</p>
        </div>
      </div>
    </div>
  );

  const renderOTPStep = () => (
    <div 
      ref={otpContainerRef}
      className={`w-full max-w-md mx-auto transition-all duration-300 ${
        isKeyboardOpen ? 'transform -translate-y-16' : ''
      }`}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 mb-6">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 text-center">
          {/* <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div> */}
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Verify Your Phone
          </h1>
          <p className="text-gray-600">
            Code sent to whatsapp <span className="font-semibold text-gray-800">+91{phone}</span>
          </p>
        </div>
      </div>

      {/* OTP Form Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <form onSubmit={handleOTPSubmit} className="space-y-6">
            {/* OTP Input Section */}
            <div className="space-y-4">
              <div className="text-center">
                <Label className="text-lg font-semibold text-gray-800 mb-4 block">
                  Enter Verification Code
                </Label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  disabled={loading}
                  className="my-4"
                />
              </div>

              {/* Auto-fetch indicator */}
              {/* {otpAutoFetched && (
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4" />
                  <span>OTP auto-detected from SMS</span>
                </div>
              )} */}
            </div>
            
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1 h-12 text-lg font-semibold rounded-xl"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Verify
                  </>
                )}
              </Button>
            </div>

            {/* Resend Section */}
            <div className="text-center pt-4 border-t border-gray-100">
              {canResend ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOTP}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                  disabled={loading}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Resend OTP
                </Button>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Resend OTP in {resendTimer}s</span>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderReferralStep = () => {
    console.log('=== RENDERING REFERRAL STEP ===');
    console.log('Current state:', {
      loading,
      referralCode,
      step,
      isNewUser
    });
    
    return (
    <div 
      className={`w-full max-w-md mx-auto transition-all duration-300 ${
        isKeyboardOpen ? 'transform -translate-y-8' : ''
      }`}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 mb-6">
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Welcome to Step 2 Sarkari!
          </h1>
          <p className="text-gray-600">
            Do you have a referral code?
          </p>
        </div>
      </div>

      {/* Referral Form Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Referral Code Input */}
            <div className="space-y-4">
              <div className="text-center">
                <Label htmlFor="referralCode" className="text-lg font-semibold text-gray-800 mb-4 block">
                  Referral Code (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                    className="text-center font-mono tracking-wider text-lg h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200 rounded-xl"
                    maxLength={20}
                  />
                  {referralCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {referralInvalid && (
                  <p className="text-sm text-red-600 text-center mt-2 bg-red-50 rounded-lg p-2">
                    {referralInvalid}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Stacked on mobile when keyboard is open */}
            <div className={`flex ${isKeyboardOpen ? 'flex-col space-y-3' : 'space-x-3'}`}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkipReferral}
                disabled={loading}
                className={`${isKeyboardOpen ? 'w-full' : 'flex-1'} h-12 text-lg font-semibold rounded-xl border-2 hover:bg-gray-50`}
              >
                Skip
              </Button>
              <Button 
                type="button" 
                onClick={(e) => {
                  console.log('=== BUTTON CLICKED ===');
                  console.log('Event:', e);
                  console.log('Loading state:', loading);
                  console.log('Referral code:', referralCode);
                  alert('Button clicked! Check console for details.');
                  handleReferralSubmit();
                }} 
                disabled={loading}
                className={`${isKeyboardOpen ? 'w-full' : 'flex-1'} h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Continue
                  </>
                )}
              </Button>
            </div>

            {/* Info Section */}
            <div className="text-center pt-4 border-t border-gray-100">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium">
                  💰 Earn <span className="font-bold text-blue-600">{defaultConfig.commission.percentage}%</span> commission by referring friends!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Share your referral code and earn money for each successful referral
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  console.log('=== RENDERING COMPONENT ===');
  console.log('Current step:', step);
  console.log('Component state:', {
    step,
    loading,
    referralCode,
    isNewUser,
    error,
    referralInvalid
  });

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