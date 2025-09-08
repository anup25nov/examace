import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield,
  X,
  ArrowRight
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  mockTests: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface MembershipPlansProps {
  onSelectPlan: (plan: MembershipPlan) => void;
  onClose: () => void;
  currentPlan?: string;
}

const membershipPlans: MembershipPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Perfect for getting started',
    price: 30,
    originalPrice: 50,
    mockTests: 10,
    features: [
      '10 Mock Tests',
      'Detailed Solutions',
      'Performance Analytics',
      '30 Days Access',
      'Email Support'
    ],
    icon: <Star className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Most popular choice',
    price: 49,
    originalPrice: 99,
    mockTests: 25,
    features: [
      '25 Mock Tests',
      'Detailed Solutions',
      'Performance Analytics',
      '60 Days Access',
      'Priority Support',
      'Study Materials',
      'Progress Tracking'
    ],
    popular: true,
    icon: <Crown className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Maximum value for serious learners',
    price: 99,
    originalPrice: 199,
    mockTests: 50,
    features: [
      '50 Mock Tests',
      'Detailed Solutions',
      'Performance Analytics',
      '90 Days Access',
      '24/7 Support',
      'Study Materials',
      'Progress Tracking',
      'Personalized Recommendations',
      'Exam Strategies'
    ],
    icon: <Zap className="w-6 h-6" />,
    color: 'text-gold-600',
    bgColor: 'bg-yellow-50 border-yellow-200'
  }
];

export const MembershipPlans: React.FC<MembershipPlansProps> = ({
  onSelectPlan,
  onClose,
  currentPlan
}) => {
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto ${isMobile ? 'mx-2' : ''}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600 mt-1">Unlock premium features and accelerate your exam preparation</p>
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

        {/* Plans Grid */}
        <div className={`p-6 ${isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-6'}`}>
          {membershipPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-lg' : ''
              } ${currentPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className={`text-center ${plan.bgColor} rounded-t-lg`}>
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.bgColor}`}>
                    <div className={plan.color}>
                      {plan.icon}
                    </div>
                  </div>
                </div>
                
                <CardTitle className={`text-xl ${plan.color}`}>
                  {plan.name}
                </CardTitle>
                
                <p className="text-gray-600 text-sm">
                  {plan.description}
                </p>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ₹{plan.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {plan.mockTests} Mock Tests
                  </p>
                  {plan.originalPrice && (
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full mt-6 ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan);
                  }}
                >
                  {currentPlan === plan.id ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              All plans include 7-day money-back guarantee
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
