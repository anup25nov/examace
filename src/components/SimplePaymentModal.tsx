import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, QrCode } from 'lucide-react';
import { SimpleUpiPayment } from './SimpleUpiPayment';

interface SimplePaymentModalProps {
  plan: {
    id: string;
    name: string;
    price: number;
    mockTests: number;
  };
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

export const SimplePaymentModal: React.FC<SimplePaymentModalProps> = ({
  plan,
  onClose,
  onPaymentSuccess,
}) => {
  const [showUpiPayment, setShowUpiPayment] = useState(false);

  if (showUpiPayment) {
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Choose Your Plan</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-gray-600 text-sm">{plan.mockTests} Mock Tests</p>
                <p className="text-sm text-gray-500 mt-1">Unlimited access</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₹{plan.price}</p>
                <Badge variant="secondary" className="mt-1">
                  UPI Payment
                </Badge>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-medium mb-3">What you get:</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{plan.mockTests} Mock Tests</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Detailed Analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Performance Tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Priority Support</span>
              </li>
            </ul>
          </div>

          {/* Payment Method */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <QrCode className="w-6 h-6 text-blue-600" />
              <div>
                <h5 className="font-medium text-blue-900">UPI QR Code Payment</h5>
                <p className="text-sm text-blue-700">
                  Scan QR code or use UPI apps to pay securely
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => setShowUpiPayment(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Pay ₹{plan.price}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure UPI payment • No card details required
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
