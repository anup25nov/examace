import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PerfectModal } from '@/components/PerfectModal';
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
  const [pendingAmountAvailable, setPendingAmountAvailable] = useState<number | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<number>(0);

  // Check if user can make withdrawal request
  useEffect(() => {
    const checkWithdrawalEligibility = async () => {
      if (!user) return;
      
      try {
        // Get total earnings from referral stats
        const { data: statsData, error: statsError } = await supabase.rpc('get_referral_stats' as any, {
          p_user_id: user.id
        });
        
        // Get pending withdrawals (if table exists)
        let pendingAmount = 0;
        try {
          const { data: withdrawalsData, error: withdrawalsError } = await supabase
            .from('withdrawal_requests' as any)
            .select('amount')
            .eq('user_id', user.id)
            .in('status', ['pending', 'approved']);
          
          if (!withdrawalsError && withdrawalsData) {
            pendingAmount = withdrawalsData.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
          }
        } catch (error) {
          console.log('Withdrawal requests table not found, assuming no pending withdrawals');
        }
        
        if (!statsError && statsData && statsData.length > 0) {
          const stats = statsData[0];
          const totalEarnings = stats.total_earnings || 0;
          
          // Set pending withdrawals
          setPendingWithdrawals(pendingAmount);
          
          // Calculate pending amount available for withdrawal (total earnings - pending withdrawals)
          const pendingAmountForWithdrawal = Math.max(0, totalEarnings - pendingAmount);
          setPendingAmountAvailable(pendingAmountForWithdrawal);
          
          // Check if user can withdraw (pending amount >= minimum withdrawal)
          const minimumWithdrawal = defaultConfig.commission.minimumWithdrawal;
          setCanRequest(pendingAmountForWithdrawal >= minimumWithdrawal);
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

    const currentPendingAmount = pendingAmountAvailable !== null ? pendingAmountAvailable : availableAmount;
    if (amountValue > Math.min(currentPendingAmount, defaultConfig.commission.maximumWithdrawal)) {
      setError(`Amount cannot exceed ₹${Math.min(currentPendingAmount, defaultConfig.commission.maximumWithdrawal)}`);
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
      // Use the proper RPC function for withdrawal request
      const { data, error: withdrawalError } = await supabase.rpc('request_commission_withdrawal' as any, {
        p_user_id: user.id,
        p_amount: parseFloat(amount),
        p_payment_method: selectedMethod,
        p_account_details: JSON.stringify(paymentDetails)
      });

      if (withdrawalError) {
        console.error('Error creating withdrawal request:', withdrawalError);
        setError('Failed to submit withdrawal request. Please try again.');
        return;
      }

      if (data && data.length > 0 && !data[0].success) {
        setError(data[0].message || 'Failed to submit withdrawal request');
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
    <>
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <Button className="bg-green-600 hover:bg-green-700">
            <IndianRupee className="w-4 h-4 mr-2" />
            Request Withdrawal
          </Button>
        )}
      </div>
      
      <PerfectModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Request Withdrawal"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="text-center text-gray-600 mb-4">
            Withdraw your referral earnings to your preferred payment method
          </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">Your withdrawal request has been submitted and will be processed within 2-3 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pending Amount Available for Withdrawal */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Pending Amount Available</p>
                    <p className="text-2xl font-bold text-green-700">₹{(pendingAmountAvailable || 0).toFixed(2)}</p>
                    {pendingWithdrawals > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Total earnings: ₹{((pendingAmountAvailable || 0) + pendingWithdrawals).toFixed(2)} | Already requested: ₹{pendingWithdrawals.toFixed(2)}
                      </p>
                    )}
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
                max={Math.min(pendingAmountAvailable !== null ? pendingAmountAvailable : availableAmount, defaultConfig.commission.maximumWithdrawal)}
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500">
                Minimum withdrawal: ₹{defaultConfig.commission.minimumWithdrawal} | Maximum: ₹{Math.min(pendingAmountAvailable !== null ? pendingAmountAvailable : availableAmount, defaultConfig.commission.maximumWithdrawal).toFixed(2)}
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
                {paymentMethods
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
        </div>
      </PerfectModal>
    </>
  );
};

export default WithdrawalRequestModal;
