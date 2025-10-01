import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock, CheckCircle, Star, Crown, Target, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MembershipPlans } from '@/components/MembershipPlans';
import { PerfectModal } from '@/components/PerfectModal';
import { TestStartModal } from '@/components/TestStartModal';
import ResponsiveScrollContainer from '@/components/ResponsiveScrollContainer';

interface PremiumTest {
  id: string;
  name: string;
  duration: number;
  questions: any[];
  breakdown?: string;
  isPremium?: boolean;
  subjects: string[];
  difficulty: string;
  price?: number;
}

interface YearData {
  year: string;
  papers: PremiumTest[];
}

interface YearWiseTabsProps {
  years: YearData[];
  completedTests: Set<string>;
  testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
  onStartTest: (testId: string, language?: string) => void;
  onViewSolutions: (testId: string) => void;
  onRetry: (testId: string) => void;
  testFilter?: 'all' | 'attempted' | 'not-attempted';
  examId?: string;
  className?: string;
  sectionMessage?: {
    type: 'info' | 'success' | 'warning';
    message: string;
    icon: string;
    actionText: string;
    actionType: string;
    purchaseLink?: string;
  };
  onMessageAction?: (actionType: string) => void;
}

export const YearWiseTabs: React.FC<YearWiseTabsProps> = ({
  years,
  completedTests,
  testScores,
  onStartTest,
  onViewSolutions,
  onRetry,
  testFilter = 'all',
  examId,
  className = '',
  sectionMessage,
  onMessageAction
}) => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(''); // Default to empty for "All test"
  
  // Always default to "All Years" for any test filter
  // Only change to specific year if user explicitly selects one
  useEffect(() => {
    // Always reset to "All Years" when test filter changes
    // This ensures consistent behavior: all filters default to showing all years
    setSelectedYear('');
  }, [testFilter]);
  
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  const [showTestStartModal, setShowTestStartModal] = useState(false);
  const [selectedTestForStart, setSelectedTestForStart] = useState<PremiumTest | null>(null);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<Map<string, boolean>>(new Map());

  // Sort years in descending order (newest first)
  const sortedYears = [...years].sort((a, b) => parseInt(b.year) - parseInt(a.year));

  // Check user membership status
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
      
      // Check access for each paper
      const accessMap = new Map<string, boolean>();
      years.forEach(yearData => {
        yearData.papers.forEach(paper => {
          accessMap.set(paper.id, !!membership || !paper.isPremium);
        });
      });
      setHasAccess(accessMap);
    } catch (error) {
      console.error('Error checking membership:', error);
    }
  }, [user, years]);

  useEffect(() => {
    if (user) {
      checkMembershipStatus();
    }
  }, [user, checkMembershipStatus]);

  // Get papers based on selected year
  const allPapers = useMemo(() => {
    if (!selectedYear) {
      // If no year selected (All test), return all papers from all years
      return sortedYears.flatMap(year => year.papers);
    }
    // Return papers from selected year
    const selectedYearData = sortedYears.find(year => year.year === selectedYear);
    return selectedYearData ? selectedYearData.papers : [];
  }, [selectedYear, sortedYears]);
  
  // Filter papers based on selected year first, then test filter
  const filteredPapers = useMemo(() => {
    // First filter by year
    let yearFilteredPapers = allPapers;
    if (selectedYear !== '' && selectedYear !== 'all') {
      yearFilteredPapers = allPapers.filter(paper => {
        return sortedYears.some(yearData => 
          yearData.year === selectedYear && 
          yearData.papers.some(p => p.id === paper.id)
        );
      });
    }
    
    // Then filter by test status
    const finalPapers = yearFilteredPapers.filter(paper => {
      const testKey = `pyq-${paper.id}`;
      const isCompleted = completedTests.has(testKey);
      
      if (testFilter === 'attempted') return isCompleted;
      if (testFilter === 'not-attempted') return !isCompleted;
      return true; // Show all for 'all' filter
    });
    
    return finalPapers;
  }, [allPapers, selectedYear, sortedYears, completedTests, testFilter]);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleStartTest = (paper: PremiumTest) => {
    // Check if paper is premium and user doesn't have access
    if (paper.isPremium && !hasAccess.get(paper.id)) {
      setShowMembershipPlans(true);
      return;
    } else {
      setSelectedTestForStart(paper);
      setShowTestStartModal(true);
    }
  };

  const handleCardClick = (paper: PremiumTest) => {
    if (paper.isPremium && !hasAccess.get(paper.id)) {
      setShowMembershipPlans(true);
    }
  };

  const handleStartWithLanguage = (language: string) => {
    if (selectedTestForStart) {
      onStartTest(selectedTestForStart.id, language);
    }
  };

  const handlePlanSelection = (plan: any) => {
    console.log('Selected plan:', plan);
    setShowMembershipPlans(false);
    
    // Update access for all premium papers after successful payment
    const newHasAccess = new Map(hasAccess);
    years.forEach(year => {
      year.papers.forEach(paper => {
        if (paper.isPremium) {
          newHasAccess.set(paper.id, true);
        }
      });
    });
    setHasAccess(newHasAccess);
    
    // Refresh membership status
    checkMembershipStatus();
  };

  const getYearStats = useCallback((year: string) => {
    const yearData = sortedYears.find(y => y.year === year);
    if (!yearData) return { total: 0, completed: 0 };
    
    const total = yearData.papers.length;
    const completed = yearData.papers.filter(paper => 
      completedTests.has(`pyq-${paper.id}`)
    ).length;

    return { total, completed };
  }, [sortedYears, completedTests]);

  return (
    <div className={`space-y-0 ${className}`}>
      {/* PYQ Cards Container */}
      <Card className="gradient-card border-0 shadow-lg flex flex-col">
        <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
          <CardTitle className="flex flex-col space-y-3 sm:space-y-4">
            {/* Main Header - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">SSC CGL {selectedYear === '' ? 'All Years' : selectedYear}</h3>
                  <p className="text-xs sm:text-sm text-orange-100">
                    {selectedYear === ''
                      ? `${sortedYears.reduce((total, yearData) => total + yearData.papers.length, 0)} Previous Year Papers`
                      : `${sortedYears.find(y => y.year === selectedYear)?.papers.length || 0} Previous Year Papers`
                    }
                  </p>
                </div>
              </div>
              
              {/* Year Filter Tabs - Mobile Optimized */}
              <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-1">
              {/* All Years Option */}
              <Button
                variant={selectedYear === '' ? "default" : "outline"}
                size="sm"
                onClick={() => handleYearChange('')}
                className={`transition-all duration-200 text-xs sm:text-sm ${
                  selectedYear === ''
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium hidden xs:inline">All Years</span>
                  <span className="font-medium xs:hidden">All</span>
                  <div className="flex items-center space-x-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white text-xs font-bold">
                      {sortedYears.reduce((total, yearData) => total + yearData.papers.length, 0)}
                    </span>
                  </div>
                </div>
              </Button>
              
              {/* Individual Year Options */}
              {sortedYears
                .filter((yearData) => {
                  const stats = getYearStats(yearData.year);
                  // Show year if not in 'attempted' filter or if it has completed tests
                  return testFilter !== 'attempted' || stats.completed > 0;
                })
                .map((yearData) => {
                  const stats = getYearStats(yearData.year);
                  const isSelected = selectedYear === yearData.year;
                  
                  return (
                    <Button
                      key={yearData.year}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleYearChange(yearData.year)}
                      className={`transition-all duration-200 text-xs sm:text-sm ${
                        isSelected 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium">{yearData.year}</span>
                        <div className="flex items-center space-x-1">
                          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 text-white text-xs font-bold">
                            {stats.completed}
                          </span>
                          <span className="text-white/80 hidden sm:inline">/</span>
                          <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 text-white/80 text-xs font-bold">
                            {stats.total}
                          </span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 flex-1">
          {/* Papers Grid */}
          <ResponsiveScrollContainer
            cardCount={filteredPapers.length}
            className="mb-6"
          >
            {filteredPapers.map((paper) => {
              const isCompleted = completedTests.has(`pyq-${paper.id}`);
              const testScore = testScores.get(`pyq-${paper.id}`);
              

              return (
                <Card
                  key={paper.id}
                    className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.03] hover:border-primary/40 h-72 group ${
                      isCompleted 
                        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                        : paper.isPremium 
                          ? 'border-gradient-to-r from-yellow-200 to-orange-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 shadow-lg ring-2 ring-yellow-200/50' 
                          : 'border-border bg-gradient-to-br from-white to-slate-50'
                    } ${paper.isPremium && !hasAccess.get(paper.id) ? 'cursor-pointer' : ''}`}
                    onClick={() => handleCardClick(paper)}
                  >
                    <CardContent className="p-3 sm:p-4 h-full flex flex-col">
                      {/* Header */}
                      <div className="mb-2 sm:mb-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
                            {paper.name}
                          </h4>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <Badge className={`text-xs px-2 py-1 ${
                              paper.isPremium 
                                ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse shadow-lg border-2 border-yellow-300' 
                                : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white animate-pulse border-2 border-green-300 shadow-lg'
                            }`}>
                              {paper.isPremium ? (
                                <div className="flex items-center space-x-1">
                                  <Crown className="w-3 h-3" />
                                  <span>PREMIUM</span>
                                  {!hasAccess.get(paper.id) && <span className="text-xs ml-1">👆</span>}
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
                                onViewSolutions(paper.id);
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
                                onRetry(paper.id);
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
                              handleStartTest(paper);
                            }}
                            className={`w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm ${
                              paper.isPremium && !hasAccess.get(paper.id)
                                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                            }`}
                            size="sm"
                          >
                            {paper.isPremium && !hasAccess.get(paper.id) ? (
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
          onSelectPlan={handlePlanSelection}
          onClose={() => setShowMembershipPlans(false)}
        />
      </PerfectModal>

      {/* Test Start Modal */}
      {showTestStartModal && selectedTestForStart && (
        <TestStartModal
          isOpen={showTestStartModal}
          test={{
            name: selectedTestForStart.name,
            duration: selectedTestForStart.duration,
            questions: selectedTestForStart.questions.length,
            subjects: selectedTestForStart.subjects || ['General'],
            difficulty: selectedTestForStart.difficulty || 'Medium',
            isPremium: selectedTestForStart.isPremium || false,
            price: selectedTestForStart.price
          }}
          testType="pyq"
          examId={examId}
          onStart={handleStartWithLanguage}
          onClose={() => setShowTestStartModal(false)}
        />
      )}
    </div>
  );
};

export default YearWiseTabs;
