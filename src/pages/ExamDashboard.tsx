import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Target, 
  ArrowLeft,
  Play,
  FileText,
  Brain,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  BarChart3,
  Star,
  Medal
} from "lucide-react";
import { examConfigs } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QuestionLoader } from "@/lib/questionLoader";
import { analytics } from "@/lib/analytics";
import { testAvailabilityService } from "@/lib/testAvailability";
import { ProfessionalExamCard } from "@/components/ProfessionalExamCard";
import { ProfessionalSectionHeader } from "@/components/ProfessionalSectionHeader";
import { ReferralBanner } from "@/components/ReferralBanner";
import Footer from "@/components/Footer";

// Icon mapping for dynamic loading
const iconMap: { [key: string]: any } = {
  BookOpen,
  Trophy,
  FileText,
  Brain,
  Target
};

const ExamDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { profile } = useUserProfile();
  const { allStats, loadAllStats, getExamStatById, isTestCompleted, getIndividualTestScore } = useExamStats();
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    bestRank: 0,
    lastActive: null as Date | null
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [testFilter, setTestFilter] = useState<'all' | 'attempted' | 'not-attempted'>('all');
  const [autoOpenSections, setAutoOpenSections] = useState<Set<string>>(new Set());
  const [availableTests, setAvailableTests] = useState<{
    mock: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string }>;
    pyq: Array<{ year: string; papers: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string }> }>;
    practice: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string }>;
  }>({ mock: [], pyq: [], practice: [] });

  const exam = examConfigs[examId as string];
  const userEmail = profile?.email || localStorage.getItem("userEmail");

  // Load available tests dynamically
  useEffect(() => {
    const loadAvailableTests = async () => {
      if (examId) {
        const examConfig = examConfigs[examId];
        if (!examConfig) return;

        // Get all tests from config
        const allTests = {
          mock: examConfig.sections.find(s => s.id === 'mock')?.tests || [],
          pyq: examConfig.sections.find(s => s.id === 'pyq')?.years || [],
          practice: examConfig.sections.find(s => s.id === 'practice')?.subjects?.flatMap(subject => 
            subject.topics?.map(topic => ({
              id: `${subject.id}-${topic.id}`,
              name: topic.name,
              duration: 30, // Default duration for practice tests
              questions: [], // Empty questions array for practice tests
              breakdown: `Practice questions - ${subject.name}`
            })) || []
          ) || []
        };

        // Filter to only show available tests
        const availableTests = await testAvailabilityService.getAvailableTests(examId);
        setAvailableTests(availableTests);
      }
    };
    loadAvailableTests();
  }, [examId]);

  // Check test completions
  const checkTestCompletions = async () => {
    if (!examId || !exam) return;

    const completed = new Set<string>();

    // Check mock tests
    for (const test of availableTests.mock) {
      const isCompleted = await isTestCompleted(examId, 'mock', test.id, null);
      if (isCompleted) {
        // For mock tests, topicId is null, so the key becomes mock-testId
        completed.add(`mock-${test.id}`);
      }
    }

    // Check PYQ tests
    for (const yearData of availableTests.pyq) {
      for (const paper of yearData.papers) {
        const isCompleted = await isTestCompleted(examId, 'pyq', paper.id, null);
        if (isCompleted) {
          // For PYQ tests, topicId is null, so the key becomes pyq-testId
          completed.add(`pyq-${paper.id}`);
        }
      }
    }

    // Check practice tests
    for (const test of availableTests.practice) {
      const isCompleted = await isTestCompleted(examId, 'practice', test.id, test.id);
      if (isCompleted) {
        // For practice tests, we pass test.id as topicId, so the key becomes practice-testId-testId
        completed.add(`practice-${test.id}-${test.id}`);
      }
    }

    setCompletedTests(completed);
  };

  // Load individual test scores for Mock and PYQ tests
  const loadTestScores = async () => {
    if (!examId || !exam) return;

    const scores = new Map<string, { score: number; rank: number; totalParticipants: number }>();

    // Load Mock test scores
    for (const test of availableTests.mock) {
      const scoreResult = await getIndividualTestScore(examId, 'mock', test.id);
      // Handle both Supabase result format and fallback format
      const scoreData = (scoreResult as any).data || scoreResult;
      if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
        // For mock tests, topicId is null, so the key becomes mock-testId
        scores.set(`mock-${test.id}`, {
          score: scoreData.score,
          rank: scoreData.rank || 0,
          totalParticipants: scoreData.totalParticipants || 0
        });
      }
    }

    // Load PYQ test scores
    for (const yearData of availableTests.pyq) {
      for (const paper of yearData.papers) {
        const scoreResult = await getIndividualTestScore(examId, 'pyq', paper.id);
        // Handle both Supabase result format and fallback format
        const scoreData = (scoreResult as any).data || scoreResult;
        if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
          // For PYQ tests, topicId is null, so the key becomes pyq-testId
          scores.set(`pyq-${paper.id}`, {
            score: scoreData.score,
            rank: scoreData.rank || 0,
            totalParticipants: scoreData.totalParticipants || 0
          });
        }
      }
    }

    setTestScores(scores);
  };

  // Calculate accurate filter counts
  const getFilterCounts = () => {
    let completedCount = 0;
    let notAttemptedCount = 0;
    
    // Count mock tests
    availableTests.mock.forEach(test => {
      const completionKey = `mock-${test.id}`;
      if (completedTests.has(completionKey)) {
        completedCount++;
      } else {
        notAttemptedCount++;
      }
    });
    
    // Count PYQ tests
    availableTests.pyq.forEach(yearData => {
      yearData.papers.forEach(paper => {
        const completionKey = `pyq-${paper.id}`;
        if (completedTests.has(completionKey)) {
          completedCount++;
        } else {
          notAttemptedCount++;
        }
      });
    });
    
    return { completedCount, notAttemptedCount };
  };

  const { completedCount, notAttemptedCount } = getFilterCounts();

  // Update filter logic
  const handleFilterChange = (filter: 'all' | 'attempted' | 'not-attempted') => {
    setTestFilter(filter);
    
    // Auto-open sections when filter is applied
    if (filter !== 'all') {
      setAutoOpenSections(new Set(['mock', 'pyq']));
      setOpenSections(prev => ({
        ...prev,
        mock: true,
        pyq: true
      }));
    } else {
      setAutoOpenSections(new Set());
    }
  };

  useEffect(() => {
    if (loading) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // Load exam stats immediately
    if (examId) {
      // Load stats only once
      loadAllStats();
    }
  }, [examId, navigate, isAuthenticated, loading]);

  // Separate useEffect for completion checking and score loading after tests are loaded
  useEffect(() => {
    if (examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
      // Check test completions
      checkTestCompletions();
      
      // Load test scores
      loadTestScores();
    }
  }, [examId, availableTests.mock.length, availableTests.pyq.length, availableTests.practice.length]);

  // Add a refresh trigger when the component mounts (user navigates back to dashboard)
  useEffect(() => {
    const handleRouteChange = () => {
      if (examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
        // Refresh completions and scores when user returns to dashboard
        checkTestCompletions();
        loadTestScores();
      }
    };

    // Trigger refresh when component mounts
    handleRouteChange();

    // Also listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Also refresh when component becomes visible (user returns from test)
    const handleVisibilityChange = () => {
      if (!document.hidden && examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
        checkTestCompletions();
        loadTestScores();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [examId, availableTests.mock.length, availableTests.pyq.length, availableTests.practice.length]);

  // Track page view when component mounts
  useEffect(() => {
    if (examId) {
      analytics.trackPageView(`exam-dashboard-${examId}`, `Exam Dashboard - ${examId}`);
    }
  }, [examId]);

  // Refresh completion status when user returns to dashboard (e.g., after completing a test)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
      }
    };

    const handleFocus = () => {
      if (examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
      }
    };

    // Also refresh when the component mounts (user navigates back to dashboard)
    const handlePageShow = () => {
      if (examId && (availableTests.mock.length > 0 || availableTests.pyq.length > 0 || availableTests.practice.length > 0)) {
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [examId, availableTests.mock.length, availableTests.pyq.length, availableTests.practice.length]);

  // Separate useEffect for updating userStats when allStats change
  useEffect(() => {
    
    if (examId && allStats.length > 0) {
      const currentExamStats = allStats.find(stat => stat.examId === examId);
      if (currentExamStats) {
        
        // Calculate best rank from individual test scores
        let bestRank = 0;
        testScores.forEach((scoreData) => {
          if (scoreData.rank > 0 && (bestRank === 0 || scoreData.rank < bestRank)) {
            bestRank = scoreData.rank;
          }
        });

        // Calculate average score from individual test scores
        let avgScore = 0;
        if (testScores.size > 0) {
          const totalScore = Array.from(testScores.values()).reduce((sum, scoreData) => sum + scoreData.score, 0);
          avgScore = Math.round(totalScore / testScores.size);
        }

        setUserStats({
          totalTests: currentExamStats.totalTests,
          avgScore: avgScore || currentExamStats.averageScore,
          bestScore: currentExamStats.bestScore,
          bestRank: bestRank,
          lastActive: currentExamStats.lastTestDate
        });
      } else {
        setUserStats({
          totalTests: 0,
          avgScore: 0,
          bestScore: 0,
          bestRank: 0,
          lastActive: null
        });
      }
    } else if (examId && allStats.length === 0) {
      setUserStats({
        totalTests: 0,
        avgScore: 0,
        bestScore: 0,
        bestRank: 0,
        lastActive: null
      });
    }
  }, [examId, allStats, testScores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Exam Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  const handleTestStart = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    // Clear cache for this specific test before starting
    const actualTopicId = topicId || itemId;
    const completionKey = `${type}-${itemId}-${actualTopicId}`;
    const scoreKey = `${type}-${itemId}-${actualTopicId}`;
    
    // Remove from completed tests set
    setCompletedTests(prev => {
      const newSet = new Set(prev);
      newSet.delete(completionKey);
      return newSet;
    });
    
    // Remove from test scores
    setTestScores(prev => {
      const newMap = new Map(prev);
      newMap.delete(scoreKey);
      return newMap;
    });
    
    
    // Track test start
    analytics.trackTestStart(examId!, type, itemId);
    
    // The route expects: /test/:examId/:sectionId/:testType/:topic?
    // Use the actual test type as sectionId
    const sectionId = type; // Use the actual test type (mock/pyq/practice) as sectionId
    const testPath = topicId 
      ? `/test/${examId}/${sectionId}/${itemId}/${topicId}`
      : `/test/${examId}/${sectionId}/${itemId}`;
    
    // Request fullscreen before navigation
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    }
    
    navigate(testPath);
  };

  const handleViewSolutions = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    // Track solution view
    analytics.trackSolutionView(examId!, type, itemId);
    
    // Navigate to solutions view for the completed test
    const solutionsPath = topicId 
      ? `/solutions/${examId}/${type}/${itemId}/${topicId}`
      : `/solutions/${examId}/${type}/${itemId}`;
    console.log('Navigating to solutions:', solutionsPath);
    navigate(solutionsPath);
  };


  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    
    // Track section interaction
    analytics.trackSectionOpen(sectionId, examId!);
  };

  // Helper function to create test button with completion indicator
  const createTestButton = (
    testId: string,
    testName: string,
    testType: 'mock' | 'pyq' | 'practice',
    topicId?: string
  ) => {
    const completionKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const isCompleted = completedTests.has(completionKey);
    
    // Apply filter
    if (testFilter === 'attempted' && !isCompleted) return null;
    if (testFilter === 'not-attempted' && isCompleted) return null;
    
    // Get score and rank for Mock and PYQ tests  
    const scoreKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const testScore = testScores.get(scoreKey);

    return (
      <Card key={testId} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] h-48 ${
        isCompleted ? 'border-green-200 bg-green-50/50 shadow-md' : 'border-border hover:border-primary/20'
      }`}>
        <CardContent className="p-4 sm:p-5 h-full flex flex-col">
          <div className="mb-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">{testName}</h3>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                {(testType === 'mock' || testType === 'pyq') && (
                  <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full font-bold shadow-md">
                    FREE
                  </span>
                )}
                {isCompleted && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Show score and rank for Mock and PYQ tests - Fixed height */}
          <div className="mb-4 min-h-[80px] flex items-center justify-center">
            {testScore && (testType === 'mock' || testType === 'pyq') ? (
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
          
          {/* Action buttons - Fixed at bottom */}
          <div className="flex flex-col space-y-3 mt-auto">
            {isCompleted ? (
              <>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => handleViewSolutions(testType, testId, topicId)}
                  >
                    📖 View Solutions
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-10 text-sm bg-primary hover:bg-primary/90 transition-colors"
                    onClick={() => handleTestStart(testType, testId, topicId)}
                  >
                    🔄 Retry
                  </Button>
                </div>
              </>
            ) : (
              <Button
                size="sm"
                variant="default"
                className="w-full h-10 text-sm bg-primary hover:bg-primary/90 transition-colors"
                onClick={() => handleTestStart(testType, testId, topicId)}
              >
                ▶️ Start Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/logos/examace-logo.svg" 
                  alt="ExamAce Logo" 
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold text-foreground uppercase">{exam.name}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Welcome!</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Trophy className="w-6 h-6 text-primary animate-pulse" />
            <h3 className="text-xl font-bold text-foreground">Performance Statistics</h3>
          </div>
        </div>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <Card className="text-center gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{userStats.totalTests}</p>
              <p className="text-sm text-muted-foreground font-medium">Tests Taken</p>
            </CardContent>
          </Card>
          
          <Card className="text-center gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{userStats.avgScore}%</p>
              <p className="text-sm text-muted-foreground font-medium">Average Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center gradient-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-2">{userStats.bestScore}%</p>
              <p className="text-sm text-muted-foreground font-medium">Best Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 h-32 flex items-center">
            <CardContent className="p-4 text-center w-full">
              <div className="w-10 h-10 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                <Medal className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{userStats.bestRank || '-'}</p>
              <p className="text-sm font-medium text-muted-foreground">Best Rank</p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 h-32 flex items-center">
            <CardContent className="p-4 text-center w-full">
              <div className="w-10 h-10 mx-auto mb-2 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">{userStats.totalTests}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Mock Test */}
        <Card className="exam-card-hover cursor-pointer gradient-primary text-white border-0 mb-8">
          <CardContent className="p-6 text-center">
            <Play className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {availableTests.mock.length > 0 && availableTests.mock.some(test => !completedTests.has(`mock-${test.id}`)) 
                ? 'Quick Full Mock Test' 
                : availableTests.mock.length > 0 
                ? 'All Mock Tests Completed! 🎉'
                : 'Start Your Preparation'}
            </h3>
            <p className="text-white/90 mb-4">
              {availableTests.mock.length > 0 && availableTests.mock.some(test => !completedTests.has(`mock-${test.id}`))
                ? 'Take a complete practice test to assess your preparation'
                : availableTests.mock.length > 0
                ? 'Congratulations! You have completed all available mock tests. Try PYQ or Practice tests to continue improving!'
                : 'Begin your exam preparation with our comprehensive test series'}
            </p>
            <Button 
              variant="secondary" 
              className="w-full max-w-xs"
              onClick={() => {
                // Find the first unattempted mock test
                const unattemptedMock = availableTests.mock.find(test => {
                  const completionKey = `mock-${test.id}`;
                  return !completedTests.has(completionKey);
                });
                
                if (unattemptedMock) {
                  handleTestStart('mock', unattemptedMock.id, null);
                } else if (availableTests.mock.length > 0) {
                  // All mocks completed - navigate to PYQ section
                  const pyqSection = document.querySelector('[data-section="pyq"]');
                  if (pyqSection) {
                    pyqSection.scrollIntoView({ behavior: 'smooth' });
                    // Open the PYQ section
                    toggleSection('pyq');
                  } else {
                    // Fallback: find first unattempted PYQ
                    let unattemptedPyq = null;
                    for (const yearData of availableTests.pyq) {
                      unattemptedPyq = yearData.papers.find(paper => {
                        const completionKey = `pyq-${paper.id}`;
                        return !completedTests.has(completionKey);
                      });
                      if (unattemptedPyq) break;
                    }
                    
                    if (unattemptedPyq) {
                      handleTestStart('pyq', unattemptedPyq.id, null);
                    } else {
                      alert('Congratulations! You have completed all available tests. 🎉');
                    }
                  }
                } else {
                  // No mock tests available - try PYQ
                  let unattemptedPyq = null;
                  for (const yearData of availableTests.pyq) {
                    unattemptedPyq = yearData.papers.find(paper => {
                      const completionKey = `pyq-${paper.id}`;
                      return !completedTests.has(completionKey);
                    });
                    if (unattemptedPyq) break;
                  }
                  
                  if (unattemptedPyq) {
                    handleTestStart('pyq', unattemptedPyq.id, null);
                  } else {
                    alert('No tests available at the moment. Please try again later.');
                  }
                }
              }}
            >
              Start Mock Test
            </Button>
          </CardContent>
        </Card>

        {/* Test Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
            <Button
              variant={testFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('all')}
              className="text-xs"
            >
              All Tests ({availableTests.mock.length + availableTests.pyq.reduce((sum, year) => sum + year.papers.length, 0)})
            </Button>
            <Button
              variant={testFilter === 'attempted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('attempted')}
              className="text-xs"
            >
              Completed ({completedCount})
            </Button>
            <Button
              variant={testFilter === 'not-attempted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('not-attempted')}
              className="text-xs"
            >
              Not Attempted ({notAttemptedCount})
            </Button>
          </div>
        </div>

        {/* Main Sections */}
        <div className="space-y-6">
          {exam.sections.map((section) => {
            const isDisabled = section.id === 'practice';
            
            // Check if section has any tests based on filter
            let hasTests = false;
            if (section.id === 'mock') {
              hasTests = availableTests.mock.length > 0;
            } else if (section.id === 'pyq') {
              hasTests = availableTests.pyq.length > 0;
            } else if (section.id === 'practice') {
              hasTests = availableTests.practice.length > 0;
            }
            
            // Don't render section if no tests available
            if (!hasTests) return null;
            
            return (
              <Card key={section.id} className={`gradient-card border-0 ${isDisabled ? 'opacity-50' : ''}`} data-section={section.id}>
                <Collapsible 
                  open={openSections[section.id]} 
                  onOpenChange={() => !isDisabled && toggleSection(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`transition-colors ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/20'}`}>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {iconMap[section.icon] && React.createElement(iconMap[section.icon], {
                            className: `w-6 h-6 ${section.color}`
                          })}
                          <span>{section.name}</span>
                          {isDisabled && (
                            <span className="text-xs bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full font-semibold shadow-md">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        {!isDisabled && (
                          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                            openSections[section.id] ? 'rotate-180' : ''
                          }`} />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent>
                    {/* Mock Tests */}
                    {section.id === 'mock' && availableTests.mock.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {availableTests.mock.map((test) => 
                          createTestButton(
                            test.id,
                            test.name, // Use the name from JSON
                            'mock',
                            null // Mock tests don't have topicId
                          )
                        )}
                      </div>
                    )}

                    {/* Previous Year Questions */}
                    {section.id === 'pyq' && availableTests.pyq.length > 0 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                          {availableTests.pyq.map((yearData) => {
                            // Filter papers based on current filter
                            const filteredPapers = yearData.papers.filter(paper => {
                              const completionKey = `pyq-${paper.id}`;
                              const isCompleted = completedTests.has(completionKey);
                              
                              if (testFilter === 'attempted') return isCompleted;
                              if (testFilter === 'not-attempted') return !isCompleted;
                              return true; // Show all for 'all' filter
                            });
                            
                            // Don't render year card if no papers match the filter
                            if (filteredPapers.length === 0) return null;
                            
                            return (
                              <Card key={yearData.year} className="gradient-card border-0 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                                <CardContent className="p-4">
                                  <div className="text-center mb-4">
                                    <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{yearData.year}</h4>
                                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                      {filteredPapers.length} {filteredPapers.length === 1 ? 'Paper' : 'Papers'}
                                    </p>
                                  </div>
                                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                    {filteredPapers.map((paper) => 
                                      createTestButton(
                                        paper.id,
                                        paper.name,
                                        'pyq',
                                        null
                                      )
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Practice Sets */}
                    {section.id === 'practice' && availableTests.practice.length > 0 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {availableTests.practice.map((test) => 
                            createTestButton(
                              test.id,
                              test.name, // Use the name from JSON
                              'practice',
                              test.id
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ExamDashboard;