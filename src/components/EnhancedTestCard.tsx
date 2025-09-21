import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Play, 
  Eye, 
  RotateCcw, 
  Crown, 
  Lock,
  Clock,
  FileText,
  Trophy,
  Star
} from 'lucide-react';
import { PremiumTest } from '@/lib/premiumService';
import { TestStartModal } from './TestStartModal';
import { unifiedPaymentService } from '@/lib/unifiedPaymentService';
import { useAuth } from '@/hooks/useAuth';

interface TestScore {
  score: number;
  rank: number;
  totalParticipants: number;
}

interface EnhancedTestCardProps {
  test: PremiumTest;
  isCompleted: boolean;
  testScore?: TestScore;
  onStartTest: (language?: string) => void;
  onViewSolutions: () => void;
  onRetry: () => void;
  testType?: 'mock' | 'pyq';
  className?: string;
}

export const EnhancedTestCard: React.FC<EnhancedTestCardProps> = ({
  test,
  isCompleted,
  testScore,
  onStartTest,
  onViewSolutions,
  onRetry,
  testType = 'mock',
  className = ''
}) => {
  const { user } = useAuth();
  const [showTestStartModal, setShowTestStartModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(!test.isPremium);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  // Check user membership status
  useEffect(() => {
    if (user && test.isPremium) {
      checkMembershipStatus();
    }
  }, [user, test.isPremium]);

  const checkMembershipStatus = async () => {
    if (!user) return;
    
    try {
      const membership = await unifiedPaymentService.getUserMembership(user.id);
      setUserMembership(membership);
      setHasAccess(!!membership || !test.isPremium);
    } catch (error) {
      console.error('Error checking membership:', error);
      setHasAccess(!test.isPremium);
    }
  };

  const handleStartTest = () => {
    if (test.isPremium && !hasAccess) {
      setShowMembershipModal(true);
    } else {
      setShowTestStartModal(true);
    }
  };

  const handleCardClick = () => {
    if (test.isPremium && !hasAccess) {
      setShowMembershipModal(true);
    }
  };

  const handleStartWithLanguage = (language: string) => {
    onStartTest(language);
  };

  const handlePaymentSuccess = (planId: string) => {
    setHasAccess(true);
    // Refresh membership status
    checkMembershipStatus();
  };

  return (
    <>
    <Card 
      className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] hover:border-primary/40 h-80 group ${
        isCompleted ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' : 'border-border bg-gradient-to-br from-white to-slate-50'
      } ${test.isPremium && !hasAccess ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleCardClick}
    >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="mb-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
                {test.name}
              </h3>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                {/* Premium/Free Badge */}
                <Badge className={`text-xs px-3 py-1 rounded-full font-bold shadow-md ${
                  test.isPremium 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse border-2 border-green-300 shadow-lg'
                }`}>
                  {test.isPremium ? (
                    <div className="flex items-center space-x-1">
                      <Crown className="w-3 h-3" />
                      <span>PREMIUM</span>
                      {!hasAccess && <span className="text-xs ml-1">👆</span>}
                    </div>
                  ) : (
                    'FREE'
                  )}
                </Badge>
                
                {/* Completion Status */}
                {isCompleted && (
                  <div className="flex items-center space-x-1 animate-bounce">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{test.duration} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{test.questions} questions</span>
                </div>
              </div>
              {test.isPremium && !hasAccess && (
                <div className="text-xs text-orange-600 font-medium text-center bg-gradient-to-r from-orange-50 to-yellow-50 p-2 rounded border border-orange-200 animate-pulse">
                  👆 Click to unlock Premium content
                </div>
              )}
            </div>
          </div>
          
          {/* Score Display */}
          <div className="mb-4 min-h-[80px] flex items-center justify-center">
            {testScore && isCompleted ? (
              <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{testScore.score}</div>
                    <div className="text-sm text-blue-500 font-medium">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">#{testScore.rank}</div>
                    <div className="text-sm text-purple-500 font-medium">Rank</div>
                  </div>
                </div>
                {testScore.totalParticipants > 0 && (
                  <div className="text-center mt-3">
                    <span className="text-sm text-muted-foreground">
                      out of {testScore.totalParticipants} participants
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-sm">Complete test to see</div>
                  <div className="text-xs">your score & rank</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 mt-auto">
            {isCompleted ? (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-10 text-sm hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  onClick={onViewSolutions}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Solutions
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-10 text-sm bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  onClick={onRetry}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="w-full h-10 text-sm bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-md"
                onClick={handleStartTest}
                disabled={test.isPremium && !hasAccess}
              >
                {test.isPremium && !hasAccess ? (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    Unlock Premium
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Start Test
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Premium Overlay */}
          {test.isPremium && !hasAccess && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-yellow-500/20 to-orange-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-bold mb-1">Premium Content</p>
                <p className="text-xs opacity-90">Click to unlock</p>
                <div className="mt-2 flex items-center justify-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400" />
                  <Star className="w-3 h-3 text-yellow-400" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Start Modal */}
      <TestStartModal
        isOpen={showTestStartModal}
        onClose={() => setShowTestStartModal(false)}
        onStart={handleStartWithLanguage}
        test={test}
        testType={testType}
      />

      {/* Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Content</h3>
                <p className="text-gray-600">This test requires a Pro or Pro+ membership to access.</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Pro Plan - ₹99</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 11 Mock Tests</li>
                    <li>• 3 Months Access</li>
                    <li>• Detailed Solutions</li>
                    <li>• Performance Analytics</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Pro+ Plan - ₹299</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Unlimited Mock Tests</li>
                    <li>• 12 Months Access</li>
                    <li>• Detailed Solutions</li>
                    <li>• Performance Analytics</li>
                    <li>• Priority Support</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMembershipModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowMembershipModal(false);
                    window.location.href = '/profile';
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
