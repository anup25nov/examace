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
    // Use latest Pro and Pro+ definitions (1 year validity, env pricing handled server-side)
    setLoading(true);
    const proPlus: MembershipPlan = {
      id: 'pro_plus',
      name: 'Pro+',
      description: 'Complete access to all mocks and features',
      price: 299,
      originalPrice: 599,
      features: ['12 months validity', '21 mock tests', 'Premium PYQs', 'Detailed Solutions', 'Priority Support', 'Advanced Analytics'],
      popular: true,
      icon: <Crown className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      duration_months: 12,
      currency: 'INR'
    };
    const pro: MembershipPlan = {
      id: 'pro',
      name: 'Pro',
      description: 'Access to 11 mock tests',
      price: 99,
      originalPrice: 199,
      features: ['3 months validity', '11 mock tests', 'Premium PYQs', 'Detailed Solutions', 'Performance Analytics'],
      popular: false,
      icon: <Crown className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      duration_months: 3,
      currency: 'INR'
    };
    setPlans([proPlus, pro]);
    setLoading(false);
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
          ) : (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
              {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                plan.popular 
                  ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300 bg-white'
              } ${currentPlan === plan.id ? 'border-green-300 bg-green-50' : ''} rounded-xl overflow-hidden`}
              onClick={() => handleSelectPlan(plan)}
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
                  className={`w-full py-3 text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyPlan(plan);
                  }}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Current Plan
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
          ))}
            </div>
          )}
        </div>

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
  );
};
