import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Lock, AlertTriangle, Star, Zap } from 'lucide-react';

interface MockTestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentPlan: string;
  usedTests: number;
  maxTests: number;
}

export const MockTestLimitModal: React.FC<MockTestLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  currentPlan,
  usedTests,
  maxTests
}) => {
  const getPlanInfo = (plan: string) => {
    switch (plan) {
      case 'free':
        return {
          name: 'Free Plan',
          color: 'from-gray-500 to-gray-600',
          icon: Lock
        };
      case 'pro':
        return {
          name: 'Pro Plan',
          color: 'from-blue-500 to-purple-600',
          icon: Star
        };
      case 'pro_plus':
        return {
          name: 'Pro+ Plan',
          color: 'from-yellow-500 to-orange-600',
          icon: Crown
        };
      default:
        return {
          name: 'Free Plan',
          color: 'from-gray-500 to-gray-600',
          icon: Lock
        };
    }
  };

  const planInfo = getPlanInfo(currentPlan);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Mock Test Limit Reached
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Plan Status */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${planInfo.color}`}>
                    <planInfo.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{planInfo.name}</h3>
                    <p className="text-sm text-gray-600">Current Plan</p>
                  </div>
                </div>
                <Badge variant="destructive" className="bg-red-500">
                  Limit Reached
                </Badge>
              </div>
              
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Mock Tests Used</span>
                  <span className="text-sm font-bold text-red-600">{usedTests} / {maxTests}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(usedTests / maxTests) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-center">Upgrade Your Plan</h4>
            
            {currentPlan === 'free' && (
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h5 className="font-semibold">Pro Plan</h5>
                        <p className="text-sm text-gray-600">11 Mock Tests</p>
                      </div>
                    </div>
                    <Button 
                      onClick={onUpgrade}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Upgrade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="font-semibold">Pro+ Plan</h5>
                      <p className="text-sm text-gray-600">Unlimited Mock Tests</p>
                    </div>
                  </div>
                  <Button 
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                  >
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-yellow-800">Mock Test Access Limited</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  You've reached your mock test limit for your current plan. Upgrade to continue taking premium mock tests.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={onUpgrade}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
