import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, CheckCircle, Play, RotateCcw, BookOpen, Clock, Target, Lock, AlertTriangle, Crown } from 'lucide-react';
import ResponsiveScrollContainer from '@/components/ResponsiveScrollContainer';
import { useAuth } from '@/hooks/useAuth';
import { planLimitsService } from '@/lib/planLimitsService';
import { MockTestLimitModal } from '@/components/MockTestLimitModal';

interface MockTestSelectorProps {
  mockTests: any[];
  onTestSelect: (testId: string) => void;
  onRetryTest: (testId: string) => void;
  onViewSolutions: (testId: string) => void;
  completedTests: Set<string>;
  testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
}

export const MockTestSelector: React.FC<MockTestSelectorProps> = ({
  mockTests,
  onTestSelect,
  onRetryTest,
  onViewSolutions,
  completedTests,
  testScores
}) => {
  const { user } = useAuth();
  const [planLimits, setPlanLimits] = useState<any>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Load user's plan limits and mock test usage
  useEffect(() => {
    const loadPlanLimits = async () => {
      if (!user?.id) {
        setIsLoadingLimits(false);
        return;
      }

      try {
        // Get both general plan limits and mock test specific usage
        const [generalLimits, mockTestUsage] = await Promise.all([
          planLimitsService.getUserPlanLimits(user.id),
          planLimitsService.getMockTestUsage(user.id)
        ]);
        
        // Combine the data for display
        setPlanLimits({
          ...generalLimits,
          ...mockTestUsage
        });
      } catch (error) {
        console.error('Error loading plan limits:', error);
      } finally {
        setIsLoadingLimits(false);
      }
    };

    loadPlanLimits();
  }, [user?.id]);

  const getCompletionStats = () => {
    const total = mockTests.length;
    const completed = mockTests.filter(test => 
      completedTests.has(`mock-${test.id}`)
    ).length;
    return { completed, total };
  };

  const canTakeMockTest = (test: any) => {
    if (!test.isPremium) return true; // Free tests are always available
    
    if (!planLimits) return false;
    
    // For premium tests, check if user has remaining mock tests
    return planLimits.canTakeMockTest && planLimits.remainingMockTests > 0;
  };

  const handleTestSelect = async (test: any) => {
    if (!user?.id) return;

    // Check if user can take this mock test
    if (test.isPremium) {
      const { canTake } = await planLimitsService.canUserTakeTest(user.id, 'mock', test);
      if (!canTake) {
        // Show upgrade modal
        setShowLimitModal(true);
        return;
      }
    }

    onTestSelect(test.id);
  };

  if (mockTests.length === 0) return null;

  const stats = getCompletionStats();

  return (
    <div className="space-y-0">
      {/* Mock Test Cards Container */}
      <Card className="gradient-card border-0 shadow-lg h-[520px] flex flex-col">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex flex-col space-y-4">
            {/* Main Header - Top */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mock Tests</h3>
                  <p className="text-sm text-blue-100">
                    {stats.total} Practice Tests Available
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Information */}
            {planLimits && !isLoadingLimits && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-medium">
                      {planLimits.planType === 'free' ? 'Free Plan' : 
                       planLimits.planType === 'pro' ? 'Pro Plan' : 'Pro+ Plan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {planLimits.planType === 'free' ? '0' : planLimits.remainingMockTests} / {planLimits.maxMockTests}
                    </div>
                    <div className="text-xs text-blue-100">Mock Tests Left</div>
                  </div>
                </div>
                {planLimits.planType !== 'pro_plus' && (
                  <div className="mt-2">
                    <Progress 
                      value={(planLimits.usedMockTests / planLimits.maxMockTests) * 100} 
                      className="h-2 bg-white/20"
                    />
                  </div>
                )}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-hidden">
          {/* Test Cards Grid with Scroller */}
          <ResponsiveScrollContainer cardCount={mockTests.length}>
            {mockTests.map((test) => {
              const isCompleted = completedTests.has(`mock-${test.id}`);
              const testScore = testScores.get(`mock-${test.id}`);
              const canTakeTest = canTakeMockTest(test);
              const isLocked = test.isPremium && !canTakeTest;

              return (
                <Card 
                  key={test.id} 
                  className={`test-card relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] hover:border-primary/40 h-72 group ${
                    isCompleted 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                      : test.isPremium
                        ? 'border-2 border-yellow-400 bg-white shadow-xl ring-4 ring-yellow-200/60 hover:ring-yellow-300/80'
                        : 'border-border bg-gradient-to-br from-white to-slate-50 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col relative">
                    {/* Premium glow effect */}
                    {test.isPremium && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-orange-100/20 rounded-lg opacity-50"></div>
                    )}
                    
                    {/* Lock overlay for locked tests */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
                        <div className="text-center text-white">
                          <Lock className="w-8 h-8 mx-auto mb-2 opacity-70" />
                          <p className="text-sm font-medium">Mock Test Limit Reached</p>
                          <p className="text-xs opacity-70 mt-1">
                            {planLimits?.usedMockTests || 0} / {planLimits?.maxMockTests || 0} used
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Header */}
                    <div className="mb-2 sm:mb-4 flex-1 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-start sm:items-center space-x-2 flex-1">
                          {test.isPremium && (
                            <div className="flex-shrink-0 p-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                              <span className="text-white text-sm">👑</span>
                            </div>
                          )}
                          <h3 className={`font-bold text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300 ${
                            test.isPremium ? 'text-orange-900' : 'text-foreground'
                          }`}>
                            {test.name}
                          </h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0 sm:ml-2">
                          <Badge className={`mobile-badge text-xs px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-lg ${
                            test.isPremium 
                              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse border-2 border-yellow-300 hover:scale-105 transition-transform' 
                              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300'
                          }`}>
                            {test.isPremium ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs sm:text-sm">👑</span>
                                <span className="hidden xs:inline">PREMIUM</span>
                                <span className="xs:hidden">PREMIUM</span>
                                <span className="text-xs">✨</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs sm:text-sm">⭐</span>
                                <span>FREE</span>
                              </div>
                            )}
                          </Badge>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    {testScore && isCompleted ? (
                      <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Score</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-800">{testScore.score}</div>
                            <div className="text-xs text-green-600">Rank: #{testScore.rank}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Complete to see score & rank</span>
                        </div>
                      </div>
                    )}

                    {/* Test Details */}
                    <div className="mb-2 sm:mb-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span>{test.questions.length} questions</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto relative z-10">
                      {isCompleted ? (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs sm:text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 min-h-[44px]"
                            onClick={() => onViewSolutions(test.id)}
                          >
                            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                            <span>View Solutions</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 min-h-[44px]"
                            onClick={() => onRetryTest(test.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry Test
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isLocked}
                          className={`w-full text-sm font-bold shadow-xl transition-all duration-300 min-h-[44px] ${
                            isLocked
                              ? 'bg-gray-400 cursor-not-allowed opacity-60'
                              : test.isPremium 
                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-yellow-300 hover:shadow-2xl hover:scale-105 animate-pulse' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-2xl hover:scale-105'
                          }`}
                          onClick={() => handleTestSelect(test)}
                        >
                          {isLocked ? (
                            <div className="flex items-center space-x-1">
                              <Lock className="w-4 h-4 mr-2" />
                              <span>Limit Reached</span>
                            </div>
                          ) : test.isPremium ? (
                            <div className="flex items-center space-x-1">
                              <Play className="w-4 h-4 mr-2" />
                              <span>🚀 Start Premium Test</span>
                              <span>⭐</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Play className="w-4 h-4 mr-2" />
                              <span>Start Practice Test</span>
                              <span>🎯</span>
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </ResponsiveScrollContainer>
        </CardContent>
      </Card>

      {/* Mock Test Limit Modal */}
      <MockTestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        onUpgrade={() => {
          setShowLimitModal(false);
          // Navigate to membership plans or show upgrade modal
          window.location.href = '/membership';
        }}
        currentPlan={planLimits?.planType || 'free'}
        usedTests={planLimits?.usedMockTests || 0}
        maxTests={planLimits?.maxMockTests || 0}
      />
    </div>
  );
};
