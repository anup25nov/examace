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
import { RazorpayCheckout } from './RazorpayCheckout';
import { messagingService } from '@/lib/messagingService';
import { getActiveMembershipPlans, getMembershipPlan } from '@/config/appConfig';

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

  // Load plans from centralized configuration
  useEffect(() => {
    setLoading(true);
    try {
      const configPlans = getActiveMembershipPlans();
      
      // Convert config plans to component format
      const allPlans: MembershipPlan[] = configPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.id === 'pro_plus' ? 'Complete access to all mocks and features' : 
                     plan.id === 'pro' ? 'Access to 11 mock tests' : 
                     'Limited access to practice tests',
        price: plan.price,
        originalPrice: plan.originalPrice,
        features: plan.features,
        popular: plan.popular || false,
        icon: <Crown className="w-6 h-6" />,
        color: plan.id === 'pro_plus' ? 'text-purple-600' : 
               plan.id === 'pro' ? 'text-blue-600' : 'text-gray-600',
        bgColor: plan.id === 'pro_plus' ? 'bg-purple-50 border-purple-200' : 
                 plan.id === 'pro' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200',
        duration_months: Math.round(plan.duration / 30), // Convert days to months
        currency: 'INR'
      }));
      
      // Filter plans based on current subscription
      let availablePlans: MembershipPlan[] = [];
      
      console.log('Current user plan:', currentPlan);
      
      if (!currentPlan || currentPlan === 'free') {
        // Show Pro and Pro+ for free users
        availablePlans = allPlans.filter(plan => plan.id !== 'free');
        console.log('Free user - showing plans:', availablePlans.map(p => p.id));
      } else if (currentPlan === 'pro') {
        // Show only Pro+ for Pro users (upgrade option) - hide Pro plan
        availablePlans = allPlans.filter(plan => plan.id === 'pro_plus');
        console.log('Pro user - showing upgrade plans:', availablePlans.map(p => p.id));
      } else if (currentPlan === 'pro_plus') {
        // Pro+ users don't need to upgrade - hide all plans
        availablePlans = [];
        console.log('Pro+ user - no upgrade needed');
      } else {
        // For any other plan status, hide the current plan
        availablePlans = allPlans.filter(plan => plan.id !== currentPlan && plan.id !== 'free');
        console.log('Other plan user - showing available plans:', availablePlans.map(p => p.id));
      }
      
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading membership plans:', error);
      setError('Failed to load membership plans');
    } finally {
      setLoading(false);
    }
  }, [currentPlan]);

  const handleSelectPlan = (plan: MembershipPlan) => {
    // Prevent selecting the same plan user already has
    if (currentPlan === plan.id) {
      console.log('User already has this plan:', plan.id);
      return;
    }
    
    console.log('User selected plan:', plan.id, 'Current plan:', currentPlan);
    setSelectedPlan(plan.id);
    onSelectPlan(plan);
  };

  const handleBuyPlan = (plan: MembershipPlan) => {
    // Prevent buying the same plan user already has
    if (currentPlan === plan.id) {
      console.log('Cannot buy the same plan user already has:', plan.id);
      alert('You already have this plan!');
      return;
    }
    
    console.log('User buying plan:', plan.id, 'Current plan:', currentPlan);
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentModal(false);
    setSelectedPlanForPayment(null);
    
    // Show success message
    if (selectedPlanForPayment) {
      messagingService.membershipPurchased(selectedPlanForPayment.name);
    }
    
    // Auto-refresh to show updated plan in profile
    setTimeout(() => {
      window.location.reload();
    }, 2000); // Wait 2 seconds to show success message, then refresh
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className={`bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto ${
        isMobile ? 'max-w-sm mx-1' : 'max-w-4xl'
      }`}>
        {/* Enhanced Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
             <span className="text-gray-900 ml-2">
                Choose
              </span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Your Plan</span>
            </h2>
            {/* <p className="text-sm text-gray-600">Compare plans and unlock premium features</p> */}
          </div>
        </div>

        {/* Plans Grid */}
        <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
          {/* Compact Benefits */}
          {/* <div className={`mb-4 flex items-center justify-center ${isMobile ? 'space-x-4 text-xs' : 'space-x-6 text-sm'} text-gray-600`}>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-green-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>4.8/5</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-blue-600" />
              <span>Instant</span>
            </div>
          </div> */}

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
          ) : plans.length === 0 && currentPlan === 'pro_plus' ? (
            <div className="text-center py-12">
              <div className="text-green-600 mb-4">
                <Crown className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">You have the highest plan!</p>
                <p className="text-sm text-gray-600">You already have Pro+ membership with unlimited access to all features.</p>
              </div>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600 mb-4">
                <Crown className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-medium">No upgrade options available</p>
                <p className="text-sm text-gray-600">You already have an active subscription.</p>
              </div>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          ) : (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isDisabled = isCurrentPlan;
                
                return (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 border-2 rounded-xl overflow-hidden ${
                isDisabled 
                  ? 'border-gray-300 bg-gray-100 opacity-75 cursor-not-allowed' 
                  : isCurrentPlan 
                    ? 'border-green-300 bg-green-50 cursor-pointer hover:shadow-xl hover:scale-105'
                    : plan.popular 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transform scale-105 cursor-pointer hover:shadow-xl hover:scale-105' 
                      : 'border-gray-200 hover:border-blue-300 bg-white cursor-pointer hover:shadow-xl hover:scale-105'
              }`}
              onClick={() => !isDisabled && handleSelectPlan(plan)}
            >
              {/* {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-bold shadow-lg animate-pulse">
                    🔥 MOST POPULAR
                  </Badge>
                </div>
              )} */}

              {/* Plan Header */}
              <div className={`text-center p-6 ${
                plan.popular 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
              } text-white relative overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full"></div>
                  <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full"></div>
                </div>
                
                <div className="relative z-10">
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-2 -right-2 z-20">
                      <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-bold shadow-lg">
                        Current Plan
                      </Badge>
                    </div>
                  )}
                  
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mx-auto mb-3">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-white/90 text-sm mb-4">{plan.description}</p>
                  
                  {/* Pricing */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                    <div className="flex items-center justify-center space-x-2">
                      {plan.originalPrice && (
                        <span className="text-sm text-white/70 line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                    </div>
                    {plan.originalPrice && (
                      <Badge className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 mt-2">
                        🎉 {Math.round((1 - plan.price / plan.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                    <p className="text-white/80 text-xs mt-2">Valid for {plan.duration_months} months</p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <CardContent className="p-6 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="p-1 bg-green-100 rounded-full">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button 
                  className={`w-full py-3 text-sm font-bold rounded-xl transition-all duration-300 shadow-lg ${
                    currentPlan === plan.id
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                      : plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentPlan === plan.id) {
                      e.preventDefault();
                      return;
                    }
                    handleBuyPlan(plan);
                  }}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      You Already Have This Plan
                    </>
                  ) : (
                    <>
                      🚀 Get {plan.name} Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                
                {/* {plan.popular && (
                  <p className="text-center text-xs text-gray-500 mt-2">
                    ⚡ Instant activation • 30-day money back guarantee
                  </p>
                )} */}
              </CardContent>
            </Card>
          );
        })}
            </div>
          )}

        {/* Compact Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-600">
            🔒 Secure payment • Instant activation
          </p>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      {showPaymentModal && selectedPlanForPayment && (
        <RazorpayCheckout
          plan={{
            id: selectedPlanForPayment.id,
            name: selectedPlanForPayment.name,
            description: selectedPlanForPayment.description,
            price: selectedPlanForPayment.price,
            currency: selectedPlanForPayment.currency,
            features: selectedPlanForPayment.features
          }}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      </div>
    </div>
  );
};
