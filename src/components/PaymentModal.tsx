import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  X, 
  Check, 
  Copy,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'upi' | 'qr' | 'card';
}

interface PaymentModalProps {
  plan: {
    id: string;
    name: string;
    price: number;
    mockTests: number;
  };
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'upi',
    name: 'UPI Payment',
    description: 'Pay using UPI apps like PhonePe, Google Pay, Paytm',
    icon: <Smartphone className="w-6 h-6" />,
    type: 'upi'
  },
  {
    id: 'qr',
    name: 'QR Code',
    description: 'Scan QR code with any UPI app',
    icon: <QrCode className="w-6 h-6" />,
    type: 'qr'
  },
  {
    id: 'card',
    name: 'Card Payment',
    description: 'Credit/Debit card payment',
    icon: <CreditCard className="w-6 h-6" />,
    type: 'card'
  }
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  onClose,
  onPaymentSuccess
}) => {
  const isMobile = useIsMobile();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [upiId, setUpiId] = useState('examace@paytm');
  const [paymentId, setPaymentId] = useState('');

  // Generate a unique payment ID
  useEffect(() => {
    const id = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setPaymentId(id);
  }, []);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentStep('details');
  };

  const handlePaymentInitiate = async () => {
    setPaymentStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStep('success');
      // In real implementation, you would integrate with Razorpay or similar
      onPaymentSuccess(paymentId);
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const renderPaymentDetails = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    switch (selectedMethod) {
      case 'upi':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">UPI Payment Details</h3>
              <p className="text-gray-600 mb-4">Send payment to the following UPI ID:</p>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">UPI ID</p>
                    <p className="text-lg font-mono font-semibold">{upiId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(upiId)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-xl font-bold text-green-600">₹{plan.price}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(plan.price.toString())}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Payment Instructions</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>1. Open your UPI app (PhonePe, Google Pay, Paytm)</li>
                    <li>2. Send money to: <strong>{upiId}</strong></li>
                    <li>3. Amount: <strong>₹{plan.price}</strong></li>
                    <li>4. Add note: <strong>{paymentId}</strong></li>
                    <li>5. Complete the payment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">QR Code Payment</h3>
              <p className="text-gray-600 mb-4">Scan the QR code with any UPI app</p>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  QR Code for ₹{plan.price}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">How to Pay</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>1. Open any UPI app on your phone</li>
                    <li>2. Tap on "Scan QR Code"</li>
                    <li>3. Scan the QR code above</li>
                    <li>4. Verify amount: ₹{plan.price}</li>
                    <li>5. Complete the payment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Card Payment</h3>
              <p className="text-gray-600 mb-4">Secure payment powered by Razorpay</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <p className="text-blue-800 font-medium">Redirecting to secure payment gateway...</p>
              <p className="text-blue-600 text-sm mt-2">You will be redirected to Razorpay for secure card payment</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (paymentStep === 'processing') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your {plan.name} has been activated successfully.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Payment ID: {paymentId}
            </p>
            <Button onClick={onClose} className="w-full">
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isMobile ? 'mx-2' : ''}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
              <p className="text-gray-600 mt-1">{plan.name} - ₹{plan.price}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {paymentStep === 'method' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
              <div className="grid grid-cols-1 gap-4">
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {renderPaymentDetails()}
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setPaymentStep('method')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePaymentInitiate}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Pay ₹{plan.price}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Secure payment powered by Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
};
