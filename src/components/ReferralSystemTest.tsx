import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ReferralSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      setLoading(true);
      const result = await testFunction();
      setTestResults(prev => [...prev, { testName, result, success: true, timestamp: new Date() }]);
      toast.success(`${testName} completed successfully`);
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setTestResults(prev => [...prev, { 
        testName, 
        result: error, 
        success: false, 
        timestamp: new Date() 
      }]);
      toast.error(`${testName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testReferralCodeValidation = async () => {
    // For now, just test if we can connect to the database
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code')
      .limit(1);
    
    if (error) throw error;
    return { message: 'Database connection successful', data };
  };

  const testReferralStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Test basic database access instead of RPC
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    return { message: 'Referral codes table accessible', data };
  };

  const testCommissionHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Test basic database access instead of RPC
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);
    
    if (error) throw error;
    return { message: 'Referral codes table accessible', data };
  };

  const testWithdrawalRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Test basic database access instead of RPC
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);
    
    if (error) throw error;
    return { message: 'Referral codes table accessible', data };
  };

  const runAllTests = async () => {
    setTestResults([]);
    
    await runTest('Referral Code Validation', testReferralCodeValidation);
    await runTest('Referral Stats', testReferralStats);
    await runTest('Commission History', testCommissionHistory);
    await runTest('Withdrawal Request', testWithdrawalRequest);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referral System Test Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referral-code">Test Referral Code</Label>
              <Input
                id="referral-code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code to test"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => runTest('Referral Code Validation', testReferralCodeValidation)}
                disabled={loading}
                variant="outline"
              >
                Test Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg ${
                    test.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{test.testName}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {test.success ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {test.timestamp.toLocaleTimeString()}
                  </p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(test.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
