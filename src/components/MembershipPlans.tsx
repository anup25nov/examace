import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { membershipPlansService, MembershipPlan as BackendPlan } from '@/lib/membershipPlansService';
import { RazorpayPaymentModal } from './RazorpayPaymentModal';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  duration_months: number;
  currency: string;
}

interface MembershipPlansProps {
  onSelectPlan: (plan: MembershipPlan) => void;
  onClose: () => void;
  currentPlan?: string;
}

// Helper function to get plan styling
const getPlanStyling = (planId: string) => {
  switch (planId) {
    case 'free':
      return {
        icon: <Star className="w-6 h-6" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200'
      };
    case 'monthly':
      return {
        icon: <Star className="w-6 h-6" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      };
    case 'yearly':
      return {
        icon: <Crown className="w-6 h-6" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200'
      };
    case 'lifetime':
      return {
        icon: <Zap className="w-6 h-6" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200'
      };
    default:
      return {
        icon: <Star className="w-6 h-6" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200'
      };
  }
};

export const MembershipPlans: React.FC<MembershipPlansProps> = ({
  onSelectPlan,
  onClose,
  currentPlan
}) => {
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<MembershipPlan | null>(null);

  // Load plans from backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await membershipPlansService.getMembershipPlans();
        
        if (response.success && response.plans) {
          // Convert backend plans to frontend format
          const convertedPlans: MembershipPlan[] = response.plans
            .filter(plan => plan.id !== 'free') // Exclude free plan from payment options
            .map(plan => {
              const styling = getPlanStyling(plan.id);
              return {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                features: plan.features,
                popular: plan.id === 'yearly', // Mark yearly as popular
                icon: styling.icon,
                color: styling.color,
                bgColor: styling.bgColor,
                duration_months: plan.duration_months,
                currency: plan.currency
              };
            });
          
          setPlans(convertedPlans);
        } else {
          setError(response.error || 'Failed to load plans');
        }
      } catch (err) {
        setError('Failed to load membership plans');
        console.error('Error loading plans:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan);
  };

  const handleBuyPlan = (plan: MembershipPlan) => {
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentModal(false);
    setSelectedPlanForPayment(null);
    // You can add success handling here
    console.log('Payment successful:', paymentId);
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
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading plans...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <X className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Failed to load plans</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg h-full flex flex-col ${
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
                      {membershipPlansService.formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {membershipPlansService.formatPrice(plan.originalPrice, plan.currency)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {membershipPlansService.getDurationDisplay(plan.duration_months)}
                  </p>
                  {plan.originalPrice && (
                    <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                      {Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
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
                    handleBuyPlan(plan);
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
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              All plans include 7-day money-back guarantee
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Secure payment powered by Razorpay • All major cards & UPI accepted
            </p>
          </div>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      {showPaymentModal && selectedPlanForPayment && (
        <RazorpayPaymentModal
          plan={{
            id: selectedPlanForPayment.id,
            name: selectedPlanForPayment.name,
            price: selectedPlanForPayment.price,
            mockTests: 50, // You can adjust this based on your plan
            description: selectedPlanForPayment.description
          }}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
