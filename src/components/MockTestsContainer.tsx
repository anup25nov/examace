import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  CheckCircle, 
  Star, 
  Crown,
  Calendar,
  Target,
  Clock,
  FileText,
  Zap
} from 'lucide-react';
import ResponsiveScrollContainer from './ResponsiveScrollContainer';
import { PremiumTest } from '@/lib/premiumService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MembershipPlans } from './MembershipPlans';
import { PerfectModal } from './PerfectModal';

interface MockTestsContainerProps {
  mockTests: { free: PremiumTest[]; premium: PremiumTest[] };
  completedTests: Set<string>;
  testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
  onStartTest: (testId: string, language?: string) => void;
  onViewSolutions: (testId: string) => void;
  onRetry: (testId: string) => void;
  testFilter: 'all' | 'attempted' | 'not-attempted';
  sectionMessage?: { type: string; message: string; icon: string; actionType: string; actionText: string; purchaseLink?: string } | null;
  onMessageAction?: (actionType: string, purchaseLink?: string) => void;
  className?: string;
}

export const MockTestsContainer: React.FC<MockTestsContainerProps> = ({
  mockTests,
  completedTests,
  testScores,
  onStartTest,
  onViewSolutions,
  onRetry,
  testFilter,
  sectionMessage,
  onMessageAction,
  className = ''
}) => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<'all' | 'free' | 'premium'>('all');
  const [userMembership, setUserMembership] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<Map<string, boolean>>(new Map());
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);

  // Check user membership status and mock test access
  const checkMembershipStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching membership:', error);
      }
      
      setUserMembership(membership);
      
      // Check access for each test
      const accessMap = new Map<string, boolean>();
      [...mockTests.free, ...mockTests.premium].forEach(test => {
        if (!test.isPremium) {
          // Free tests are always accessible
          accessMap.set(test.id, true);
        } else {
          // Premium tests - check membership and available mock tests
          if (!membership) {
            // No membership = no access to premium
            accessMap.set(test.id, false);
          } else {
            // Has membership - check if mock tests are available
            // For now, assume all premium members have access to all mock tests
            // You can add specific logic here to check remaining mock test quota
            accessMap.set(test.id, true);
          }
        }
      });
      setHasAccess(accessMap);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  }, [user, mockTests]);

  useEffect(() => {
    if (user) {
      checkMembershipStatus();
    }
  }, [user, checkMembershipStatus]);

  // Filter and sort mock tests
  const filteredTests = useMemo(() => {
    const allTests = [
      ...mockTests.free.map(test => ({ ...test, type: 'free' as const })),
      ...mockTests.premium.map(test => ({ ...test, type: 'premium' as const }))
    ];

    return allTests.filter(test => {
      // Filter by type
      if (selectedType !== 'all' && test.type !== selectedType) return false;

      // Filter by completion status
      const isCompleted = completedTests.has(`mock-${test.id}`) || completedTests.has(test.id);
      if (testFilter === 'attempted') return isCompleted;
      if (testFilter === 'not-attempted') return !isCompleted;

      return true;
    });
  }, [mockTests, selectedType, testFilter, completedTests]);

  // Get statistics
  const stats = useMemo(() => {
    const allTests = [...mockTests.free, ...mockTests.premium];
    const completed = allTests.filter(test => 
      completedTests.has(`mock-${test.id}`) || completedTests.has(test.id)
    ).length;
    
    return {
      total: allTests.length,
      completed,
      free: mockTests.free.length,
      premium: mockTests.premium.length
    };
  }, [mockTests, completedTests]);

  const handleCardClick = (test: PremiumTest) => {
    if (test.isPremium && !hasAccess.get(test.id)) {
      // Show membership plans modal for premium access
      setShowMembershipPlans(true);
    }
  };

  const handlePlanSelect = async (plan: any) => {
    console.log('Selected plan:', plan);
    // Handle plan selection - you can implement the payment flow here
    setShowMembershipPlans(false);
    // Refresh membership status after plan selection
    await checkMembershipStatus();
  };

  return (
    <div className={`space-y-0 ${className}`}>
      {/* Mock Tests Container */}
      <Card className="gradient-card border-0 shadow-lg flex flex-col">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
          <CardTitle className="flex flex-col space-y-3 sm:space-y-4">
            {/* Main Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Full Mock Tests</h3>
                  <p className="text-xs sm:text-sm text-emerald-100">
                    {selectedType === 'all' 
                      ? `${stats.total} Comprehensive Mock Tests`
                      : selectedType === 'free'
                        ? `${stats.free} Free Mock Tests`
                        : `${stats.premium} Premium Mock Tests`
                    }
                  </p>
                </div>
              </div>
              
              {/* Type Filter Tabs - Mobile Optimized */}
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1">
                {/* All Tests Option */}
                <Button
                  variant={selectedType === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                  className={`transition-all duration-200 text-xs sm:text-sm ${
                    selectedType === 'all'
                      ? 'bg-white/20 text-white border-white/30' 
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium hidden xs:inline">All Tests</span>
                    <span className="font-medium xs:hidden">All</span>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {stats.total}
                      </span>
                    </div>
                  </div>
                </Button>
                
                {/* Free Tests Option */}
                <Button
                  variant={selectedType === 'free' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('free')}
                  className={`transition-all duration-200 text-xs sm:text-sm ${
                    selectedType === 'free' 
                      ? 'bg-white/20 text-white border-white/30' 
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">Free</span>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {stats.free}
                      </span>
                    </div>
                  </div>
                </Button>

                {/* Premium Tests Option */}
                <Button
                  variant={selectedType === 'premium' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType('premium')}
                  className={`transition-all duration-200 text-xs sm:text-sm ${
                    selectedType === 'premium' 
                      ? 'bg-white/20 text-white border-white/30' 
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">Premium</span>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white text-xs font-bold">
                        {stats.premium}
                      </span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 flex-1">
          {/* Section Message */}
          {sectionMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              sectionMessage.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
              sectionMessage.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
              'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{sectionMessage.icon}</div>
                  <p className={`font-medium ${
                    sectionMessage.type === 'info' ? 'text-blue-700' :
                    sectionMessage.type === 'success' ? 'text-green-700' :
                    'text-yellow-700'
                  }`}>
                    {sectionMessage.message}
                  </p>
                </div>
                {onMessageAction && (
                  <Button
                    onClick={() => onMessageAction(sectionMessage.actionType, sectionMessage.purchaseLink)}
                    className={`${
                      sectionMessage.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                      sectionMessage.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    } text-white`}
                    size="sm"
                  >
                    {sectionMessage.actionText}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tests Grid */}
          <ResponsiveScrollContainer
            cardCount={filteredTests.length}
            className="mb-6"
          >
            {filteredTests.map((test) => {
              const isCompleted = completedTests.has(`mock-${test.id}`) || completedTests.has(test.id);
              const testScore = testScores.get(`mock-${test.id}`) || testScores.get(test.id);
              
              const handleStartTest = (test: PremiumTest) => {
                if (test.isPremium && !hasAccess.get(test.id)) {
                  // Show membership plans modal for premium access
                  setShowMembershipPlans(true);
                  return;
                }
                onStartTest(test.id);
              };

              return (
                <Card
                  key={test.id}
                  className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] hover:border-primary/40 h-72 group ${
                    isCompleted 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                      : test.isPremium 
                        ? 'border-gradient-to-r from-yellow-200 to-orange-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 shadow-lg ring-2 ring-yellow-200/50' 
                        : 'border-border bg-gradient-to-br from-white to-slate-50'
                  } ${test.isPremium && !hasAccess.get(test.id) ? 'cursor-pointer' : ''}`}
                  onClick={() => handleCardClick(test)}
                >
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-2 sm:mb-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
                          {test.name}
                        </h4>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <Badge className={`text-xs px-2 py-1 ${
                            test.isPremium 
                              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse shadow-lg border-2 border-yellow-300' 
                              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse border-2 border-green-300 shadow-lg'
                          }`}>
                            {test.isPremium ? (
                              <div className="flex items-center space-x-1">
                                <Crown className="w-3 h-3" />
                                <span>PREMIUM</span>
                                {!hasAccess.get(test.id) && <span className="text-xs ml-1">👆</span>}
                              </div>
                            ) : (
                              <span className="animate-pulse">FREE</span>
                            )}
                          </Badge>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    {isCompleted && testScore ? (
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
                        <span>180 min</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>100 questions</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto">
                      {isCompleted ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewSolutions(test.id);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                            size="sm"
                          >
                            <span className="hidden sm:inline">View Solutions</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetry(test.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTest(test);
                          }}
                          className={`w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm ${
                            test.isPremium && !hasAccess.get(test.id)
                              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          }`}
                          size="sm"
                        >
                          {test.isPremium && !hasAccess.get(test.id) ? (
                            <>
                              <span className="hidden sm:inline">Upgrade to Access</span>
                              <span className="sm:hidden">Upgrade</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Start Test</span>
                              <span className="sm:hidden">Start</span>
                            </>
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

      {/* Membership Plans Modal */}
      <PerfectModal
        isOpen={showMembershipPlans}
        onClose={() => setShowMembershipPlans(false)}
        title="Choose Membership Plan"
        maxWidth="max-w-4xl"
      >
        <MembershipPlans
          onSelectPlan={handlePlanSelect}
          onClose={() => setShowMembershipPlans(false)}
          currentPlan={userMembership}
        />
      </PerfectModal>
    </div>
  );
};
