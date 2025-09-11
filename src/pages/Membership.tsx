import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Crown, Check, Star, Zap, Shield, Users, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Membership = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const membershipPlans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '₹299',
      duration: '1 Month',
      description: 'Perfect for getting started',
      features: [
        'Access to all Mock Tests',
        'Access to all PYQ Papers',
        'Detailed Solutions',
        'Performance Analytics',
        'Mobile App Access'
      ],
      popular: false,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '₹799',
      duration: '3 Months',
      description: 'Most popular choice',
      features: [
        'Everything in Basic',
        'Unlimited Test Attempts',
        'Advanced Analytics',
        'Priority Support',
        'Study Materials',
        'Exam Notifications'
      ],
      popular: true,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '₹1499',
      duration: '6 Months',
      description: 'Best value for serious aspirants',
      features: [
        'Everything in Pro',
        'Personal Mentor Support',
        'Custom Study Plans',
        'Mock Interview Sessions',
        'Career Guidance',
        'Lifetime Updates'
      ],
      popular: false,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Here you would integrate with your payment system
    console.log('Selected plan:', planId);
    // For now, just show an alert
    alert(`You selected ${membershipPlans.find(p => p.id === planId)?.name}. Payment integration coming soon!`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Please Login First</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to view membership plans.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logos/alternate_image.png" 
                  alt="Step2Sarkari Logo" 
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold text-foreground uppercase">S2S</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Welcome, {user?.email?.split('@')[0]}!</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Success Plan</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Unlock your potential with our comprehensive exam preparation plans
          </p>
        </div>

        {/* Membership Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {membershipPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                plan.popular ? 'ring-2 ring-purple-500 shadow-xl' : 'hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 text-sm font-bold">
                  MOST POPULAR
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-4xl font-bold text-gray-900">{plan.price}</div>
                <div className="text-gray-600">{plan.duration}</div>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full h-12 text-lg font-bold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' 
                      : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                  } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose S2S?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Content</h3>
              <p className="text-gray-600">Curated by subject matter experts</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Fast Learning</h3>
              <p className="text-gray-600">Optimized for quick understanding</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Platform</h3>
              <p className="text-gray-600">Your data is safe with us</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community</h3>
              <p className="text-gray-600">Join thousands of aspirants</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">We offer free access to basic features. Premium features require a subscription.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, UPI, net banking, and digital wallets.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
