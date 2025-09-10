import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Trophy,
  X,
  CreditCard,
  Loader2
} from 'lucide-react';
import { PremiumTest } from '@/lib/premiumService';

interface PremiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PremiumTest;
  onPurchaseSuccess: () => void;
}

export const PremiumPaymentModal: React.FC<PremiumPaymentModalProps> = ({
  isOpen,
  onClose,
  test,
  onPurchaseSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'test' | 'monthly' | 'yearly' | 'lifetime'>('test');

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, always succeed
      onPurchaseSuccess();
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      id: 'test',
      name: 'Single Test',
      price: test.price,
      description: `Access to ${test.name}`,
      features: test.benefits || [],
      popular: false
    },
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: 299,
      description: 'Access to all premium content',
      features: [
        'All premium mock tests',
        'All premium PYQ sets',
        'All practice sets',
        'Detailed analytics',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly Premium',
      price: 2999,
      description: 'Best value for serious aspirants',
      features: [
        'All premium content',
        'Detailed analytics',
        'Priority support',
        'Live doubt sessions',
        'Study materials'
      ],
      popular: false
    },
    {
      id: 'lifetime',
      name: 'Lifetime Access',
      price: 9999,
      description: 'One-time payment, lifetime access',
      features: [
        'All premium content forever',
        'All future updates',
        'Priority support',
        'Exclusive content',
        'Study materials'
      ],
      popular: false
    }
  ];

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
          {/* Test Info */}
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-yellow-800">{test.name}</h3>
                  <p className="text-sm text-yellow-700">{test.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-yellow-600">
                    <span>⏱️ {test.duration} min</span>
                    <span>📝 {test.questions} questions</span>
                    <span>📊 {test.difficulty}</span>
                  </div>
                </div>
                <Badge className="bg-yellow-500 text-white">
                  Premium
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? 'border-2 border-primary shadow-lg scale-105'
                      : 'border hover:border-primary/50'
                  } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => setSelectedPlan(plan.id as any)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      {plan.popular && (
                        <Badge className="mb-2 bg-yellow-500 text-white">
                          Most Popular
                        </Badge>
                      )}
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <div className="text-2xl font-bold text-primary mt-2">
                        ₹{plan.price}
                        {plan.id !== 'test' && <span className="text-sm text-muted-foreground">/month</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      
                      <div className="mt-4 space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Why Choose Premium?</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Trophy className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Better Performance</h4>
                    <p className="text-sm text-muted-foreground">Track your progress with detailed analytics</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Faster Learning</h4>
                    <p className="text-sm text-muted-foreground">Access to video solutions and explanations</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Priority Support</h4>
                    <p className="text-sm text-muted-foreground">Get help when you need it most</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <div className="flex justify-center">
            <Button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full max-w-md h-12 text-lg bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{plans.find(p => p.id === selectedPlan)?.price} & Unlock
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
