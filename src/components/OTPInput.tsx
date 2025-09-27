// OTP Input Component
import React, { useState, useRef, useEffect } from 'react';
import { useOTP } from '../hooks/useOTP';

interface OTPInputProps {
  phone: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  phone,
  onSuccess,
  onError,
  className = ''
}) => {
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const {
    isLoading,
    isVerified,
    error,
    attempts,
    timeRemaining,
    sendOTP,
    verifyOTP,
    clearError,
    reset
  } = useOTP();

  // Auto-send OTP when component mounts
  useEffect(() => {
    const sendInitialOTP = async () => {
      const success = await sendOTP(phone);
      if (!success && onError) {
        onError('Failed to send OTP');
      }
    };
    
    sendInitialOTP();
  }, [phone, sendOTP, onError]);

  // Handle OTP verification success
  useEffect(() => {
    if (isVerified) {
      onSuccess();
    }
  }, [isVerified, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = otp.split('');
    newOtp[index] = value;
    setOtp(newOtp.join(''));

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pastedData);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      onError?.('Please enter a 6-digit OTP');
      return;
    }

    const success = await verifyOTP(phone, otp);
    if (!success) {
      setOtp('');
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    clearError();
    reset();
    
    const success = await sendOTP(phone);
    if (!success && onError) {
      onError('Failed to resend OTP');
    }
    
    setIsResending(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`otp-input-container ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Phone Number
        </h2>
        <p className="text-gray-600">
          We've sent a 6-digit code to <strong>{phone}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-3">
          {Array.from({ length: 6 }, (_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={otp[index] || ''}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              disabled={isLoading || isVerified}
            />
          ))}
        </div>

        {error && (
          <div className="text-center">
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          </div>
        )}

        {attempts > 0 && (
          <div className="text-center">
            <p className="text-orange-600 text-sm">
              Attempts: {attempts}/3
            </p>
          </div>
        )}

        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading || otp.length !== 6 || isVerified}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Verifying...' : isVerified ? 'Verified!' : 'Verify OTP'}
          </button>
        </div>

        <div className="text-center space-y-2">
          {timeRemaining > 0 ? (
            <p className="text-gray-600 text-sm">
              Resend OTP in {formatTime(timeRemaining)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Didn't receive the code? Check your SMS or try resending.
        </p>
      </div>
    </div>
  );
};
