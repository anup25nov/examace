import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  X, 
  ExternalLink,
  Shield
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SimpleUpiPayment } from './SimpleUpiPayment';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'upi';
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
    name: 'UPI QR Code',
    description: 'Scan QR code or use UPI apps to pay',
    icon: <QrCode className="w-6 h-6" />,
    type: 'upi'
  }
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  onClose,
  onPaymentSuccess
}) => {
  const isMobile = useIsMobile();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [paymentStep, setPaymentStep] = useState<'method' | 'upi'>('method');

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setPaymentStep('upi');
  };

  // Simple payment initiation - just go to UPI step
  const handlePaymentInitiate = () => {
    setPaymentStep('upi');
  };

  // Simple payment details - just show the plan info
  const renderPaymentDetails = () => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-2">{plan.mockTests} Mock Tests</p>
          <p className="text-2xl font-bold text-blue-600">₹{plan.price}</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-2">Payment Method:</h5>
          <p className="text-sm text-yellow-700">
            UPI QR Code - Scan with any UPI app or use UPI app buttons on mobile
          </p>
        </div>
      </div>
    );
  };


  if (paymentStep === 'upi') {
    return (
      <SimpleUpiPayment
        plan={{
          id: plan.id,
          name: plan.name,
          description: `Get access to ${plan.mockTests} mock tests`,
          price: plan.price,
          mockTests: plan.mockTests
        }}
        onPaymentSuccess={onPaymentSuccess}
        onClose={onClose}
      />
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
            <span>Secure UPI payment • No card details required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
