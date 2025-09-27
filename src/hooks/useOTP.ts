// React hook for OTP functionality
import { useState, useCallback } from 'react';
import { databaseOTPService } from '../lib/databaseOTPService';

export interface OTPState {
  isLoading: boolean;
  isVerified: boolean;
  error: string | null;
  attempts: number;
  timeRemaining: number;
}

export interface OTPActions {
  sendOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, otp: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export function useOTP(): OTPState & OTPActions {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const sendOTP = useCallback(async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setAttempts(0);
    setIsVerified(false);

    try {
      const result = await databaseOTPService.sendOTP(phone);
      
      if (result.success) {
        setTimeRemaining(300); // 5 minutes
        startCountdown();
        return true;
      } else {
        setError(result.error || 'Failed to send OTP');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await databaseOTPService.verifyOTP(phone, otp);
      
      if (result.success) {
        setIsVerified(true);
        setTimeRemaining(0);
        return true;
      } else {
        setError(result.error || 'Invalid OTP');
        setAttempts(prev => prev + 1);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsVerified(false);
    setError(null);
    setAttempts(0);
    setTimeRemaining(0);
  }, []);

  const startCountdown = useCallback(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  return {
    isLoading,
    isVerified,
    error,
    attempts,
    timeRemaining,
    sendOTP,
    verifyOTP,
    clearError,
    reset
  };
}
