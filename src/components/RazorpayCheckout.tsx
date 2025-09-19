import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, CreditCard, Smartphone, Globe } from 'lucide-react';
import { razorpayPaymentService, RazorpayPaymentRequest } from '@/lib/razorpayPaymentService';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    features: string[];
  };
  onPaymentSuccess: (paymentId: string) => void;
  onClose: () => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  plan,
  onPaymentSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'init' | 'processing' | 'success' | 'failed'>('init');

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!user || !window.Razorpay) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPaymentStep('processing');

      console.log('Creating payment for plan:', plan);
      
      // Create Razorpay payment
      const paymentRequest: RazorpayPaymentRequest = {
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency,
        userId: user.id,
        userEmail: '',
        userName: (profile as any)?.name || '',
      };

      console.log('Payment request:', paymentRequest);
      const paymentResult = await razorpayPaymentService.createRazorpayPayment(paymentRequest);
      console.log('Payment result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to create payment');
      }

      if (!paymentResult.keyId) {
        throw new Error('Razorpay key not available. Please try again.');
      }

      // Configure Razorpay options for UPI and QR only
      const options = {
        key: paymentResult.keyId,
        amount: plan.price * 100, // Convert to paise
        currency: plan.currency,
        name: 'ExamAce',
        description: plan.name,
        order_id: paymentResult.orderId,
        prefill: {
          name: (profile as any)?.name || user.phone || '',
          email: '',
          contact: (profile as any)?.phone || user.phone || '',
        },
        // Enable UPI and QR code
        config: {
          display: {
            hide: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
              { method: 'emi' },
              { method: 'paylater' }
            ]
          },
        },
        // Enable UPI QR code
        upi: {
          flow: 'qr'
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: any) => {
          try {
            // Get referral code from localStorage if available
            const referralCode = localStorage.getItem('referralCode');
            
            // Verify payment
            const verificationResult = await razorpayPaymentService.verifyRazorpayPayment(
              paymentResult.paymentId!,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              plan.id === 'pro_plus' ? 'pro_plus' : 'pro',
              referralCode || undefined
            );

            if (verificationResult.success) {
              setPaymentStep('success');
              setTimeout(() => {
                onPaymentSuccess(paymentResult.paymentId!);
              }, 2000);
            } else {
              setPaymentStep('failed');
              setError(verificationResult.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStep('failed');
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPaymentStep('init');
          },
        },
      };

      console.log('Razorpay options:', options);
      console.log('Opening Razorpay checkout...');

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethods = () => [
    {
      id: 'upi',
      name: 'UPI',
      description: 'PhonePe, Google Pay, Paytm, BHIM',
      icon: <Smartphone className="w-6 h-6" />,
      color: 'text-blue-600',
    },
    {
      id: 'qr',
      name: 'QR Code',
      description: 'Scan QR with any UPI app',
      icon: <Globe className="w-6 h-6" />,
      color: 'text-green-600',
    },
  ];

  if (paymentStep === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-gray-600">Please wait while we process your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-green-600">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your {plan.name} membership has been activated successfully.
            </p>
            <Button onClick={onClose} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStep === 'failed') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">Payment Failed</h3>
            <p className="text-gray-600 mb-4">
              {error || 'Payment could not be processed. Please try again.'}
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setPaymentStep('init')} className="flex-1">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {razorpayPaymentService.formatAmount(plan.price)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {plan.currency}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-medium mb-3">Payment Methods</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getPaymentMethods().map((method) => (
                <div
                  key={method.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className={method.color}>{method.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{method.name}</p>
                    <p className="text-xs text-gray-600">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium mb-3">What you get:</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={loading || !window.Razorpay}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${razorpayPaymentService.formatAmount(plan.price)}`
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure payment powered by Razorpay
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
