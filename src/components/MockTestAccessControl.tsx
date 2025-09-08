import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Crown, 
  Star, 
  Check, 
  X,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { membershipService } from '@/lib/membershipService';
import { useIsMobile } from '@/hooks/use-mobile';

interface MockTestAccessControlProps {
  testId: string;
  testName: string;
  requiredPlan?: string;
  onAccessGranted: () => void;
  onUpgradeClick: () => void;
  children?: React.ReactNode;
}

export const MockTestAccessControl: React.FC<MockTestAccessControlProps> = ({
  testId,
  testName,
  requiredPlan = 'basic',
  onAccessGranted,
  onUpgradeClick,
  children
}) => {
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipStats, setMembershipStats] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has access to this test
        const access = await membershipService.hasAccessToMockTests(user.id, 1);
        setHasAccess(access);

        // Get membership stats
        const stats = await membershipService.getMembershipStats(user.id);
        setMembershipStats(stats);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [isAuthenticated, user, testId]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const getPlanInfo = (planId: string) => {
    const plans = {
      basic: {
        name: 'Basic Plan',
        price: 30,
        mockTests: 10,
        icon: <Star className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      },
      premium: {
        name: 'Premium Plan',
        price: 49,
        mockTests: 25,
        icon: <Crown className="w-5 h-5" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200'
      },
      pro: {
        name: 'Pro Plan',
        price: 99,
        mockTests: 50,
        icon: <Zap className="w-5 h-5" />,
        color: 'text-gold-600',
        bgColor: 'bg-yellow-50 border-yellow-200'
      }
    };
    return plans[planId as keyof typeof plans] || plans.basic;
  };

  const currentPlan = membershipStats?.currentPlan || 'free';
  const planInfo = getPlanInfo(requiredPlan);

  return (
    <Card className={`w-full ${planInfo.bgColor} border-2`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-full shadow-md">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <CardTitle className="text-xl text-gray-800">
          Premium Content
        </CardTitle>
        <p className="text-gray-600 mt-2">
          This mock test requires a {planInfo.name}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {testName}
          </h3>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            Premium Mock Test
          </Badge>
        </div>

        {/* Current Status */}
        {currentPlan !== 'free' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Current Plan</span>
            </div>
            <p className="text-sm text-yellow-700">
              You have a {getPlanInfo(currentPlan).name} but need {planInfo.name} for this test.
            </p>
            {membershipStats && (
              <div className="mt-2 text-sm text-yellow-600">
                <p>Days remaining: {membershipStats.daysRemaining}</p>
                <p>Tests remaining: {membershipStats.testsRemaining}</p>
              </div>
            )}
          </div>
        )}

        {/* Plan Benefits */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-center">
            What you get with {planInfo.name}:
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">{planInfo.mockTests} Mock Tests</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Detailed Solutions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Performance Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Priority Support</span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-3xl font-bold text-gray-800">₹{planInfo.price}</span>
            <span className="text-lg text-gray-500 line-through">₹{planInfo.price * 2}</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            50% OFF
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onUpgradeClick}
            className={`w-full ${planInfo.color.replace('text-', 'bg-').replace('-600', '-600')} hover:opacity-90`}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {planInfo.name}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onAccessGranted}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Maybe Later
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>✓ 7-day money-back guarantee</p>
          <p>✓ Secure payment with Razorpay</p>
          <p>✓ Instant access after payment</p>
        </div>
      </CardContent>
    </Card>
  );
};
