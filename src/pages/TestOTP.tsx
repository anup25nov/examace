// Test OTP Page Route
// Add this to your routing system

import React from 'react';
import { OTPTestPage } from '../components/OTPTestPage';

const TestOTP: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <OTPTestPage />
      </div>
    </div>
  );
};

export default TestOTP;
