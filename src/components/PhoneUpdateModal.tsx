import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Phone, 
  X, 
  Check, 
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PhoneUpdateModalProps {
  currentPhone?: string;
  onClose: () => void;
  onPhoneUpdate: (phone: string) => void;
}

export const PhoneUpdateModal: React.FC<PhoneUpdateModalProps> = ({
  currentPhone,
  onClose,
  onPhoneUpdate
}) => {
  const isMobile = useIsMobile();
  const [phone, setPhone] = useState(currentPhone || '');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handlePhoneChange = (value: string) => {
    // Remove any non-digit characters
    const cleanPhone = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedPhone = cleanPhone.slice(0, 10);
    
    setPhone(limitedPhone);
    setIsValid(validatePhone(limitedPhone));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update phone number
      onPhoneUpdate(phone);
      onClose();
    } catch (error) {
      console.error('Error updating phone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneDisplay = (phoneNumber: string) => {
    if (phoneNumber.length === 0) return '';
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3)}`;
    return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md ${isMobile ? 'mx-2' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Update Phone Number</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600">
              {currentPhone 
                ? 'Update your phone number for better account security'
                : 'Add your phone number for account verification and notifications'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">+91</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="pl-12"
                maxLength={12} // Account for spaces in display
              />
            </div>
            
            {phone.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                {isValid ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Valid phone number</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">
                      {phone.length < 10 ? 'Enter 10-digit phone number' : 'Invalid phone number'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {currentPhone && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Phone Number</h4>
              <p className="text-sm text-gray-600">+91 {currentPhone}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Why do we need your phone number?</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Account security and verification</li>
                  <li>• Important notifications about your exams</li>
                  <li>• Payment confirmations</li>
                  <li>• Customer support</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {currentPhone ? 'Update' : 'Add'} Phone
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
