import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { razorpayPaymentService } from '@/lib/razorpayPaymentService';

export const RazorpayDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testOrderCreation = async () => {
    setLoading(true);
    try {
      const paymentRequest = {
        planId: 'pro',
        planName: 'Pro',
        amount: 1,
        currency: 'INR',
        userId: 'debug-user-123',
        userEmail: 'debug@example.com',
        userName: 'Debug User',
      };

      console.log('Testing order creation...');
      const result = await razorpayPaymentService.createRazorpayPayment(paymentRequest);
      console.log('Order creation result:', result);
      
      setDebugInfo({
        success: result.success,
        orderId: result.orderId,
        keyId: result.keyId,
        amount: result.amount,
        currency: result.currency,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Order creation error:', error);
      setDebugInfo({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Razorpay Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testOrderCreation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Order Creation'}
        </Button>
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
