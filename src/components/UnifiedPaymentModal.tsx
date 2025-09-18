import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Trophy,
  X,
  CreditCard,
  Loader2,
  Smartphone,
  Globe,
  Lock
} from 'lucide-react';
import { unifiedPaymentService, PaymentPlan } from '@/lib/unifiedPaymentService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (planId: string) => void;
  testId?: string;
  testName?: string;
  testPrice?: number;
  testDescription?: string;
}

export const UnifiedPaymentModal: React.FC<UnifiedPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  testId,
  testName,
  testPrice,
  testDescription
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [userMembership, setUserMembership] = useState<any>(null);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  // Load plans and user membership
  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, membership] = await Promise.all([
        unifiedPaymentService.getPaymentPlans(),
        unifiedPaymentService.getUserMembership(user!.id)
      ]);
      
      setPlans(plansData);
      setUserMembership(membership);
      
      // If it's a single test purchase, select the test plan
      if (testId && testPrice) {
        setSelectedPlan('test');
      } else {
        // Select the most popular plan by default
        const popularPlan = plansData.find(p => p.id === 'premium') || plansData[0];
        setSelectedPlan(popularPlan?.id || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load payment options');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !window.Razorpay || !selectedPlan) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPaymentStep('processing');

      let planToPurchase: PaymentPlan;
      
      if (selectedPlan === 'test' && testId && testPrice) {
        // Single test purchase
        planToPurchase = {
          id: 'test',
          name: testName || 'Premium Test',
          description: testDescription || 'Access to this premium test',
          price: testPrice,
          currency: 'INR',
          features: ['Access to this test', 'Detailed solutions', 'Performance analytics'],
          duration: 1
        };
      } else {
        // Membership plan
        planToPurchase = plans.find(p => p.id === selectedPlan);
        if (!planToPurchase) {
          throw new Error('Selected plan not found');
        }
      }

      // Create payment
      const paymentResult = await unifiedPaymentService.createPayment(planToPurchase.id, user.id);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to create payment');
      }

      // Configure Razorpay options
      const options = {
        key: process.env.VITE_RAZORPAY_KEY_ID,
        amount: planToPurchase.price * 100, // Convert to paise
        currency: planToPurchase.currency,
        name: 'ExamAce',
        description: planToPurchase.name,
        order_id: paymentResult.orderId,
        prefill: {
          name: user.phone || '',
          email: '',
          contact: user.phone || '',
        },
        // Force UPI and QR only
        method: 'upi',
        config: {
          checkout: {
            method: {
              netbanking: '0',
              card: '0', 
              wallet: '0',
              upi: '1',
              emi: '0',
              paylater: '0'
            }
          },
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
            
            // Verify payment via Edge Function (includes referral processing)
            const { data, error } = await supabase.functions.invoke('verify_razorpay_payment', {
              body: {
                user_id: user.id,
                plan: planToPurchase.id,
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                referral_code: referralCode
              }
            });

            if (error || !data?.success) {
              throw new Error(error?.message || data?.error || 'Payment verification failed');
            }

            // Also update via unified service for consistency
            const verificationResult = await unifiedPaymentService.verifyPayment(
              paymentResult.paymentId!,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              planToPurchase.id
            );

            if (verificationResult.success) {
              setPaymentStep('success');
              setTimeout(() => {
                onPaymentSuccess(planToPurchase.id);
                onClose();
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
            setPaymentStep('select');
          },
        },
      };

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

  const getSelectedPlanDetails = (): PaymentPlan | null => {
    if (selectedPlan === 'test' && testId && testPrice) {
      return {
        id: 'test',
        name: testName || 'Premium Test',
        description: testDescription || 'Access to this premium test',
        price: testPrice,
        currency: 'INR',
        features: ['Access to this test', 'Detailed solutions', 'Performance analytics'],
        duration: 1
      };
    }
    return plans.find(p => p.id === selectedPlan) || null;
  };

  const selectedPlanDetails = getSelectedPlanDetails();

  if (paymentStep === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-gray-600">Please wait while we process your payment...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentStep === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-green-600">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your {selectedPlanDetails?.name} has been activated successfully.
            </p>
            <Button onClick={onClose} className="w-full">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (paymentStep === 'failed') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="p-8 text-center">
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
              <Button onClick={() => setPaymentStep('select')} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span>Unlock Premium Content</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Membership Status */}
          {userMembership && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Current Plan: {userMembership.plan_name}
                  </span>
                  <Badge className="bg-green-600 text-white">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Info (if single test purchase) */}
          {testId && testPrice && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-yellow-800">{testName}</h3>
                    <p className="text-sm text-yellow-700">{testDescription}</p>
                  </div>
                  <Badge className="bg-yellow-500 text-white">
                    Premium Test
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Single Test Option */}
              {testId && testPrice && (
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan === 'test'
                      ? 'border-2 border-primary shadow-lg scale-105'
                      : 'border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan('test')}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">Single Test</h4>
                      <div className="text-2xl font-bold text-primary mt-2">
                        {unifiedPaymentService.formatAmount(testPrice)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Access to this test only</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Membership Plans */}
              {plans.filter(p => p.id !== 'free').map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? 'border-2 border-primary shadow-lg scale-105'
                      : 'border hover:border-primary/50'
                  } ${plan.id === 'premium' ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      {plan.id === 'premium' && (
                        <Badge className="mb-2 bg-yellow-500 text-white">
                          Most Popular
                        </Badge>
                      )}
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <div className="text-2xl font-bold text-primary mt-2">
                        {unifiedPaymentService.formatAmount(plan.price)}
                        <span className="text-sm text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      
                      <div className="mt-4 space-y-2">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Plan Details */}
          {selectedPlanDetails && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedPlanDetails.name}</h4>
                    <p className="text-gray-600 text-sm">{selectedPlanDetails.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {unifiedPaymentService.formatAmount(selectedPlanDetails.price)}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedPlanDetails.currency}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Button */}
          <div className="flex justify-center">
            <Button
              onClick={handlePayment}
              disabled={loading || !selectedPlan || !window.Razorpay}
              className="w-full max-w-md h-12 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay {selectedPlanDetails ? unifiedPaymentService.formatAmount(selectedPlanDetails.price) : 'Now'} & Unlock
                </>
              )}
            </Button>
          </div>

          {/* Security Note */}
          <div className="text-center text-sm text-muted-foreground">
            <p>🔒 Secure payment powered by Razorpay</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
