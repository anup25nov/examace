import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Smartphone, 
  Check, 
  X, 
  Copy, 
  ExternalLink,
  CreditCard,
  Banknote,
  Wallet,
  Clock
} from 'lucide-react';
import { simpleUpiService, UpiApp } from '@/lib/simpleUpiService';
import { paymentValidationService, PaymentValidationResult } from '@/lib/paymentValidationService';
import { useIsMobile } from '@/hooks/use-mobile';

interface SimpleUpiPaymentProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    mockTests: number;
  };
  onPaymentSuccess: (paymentId: string) => void;
  onClose: () => void;
}

export const SimpleUpiPayment: React.FC<SimpleUpiPaymentProps> = ({
  plan,
  onPaymentSuccess,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState<'qr' | 'validating' | 'success' | 'failed' | 'pending'>('qr');
  const [transactionId, setTransactionId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    generateQrCode();
  }, []);

  const generateQrCode = async () => {
    try {
      setLoading(true);
      const txId = simpleUpiService.generateTransactionId();
      setTransactionId(txId);
      
      const qrCodeDataUrl = await simpleUpiService.generateQrCode({
        amount: plan.price,
        transactionNote: `${plan.name} - ${plan.mockTests} Mock Tests`,
        transactionId: txId,
      });
      
      setQrCode(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiAppClick = (app: UpiApp) => {
    simpleUpiService.openUpiApp(app, {
      amount: plan.price,
      transactionNote: `${plan.name} - ${plan.mockTests} Mock Tests`,
      transactionId: transactionId,
    });
  };

  const handlePaymentComplete = async () => {
    try {
      setPaymentStep('validating');
      setValidationMessage('Creating payment record...');
      
      // Create payment record in database
      const { paymentId: newPaymentId, error: createError } = await paymentValidationService.createPaymentRecord(plan);
      
      if (createError || !newPaymentId) {
        setError(createError || 'Failed to create payment record');
        setPaymentStep('failed');
        return;
      }
      
      setPaymentId(newPaymentId);
      setValidationMessage('Validating payment...');
      
      // Start payment validation polling
      paymentValidationService.startPaymentValidation(newPaymentId, (result: PaymentValidationResult) => {
        setValidationMessage(result.message);
        
        switch (result.status) {
          case 'success':
            setPaymentStep('success');
            // Auto-redirect after 2 seconds
            setTimeout(() => {
              onPaymentSuccess(result.paymentId || newPaymentId);
            }, 2000);
            break;
            
          case 'pending':
            setPaymentStep('pending');
            break;
            
          case 'failed':
          case 'timeout':
            setError(result.error || result.message);
            setPaymentStep('failed');
            break;
        }
      });
      
    } catch (error) {
      console.error('Error in payment completion:', error);
      setError('Payment validation failed. Please try again.');
      setPaymentStep('failed');
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(simpleUpiService.getUpiId());
    // You could add a toast notification here
  };

  const getUpiApps = (): UpiApp[] => {
    return simpleUpiService.getUpiApps();
  };

  if (paymentStep === 'validating') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Validating Payment</h3>
            <p className="text-gray-600 mb-4">{validationMessage}</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm">Please wait while we verify your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStep === 'pending') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-yellow-600">Payment Pending</h3>
            <p className="text-gray-600 mb-4">{validationMessage}</p>
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Your payment is being processed. This may take a few minutes.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => setPaymentStep('qr')} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
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
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-green-600">🎉 Congratulations!</h3>
            <p className="text-gray-700 mb-2 text-lg">
              Your {plan.name} membership has been activated successfully!
            </p>
            <p className="text-gray-500 mb-6">
              You now have access to {plan.mockTests} mock tests and premium features.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">Redirecting to app in 2 seconds...</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
            <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
              Continue to App Now
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
              {error || 'Payment could not be verified. Please try again.'}
            </p>
            <div className="bg-red-50 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">
                Don't worry! You can try again or contact support if the issue persists.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setPaymentStep('qr');
                  setError(null);
                  setValidationMessage('');
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
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
                <p className="text-sm text-gray-500 mt-1">{plan.mockTests} Mock Tests</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {simpleUpiService.formatAmount(plan.price)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  UPI Payment
                </Badge>
              </div>
            </div>
          </div>

          {/* UPI ID Display */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Pay to UPI ID</p>
                <p className="text-lg font-mono text-blue-700">{simpleUpiService.getUpiId()}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyUpiId}
                className="text-blue-600 border-blue-200 hover:bg-blue-100"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center">
            <h4 className="font-medium mb-4">Scan QR Code to Pay</h4>
            {loading ? (
              <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center">
                <img src={qrCode} alt="UPI QR Code" className="w-60 h-60" />
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Scan this QR code with any UPI app to complete payment
            </p>
          </div>

          {/* Mobile UPI Apps */}
          {isMobile && (
            <div>
              <h4 className="font-medium mb-3">Or Pay with UPI App</h4>
              <div className="grid grid-cols-2 gap-3">
                {getUpiApps().map((app) => (
                  <Button
                    key={app.id}
                    variant="outline"
                    onClick={() => handleUpiAppClick(app)}
                    className="flex items-center space-x-3 p-4 h-auto"
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-sm">{app.name}</p>
                      <p className="text-xs text-gray-500">Tap to pay</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-800 mb-2">Payment Instructions:</h5>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Scan the QR code with your UPI app</li>
              <li>2. Verify the amount: {simpleUpiService.formatAmount(plan.price)}</li>
              <li>3. Complete the payment</li>
              <li>4. Click "I Have Made the Payment" to continue</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePaymentComplete}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              I Have Made the Payment
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
