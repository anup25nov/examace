import React from 'react';
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
  X,
  ArrowRight,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MembershipPlans } from './MembershipPlans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  limits: {
    maxTests: number;
    usedTests: number;
    remainingTests: number;
    planType: 'free' | 'pro' | 'pro_plus';
  };
  message?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  limits,
  message
}) => {
  const isMobile = useIsMobile();
  const [showMembershipPlans, setShowMembershipPlans] = React.useState(false);

  const getPlanIcon = () => {
    switch (limits.planType) {
      case 'pro':
        return <Crown className="w-6 h-6 text-blue-500" />;
      case 'pro_plus':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return <Star className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanName = () => {
    switch (limits.planType) {
      case 'pro':
        return 'Pro Plan';
      case 'pro_plus':
        return 'Pro+ Plan';
      default:
        return 'Free Plan';
    }
  };

  const getUpgradeOptions = () => {
    if (limits.planType === 'free') {
      return [
        {
          id: 'pro',
          name: 'Pro Plan',
          price: '₹99',
          duration: '3 months',
          tests: '11 mock tests',
          features: ['3 months validity', '11 mock tests', 'Premium PYQs', 'Detailed Solutions'],
          popular: false,
          color: 'from-blue-500 to-blue-600'
        },
        {
          id: 'pro_plus',
          name: 'Pro+ Plan',
          price: '₹299',
          duration: '12 months',
          tests: 'Unlimited tests',
          features: ['12 months validity', 'Unlimited mock tests', 'Premium PYQs', 'Priority Support'],
          popular: true,
          color: 'from-purple-500 to-purple-600'
        }
      ];
    } else if (limits.planType === 'pro') {
      return [
        {
          id: 'pro_plus',
          name: 'Pro+ Plan',
          price: '₹299',
          duration: '12 months',
          tests: 'Unlimited tests',
          features: ['12 months validity', 'Unlimited mock tests', 'Premium PYQs', 'Priority Support'],
          popular: true,
          color: 'from-purple-500 to-purple-600'
        }
      ];
    }
    return [];
  };

  const upgradeOptions = getUpgradeOptions();

  if (showMembershipPlans) {
    return (
      <MembershipPlans
        onSelectPlan={(plan) => {
          onUpgrade(plan.id);
          setShowMembershipPlans(false);
        }}
        onClose={() => setShowMembershipPlans(false)}
        currentPlan={limits.planType}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl ${isMobile ? 'mx-2' : ''}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <span>Upgrade Required</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan Status */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {getPlanIcon()}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{getPlanName()}</h3>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {limits.usedTests}/{limits.maxTests} tests used
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {message || 'You\'ve reached your plan limit. Upgrade to continue taking tests.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Choose Your Upgrade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                    option.popular ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => onUpgrade(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${option.color}`}>
                            <Crown className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{option.name}</h4>
                            <p className="text-sm text-gray-600">{option.duration}</p>
                          </div>
                        </div>
                        {option.popular && (
                          <Badge className="bg-purple-100 text-purple-800">Most Popular</Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">{option.price}</span>
                          <span className="text-sm text-gray-600">{option.tests}</span>
                        </div>
                        
                        <div className="space-y-1">
                          {option.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className={`w-full ${
                          option.popular 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to {option.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Why Upgrade?</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Unlimited Access</h5>
                  <p className="text-sm text-gray-600">Take as many tests as you need</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Premium Features</h5>
                  <p className="text-sm text-gray-600">Access to all advanced features</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Better Results</h5>
                  <p className="text-sm text-gray-600">Improve your exam performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
