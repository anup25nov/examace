// Razorpay Payment Modal - Complete Integration
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { paymentService } from '@/lib/paymentService';
import { razorpayClientService } from '@/lib/razorpayClientService';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface RazorpayPaymentModalProps {
  plan: {
    id: string;
    name: string;
    price: number;
    mockTests: number;
    description?: string;
  };
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

interface PaymentState {
  status: 'idle' | 'creating' | 'processing' | 'success' | 'failed';
  message: string;
  paymentId?: string;
  orderId?: string;
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  plan,
  onClose,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    message: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    razorpayClientService.loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!user) {
      setError('Please login to continue');
      return;
    }

    try {
      setPaymentState({ status: 'creating', message: 'Creating payment order...' });
      setError(null);

      // Create payment order
      const paymentResponse = await paymentService.createPayment({
        userId: user.id,
        plan: plan
      });

      if (!paymentResponse.success || !paymentResponse.paymentId || !paymentResponse.orderId) {
        throw new Error(paymentResponse.error || 'Failed to create payment order');
      }

      setPaymentState({
        status: 'processing',
        message: 'Opening payment gateway...',
        paymentId: paymentResponse.paymentId,
        orderId: paymentResponse.orderId
      });

      // Initialize Razorpay checkout without pre-created order
      const options = {
        key: razorpayClientService.getKeyId(),
        amount: paymentResponse.amount * 100, // Convert to paise
        currency: paymentResponse.currency,
        name: 'ExamAce',
        description: plan.name,
        // No order_id - Razorpay will create order automatically
        image: '/logo.png',
        handler: async (response: any) => {
          try {
            setPaymentState({ status: 'processing', message: 'Verifying payment...' });

            // Verify payment
            const verifyResponse = await paymentService.verifyPayment({
              paymentId: paymentResponse.paymentId!,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            if (!verifyResponse.success) {
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }

            // Activate membership
            const membershipActivated = await paymentService.activateMembership(
              user.id,
              plan.id
            );

            if (!membershipActivated) {
              console.warn('Payment verified but membership activation failed');
            }

            setPaymentState({
              status: 'success',
              message: 'Payment successful! Membership activated.',
              paymentId: paymentResponse.paymentId
            });

            // Call success callback after a short delay
            setTimeout(() => {
              onPaymentSuccess(paymentResponse.paymentId!);
              onClose();
            }, 2000);

          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentState({
              status: 'failed',
              message: 'Payment verification failed. Please contact support.'
            });
          }
        },
        prefill: {
          name: (user as any).user_metadata?.full_name || (user as any).user_metadata?.name || '',
          email: user.email || '',
          contact: (user as any).user_metadata?.phone || ''
        },
        theme: {
          color: '#2563eb',
          backdrop_color: '#000000',
          backdrop_opacity: 0.5
        },
        modal: {
          ondismiss: () => {
            if (paymentState.status === 'processing') {
              setPaymentState({ status: 'idle', message: '' });
            }
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 900,
        remember_customer: true
      };

      // Open Razorpay checkout
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response);
        setPaymentState({
          status: 'failed',
          message: `Payment failed: ${response.error.description || 'Unknown error'}`
        });
      });
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment initialization failed');
      setPaymentState({ status: 'idle', message: '' });
    }
  };

  const handleRetry = () => {
    setPaymentState({ status: 'idle', message: '' });
    setError(null);
  };

  const handleClose = () => {
    if (paymentState.status === 'processing') {
      if (confirm('Payment is in progress. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const renderPaymentButton = () => {
    switch (paymentState.status) {
      case 'creating':
        return (
          <Button disabled className="w-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Order...
          </Button>
        );
      case 'processing':
        return (
          <Button disabled className="w-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </Button>
        );
      case 'success':
        return (
          <Button disabled className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Payment Successful!
          </Button>
        );
      case 'failed':
        return (
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );
      default:
        return (
          <Button onClick={handlePayment} className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ₹{plan.price}
          </Button>
        );
    }
  };

  const renderStatusMessage = () => {
    if (paymentState.message) {
      const isError = paymentState.status === 'failed';
      const isSuccess = paymentState.status === 'success';
      
      return (
        <div className={`rounded-lg p-3 mb-4 ${
          isError ? 'bg-red-50 border border-red-200' :
          isSuccess ? 'bg-green-50 border border-green-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {isError ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : isSuccess ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
            <p className={`text-sm ${
              isError ? 'text-red-600' :
              isSuccess ? 'text-green-600' :
              'text-blue-600'
            }`}>
              {paymentState.message}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
        isMobile ? 'mx-2' : ''
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <p className="text-gray-600 text-sm mt-1">Secure payment powered by Razorpay</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Plan Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {plan.name}
                <Badge variant="secondary" className="ml-2">
                  {plan.mockTests} Tests
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mock Tests</span>
                  <span className="font-medium">{plan.mockTests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Validity</span>
                  <span className="font-medium">1 Month</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">₹{plan.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Message */}
          {renderStatusMessage()}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Button */}
          <div className="space-y-3">
            {renderPaymentButton()}

            {/* Security Info */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>256-bit SSL encrypted</span>
            </div>

            {/* Payment Methods */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Accepted payment methods:</p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500">
                <span>Credit/Debit Cards</span>
                <span>•</span>
                <span>Net Banking</span>
                <span>•</span>
                <span>UPI</span>
                <span>•</span>
                <span>Wallets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
