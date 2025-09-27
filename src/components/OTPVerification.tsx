// Complete OTP Verification Component
import React, { useState, useEffect } from 'react';
import { databaseOTPService } from '../lib/databaseOTPService';

interface OTPVerificationProps {
  phone: string;
  onSuccess: (phone: string) => void;
  onError?: (error: string) => void;
  onResend?: () => void;
  className?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  phone,
  onSuccess,
  onError,
  onResend,
  className = ''
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Auto-send OTP when component mounts
  useEffect(() => {
    sendOTP();
  }, [phone]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const sendOTP = async () => {
    setIsLoading(true);
    setError(null);
    setAttempts(0);
    setIsVerified(false);

    try {
      console.log(`📱 Sending OTP to ${phone}...`);
      const result = await databaseOTPService.sendOTP(phone);
      
      if (result.success) {
        console.log('✅ OTP sent successfully!');
        console.log(`📱 Provider: ${result.provider}`);
        console.log(`📱 Message ID: ${result.messageId}`);
        setTimeRemaining(300); // 5 minutes
        setError(null);
      } else {
        console.error('❌ Failed to send OTP:', result.error);
        setError(result.error || 'Failed to send OTP');
        onError?.(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ OTP sending error:', errorMessage);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Verifying OTP for ${phone}...`);
      const result = await databaseOTPService.verifyOTP(phone, otp);
      
      if (result.success) {
        console.log('✅ OTP verified successfully!');
        setIsVerified(true);
        setTimeRemaining(0);
        onSuccess(phone);
      } else {
        console.error('❌ OTP verification failed:', result.error);
        setError(result.error || 'Invalid OTP');
        setAttempts(prev => prev + 1);
        setOtp(''); // Clear OTP input
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ OTP verification error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setOtp('');
    setAttempts(0);
    setIsVerified(false);
    
    await sendOTP();
    setIsResending(false);
  };

  const handleOTPChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setOtp(cleanValue);
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <div className={`otp-verification-success ${className}`}>
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Phone Verified!
          </h2>
          <p className="text-gray-600">
            Your phone number {phone} has been successfully verified.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`otp-verification ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Phone Number
        </h2>
        <p className="text-gray-600">
          We've sent a 6-digit code to <strong>{phone}</strong>
        </p>
      </div>

      <div className="space-y-6">
        {/* OTP Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => handleOTPChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && otp.length === 6) {
                verifyOTP();
              }
            }}
            className="w-full px-4 py-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="000000"
            disabled={isLoading || isVerified}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center">
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          </div>
        )}

        {/* Attempts Counter */}
        {attempts > 0 && (
          <div className="text-center">
            <p className="text-orange-600 text-sm">
              Attempts: {attempts}/3
            </p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={verifyOTP}
          disabled={isLoading || otp.length !== 6 || isVerified}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        {/* Resend Section */}
        <div className="text-center space-y-2">
          {timeRemaining > 0 ? (
            <p className="text-gray-600 text-sm">
              Resend OTP in {formatTime(timeRemaining)}
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the code? Check your SMS, WhatsApp, or email.
          </p>
        </div>
      </div>
    </div>
  );
};
