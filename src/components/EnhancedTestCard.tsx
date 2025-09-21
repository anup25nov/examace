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
import { UnifiedPaymentModal } from './UnifiedPaymentModal';
import { unifiedPaymentService } from '@/lib/unifiedPaymentService';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/contexts/MembershipContext';

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
  const { hasAccess: checkAccess, membership } = useMembership();
  const [showTestStartModal, setShowTestStartModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  // Use centralized membership check
  const hasAccess = checkAccess(test.id, test.isPremium);

  const handleStartTest = () => {
    if (test.isPremium && !hasAccess) {
      setShowMembershipModal(true);
    } else {
      setShowTestStartModal(true);
    }
  };

  const handleCardClick = () => {
    console.log('Card clicked:', { isPremium: test.isPremium, hasAccess, showMembershipModal });
    if (test.isPremium && !hasAccess) {
      console.log('Showing membership modal');
      setShowMembershipModal(true);
    }
  };

  const handleStartWithLanguage = (language: string) => {
    onStartTest(language);
  };

  const handlePaymentSuccess = (planId: string) => {
    // Membership will be refreshed automatically by the context
    console.log('Payment successful, membership will be refreshed');
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewSolutions();
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Solutions
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-10 text-sm bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 hover:shadow-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRetry();
                  }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Prevent card click from firing
                  handleStartTest();
                }}
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

      {/* Unified Payment Modal */}
      <UnifiedPaymentModal
        isOpen={showMembershipModal}
        onClose={() => setShowMembershipModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        testId={test.id}
        testName={test.name}
        testPrice={0} // No individual test price, only membership
        testDescription={`Access to ${test.name} and all premium content`}
      />
    </>
  );
};
