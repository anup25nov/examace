// OTP Test Page for Your Application
// Use this to test OTP functionality in your app

import React, { useState } from 'react';
import { databaseOTPService } from '../lib/databaseOTPService';

export const OTPTestPage: React.FC = () => {
  const [phone, setPhone] = useState('7050959444');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`📱 Sending OTP to ${phone}...`);
      const response = await databaseOTPService.sendOTP(phone);
      
      if (response.success) {
        setResult(`✅ OTP sent successfully! Provider: ${response.provider}, Message ID: ${response.messageId}`);
        console.log('✅ OTP sent:', response);
      } else {
        setError(`❌ Failed to send OTP: ${response.error}`);
        console.error('❌ OTP send failed:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`❌ Error: ${errorMessage}`);
      console.error('❌ OTP send error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🔍 Verifying OTP: ${otp} for ${phone}...`);
      const response = await databaseOTPService.verifyOTP(phone, otp);
      
      if (response.success) {
        setResult(`✅ OTP verified successfully! ${response.message}`);
        console.log('✅ OTP verified:', response);
        setOtp(''); // Clear OTP after successful verification
      } else {
        setError(`❌ OTP verification failed: ${response.error}`);
        console.error('❌ OTP verification failed:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`❌ Error: ${errorMessage}`);
      console.error('❌ OTP verification error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStats = async () => {
    try {
      const response = await databaseOTPService.getStats();
      setStats(response);
      console.log('📊 Stats:', response);
    } catch (err) {
      console.error('❌ Stats error:', err);
    }
  };

  const handleGetOTPStatus = async () => {
    try {
      const response = await databaseOTPService.getOTPStatus(phone);
      if (response) {
        setResult(`📱 OTP Status: ${JSON.stringify(response, null, 2)}`);
        console.log('📱 OTP Status:', response);
      } else {
        setResult('📱 No active OTP found for this phone number');
      }
    } catch (err) {
      console.error('❌ OTP Status error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        🧪 OTP Test Page
      </h1>

      {/* Phone Number Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          placeholder="Enter phone number"
        />
      </div>

      {/* Send OTP Button */}
      <div className="mb-6">
        <button
          onClick={handleSendOTP}
          disabled={loading || !phone}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : '📱 Send OTP'}
        </button>
      </div>

      {/* OTP Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center text-2xl font-bold"
            placeholder="000000"
            maxLength={6}
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading || !otp || otp.length !== 6}
            className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : '✅ Verify'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleGetStats}
          className="bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          📊 Get Stats
        </button>
        <button
          onClick={handleGetOTPStatus}
          className="bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors"
        >
          🔍 OTP Status
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <pre className="text-sm text-green-800 whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Stats Display */}
      {stats && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📊 Service Statistics</h3>
          <pre className="text-sm text-blue-800 whitespace-pre-wrap">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">📋 Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Enter a phone number (default: 7050959444)</li>
          <li>Click "Send OTP" to generate and send OTP</li>
          <li>Enter the 6-digit OTP and click "Verify"</li>
          <li>Use "Get Stats" to see service statistics</li>
          <li>Use "OTP Status" to check active OTPs</li>
        </ol>
        <p className="mt-2 text-xs">
          💡 <strong>Note:</strong> This uses the mock provider for testing. 
          Check browser console for detailed logs.
        </p>
      </div>
    </div>
  );
};
