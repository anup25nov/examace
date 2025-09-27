// Example usage of OTP Verification
import React, { useState } from 'react';
import { OTPVerification } from '../components/OTPVerification';

export const OTPExample: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone) {
      setShowOTP(true);
    }
  };

  const handleOTPSuccess = (verifiedPhone: string) => {
    console.log('✅ Phone verified:', verifiedPhone);
    setIsVerified(true);
    // Here you can redirect to dashboard or next step
  };

  const handleOTPError = (error: string) => {
    console.error('❌ OTP Error:', error);
    // Handle error (show toast, etc.)
  };

  const handleResend = () => {
    console.log('🔄 Resending OTP...');
    // You can add any additional logic here
  };

  if (isVerified) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-4">
          🎉 Verification Complete!
        </h2>
        <p className="text-green-700">
          Your phone number {phone} has been verified successfully.
        </p>
        <button
          onClick={() => {
            setPhone('');
            setShowOTP(false);
            setIsVerified(false);
          }}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Verify Another Number
        </button>
      </div>
    );
  }

  if (showOTP) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <OTPVerification
          phone={phone}
          onSuccess={handleOTPSuccess}
          onError={handleOTPError}
          onResend={handleResend}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setShowOTP(false);
              setPhone('');
            }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Change Phone Number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Phone Verification
      </h2>
      <p className="text-gray-600 mb-6">
        Enter your phone number to receive a verification code.
      </p>
      
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
};
