import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  IndianRupee, 
  CreditCard, 
  Smartphone, 
  Building2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { defaultConfig } from '@/config/appConfig';

interface WithdrawalRequestModalProps {
  availableAmount: number;
  onRequestSubmitted?: () => void;
  children?: React.ReactNode;
}

const paymentMethods = [
  { 
    value: 'phone_number', 
    label: 'Phone Number', 
    icon: Smartphone,
    description: 'Transfer to phone number (same or different)',
    fields: ['phone_number', 'phone_provider']
  },
  { 
    value: 'bank_transfer', 
    label: 'Bank Transfer', 
    icon: Building2,
    description: 'Direct bank account transfer',
    fields: ['account_holder_name', 'account_number', 'ifsc_code', 'bank_name']
  },
  { 
    value: 'upi', 
    label: 'UPI', 
    icon: Smartphone,
    description: 'UPI ID transfer',
    fields: ['upi_id']
  },
  { 
    value: 'paytm', 
    label: 'Paytm', 
    icon: CreditCard,
    description: 'Paytm wallet transfer',
    fields: ['paytm_number']
  }
];

export const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
  availableAmount,
  onRequestSubmitted,
  children
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [canRequest, setCanRequest] = useState(true);
  const [userPhone, setUserPhone] = useState('');

  // Check if user can make withdrawal request and get user phone
  useEffect(() => {
    const checkWithdrawalEligibility = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('can_make_withdrawal_request' as any, {
          user_uuid: user.id
        });
        
        if (!error) {
          setCanRequest(data);
        }

        // Get user's phone number
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('phone')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData?.phone) {
          setUserPhone(profileData.phone);
          // Set default phone number in payment details
          setPaymentDetails(prev => ({
            ...prev,
            phone_number: profileData.phone
          }));
        }
      } catch (error) {
        console.error('Error checking withdrawal eligibility:', error);
      }
    };

    checkWithdrawalEligibility();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to request withdrawal');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < defaultConfig.commission.minimumWithdrawal) {
      setError(`Minimum withdrawal amount is ₹${defaultConfig.commission.minimumWithdrawal}`);
      return;
    }

    if (amountValue > Math.min(availableAmount, defaultConfig.commission.maximumWithdrawal)) {
      setError(`Amount cannot exceed ₹${Math.min(availableAmount, defaultConfig.commission.maximumWithdrawal)}`);
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    const selectedMethodConfig = paymentMethods.find(m => m.value === selectedMethod);
    if (!selectedMethodConfig) {
      setError('Invalid payment method');
      return;
    }

    // Validate required fields
    for (const field of selectedMethodConfig.fields) {
      if (!paymentDetails[field]?.trim()) {
        setError(`Please fill in all required fields for ${selectedMethodConfig.label}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests' as any)
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          payment_method: selectedMethod,
          payment_details: paymentDetails
        });

      if (withdrawalError) {
        console.error('Error creating withdrawal request:', withdrawalError);
        setError('Failed to submit withdrawal request. Please try again.');
        return;
      }

      setSuccess(true);
      onRequestSubmitted?.();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setAmount('');
        setSelectedMethod('');
        setPaymentDetails({});
      }, 2000);
    } catch (error: any) {
      console.error('Error creating withdrawal request:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setSuccess(false);
      setAmount('');
      setSelectedMethod('');
      setPaymentDetails({});
      setError('');
    }
  };

  const handlePaymentDetailChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!canRequest) {
    return (
      <div className="text-center py-4">
        <Info className="w-8 h-8 text-blue-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          You have a pending withdrawal request. Please wait for it to be processed.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-green-600 hover:bg-green-700">
            <IndianRupee className="w-4 h-4 mr-2" />
            Request Withdrawal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-green-500" />
            <span>Request Withdrawal</span>
          </DialogTitle>
          <DialogDescription>
            Withdraw your referral earnings to your preferred payment method
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">Your withdrawal request has been submitted and will be processed within 2-3 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Available Balance */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Available Balance</p>
                    <p className="text-2xl font-bold text-green-700">₹{availableAmount.toFixed(2)}</p>
                  </div>
                  <IndianRupee className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to withdraw"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={defaultConfig.commission.minimumWithdrawal}
                max={Math.min(availableAmount, defaultConfig.commission.maximumWithdrawal)}
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500">
                Minimum withdrawal: ₹{defaultConfig.commission.minimumWithdrawal} | Maximum: ₹{Math.min(availableAmount, defaultConfig.commission.maximumWithdrawal).toFixed(2)}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Payment Method</Label>
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div
                      key={method.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedMethod(method.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedMethod === method.value
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedMethod === method.value && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{method.label}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Details */}
            {selectedMethod && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Payment Details</Label>
                {selectedMethod === 'phone_number' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="Enter phone number"
                        value={paymentDetails.phone_number || ''}
                        onChange={(e) => handlePaymentDetailChange('phone_number', e.target.value)}
                        required
                      />
                      {userPhone && (
                        <p className="text-xs text-gray-500">
                          Your registered number: {userPhone} (you can use a different number)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_provider">Phone Provider</Label>
                      <select
                        id="phone_provider"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        value={paymentDetails.phone_provider || ''}
                        onChange={(e) => handlePaymentDetailChange('phone_provider', e.target.value)}
                        required
                      >
                        <option value="">Select provider</option>
                        <option value="jio">Jio</option>
                        <option value="airtel">Airtel</option>
                        <option value="vi">Vi (Vodafone Idea)</option>
                        <option value="bsnl">BSNL</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}
                {selectedMethod !== 'phone_number' && paymentMethods
                  .find(m => m.value === selectedMethod)
                  ?.fields.map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field} className="capitalize">
                        {field.replace(/_/g, ' ')}
                      </Label>
                      <Input
                        id={field}
                        type={field.includes('number') ? 'tel' : 'text'}
                        placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                        value={paymentDetails[field] || ''}
                        onChange={(e) => handlePaymentDetailChange(field, e.target.value)}
                        required
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Terms and Conditions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Terms:</strong> Withdrawal requests are processed within 2-3 business days. 
                Processing fees may apply. You can only have one pending withdrawal request at a time.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !amount || !selectedMethod}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalRequestModal;
