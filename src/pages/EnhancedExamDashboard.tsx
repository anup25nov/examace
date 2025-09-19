import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Medal,
  Crown,
  Lock,
  Users
} from "lucide-react";
import { examConfigs } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useComprehensiveStats } from "@/hooks/useComprehensiveStats";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useUserProfile } from "@/hooks/useUserProfile";
import { analytics } from "@/lib/analytics";
import { EnhancedTestCard } from "@/components/EnhancedTestCard";
import { YearWiseTabs } from "@/components/YearWiseTabs";
import { testDataLoader, YearData } from "@/lib/testDataLoader";
import { premiumService, PremiumTest } from "@/lib/premiumService";
import { examConfigService } from "@/lib/examConfigService";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { AdminAccess } from "@/components/admin/AdminAccess";

// Icon mapping for dynamic loading
const iconMap: { [key: string]: any } = {
  BookOpen,
  Trophy,
  FileText,
  Brain,
  Target
};

const EnhancedExamDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { profile } = useUserProfile();
  const { allStats, loadAllStats, getExamStatById, isTestCompleted, getIndividualTestScore } = useExamStats();
  const { stats: comprehensiveStats, loading: statsLoading, error: statsError, refreshStats } = useComprehensiveStats(examId);
  
  // Refresh stats when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (examId) {
        refreshStats();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [examId, refreshStats]);
  const { isAdmin, loading: adminLoading } = useAdmin();
  
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    bestRank: 0,
    lastActive: null as Date | null,
    avgScoreLast10: 0
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [testFilter, setTestFilter] = useState<'all' | 'attempted' | 'not-attempted'>('all');
  const [activeTab, setActiveTab] = useState<string>('pyq');
  
  // New state for enhanced features
  const [mockTests, setMockTests] = useState<{ free: PremiumTest[]; premium: PremiumTest[] }>({ free: [], premium: [] });
  const [pyqData, setPyqData] = useState<YearData[]>([]);
  const [practiceData, setPracticeData] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState(premiumService.getUserMembership());
  
  // Load user membership status
  useEffect(() => {
    const loadMembershipStatus = async () => {
      if (user?.id) {
        try {
          // Update membership status from the service
          const membership = premiumService.getUserMembership();
          setUserMembership(membership);
        } catch (error) {
          console.error('Error loading membership status:', error);
        }
      }
    };
    
    loadMembershipStatus();
  }, [user?.id]);

  const exam = examConfigs[examId as string];
  const examConfig = examConfigService.getExamConfig(examId as string);
  const userPhone = (profile as any)?.phone || localStorage.getItem("userPhone");
  const userName = (profile as any)?.name || localStorage.getItem("userName");
  const displayName = userName || (userPhone ? `Hi, ${userPhone}` : "User");

  // Load test data from JSON
  useEffect(() => {
    if (examId) {
      const testData = testDataLoader.getExamTestData(examId);
      if (testData) {
        setMockTests({
          free: testData.mock.free || [],
          premium: testData.mock.premium || []
        });
        setPyqData(testDataLoader.getPYQData(examId));
        setPracticeData(testDataLoader.getPracticeData(examId));
      }
    }
  }, [examId]);

  // Check test completions
  const checkTestCompletions = async () => {
    if (!examId || !exam) return;

    const completed = new Set<string>();

    // Check mock tests
    const allMockTests = [...mockTests.free, ...mockTests.premium];
    for (const test of allMockTests) {
      const isCompleted = await isTestCompleted(examId, 'mock', test.id, null);
      if (isCompleted) {
        completed.add(`mock-${test.id}`);
      }
    }

    // Check PYQ tests
    for (const yearData of pyqData) {
      for (const paper of yearData.papers) {
        const isCompleted = await isTestCompleted(examId, 'pyq', paper.id, null);
        if (isCompleted) {
          completed.add(`pyq-${paper.id}`);
        }
      }
    }

    setCompletedTests(completed);
  };

  // Load performance stats (best score and average of last 10 tests)
  const loadPerformanceStats = async () => {
    if (!examId || !user?.id) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_performance_stats' as any, {
        user_uuid: user.id,
        exam_name: examId
      });
      
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const stats = data[0] as any;
        setUserStats(prev => ({
          ...prev,
          bestScore: stats.best_score || 0,
          avgScoreLast10: stats.average_score_last_10 || 0,
          totalTests: stats.total_tests || 0
        }));
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  };

  // Load individual test scores
  const loadTestScores = async () => {
    if (!examId || !exam) return;

    const scores = new Map<string, { score: number; rank: number; totalParticipants: number }>();

    // Load Mock test scores
    const allMockTests = [...mockTests.free, ...mockTests.premium];
    for (const test of allMockTests) {
      const scoreResult = await getIndividualTestScore(examId, 'mock', test.id);
      const scoreData = (scoreResult as any).data || scoreResult;
      if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
        scores.set(`mock-${test.id}`, {
          score: scoreData.score,
          rank: scoreData.rank || 0,
          totalParticipants: scoreData.totalParticipants || 0
        });
      }
    }

    // Load PYQ test scores
    for (const yearData of pyqData) {
      for (const paper of yearData.papers) {
        const scoreResult = await getIndividualTestScore(examId, 'pyq', paper.id);
        const scoreData = (scoreResult as any).data || scoreResult;
        if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
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

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (examId) {
      loadAllStats();
      loadPerformanceStats();
    }
  }, [examId, navigate, isAuthenticated, loading]);

  useEffect(() => {
    if (examId && (mockTests.free.length > 0 || mockTests.premium.length > 0 || pyqData.length > 0)) {
      checkTestCompletions();
      loadTestScores();
    }
  }, [examId, mockTests, pyqData]);

  // Update user stats
  useEffect(() => {
    if (comprehensiveStats) {
      // Use comprehensive stats (includes last 10 average)
      let bestRank = 0;
      testScores.forEach((scoreData) => {
        if (scoreData.rank > 0 && (bestRank === 0 || scoreData.rank < bestRank)) {
          bestRank = scoreData.rank;
        }
      });

      setUserStats({
        totalTests: comprehensiveStats.totalTests,
        avgScore: comprehensiveStats.last10Average, // Use last 10 average
        bestScore: comprehensiveStats.bestScore,
        bestRank: bestRank,
        lastActive: comprehensiveStats.lastTestDate ? new Date(comprehensiveStats.lastTestDate) : null,
        avgScoreLast10: comprehensiveStats.last10Average
      });
    } else if (examId && allStats.length > 0) {
      // Fallback to legacy stats
      const currentExamStats = allStats.find(stat => stat.examId === examId);
      if (currentExamStats) {
        let bestRank = 0;
        testScores.forEach((scoreData) => {
          if (scoreData.rank > 0 && (bestRank === 0 || scoreData.rank < bestRank)) {
            bestRank = scoreData.rank;
          }
        });

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
          lastActive: currentExamStats.lastTestDate,
          avgScoreLast10: 0 // Will be updated by loadPerformanceStats
        });
      }
    }
  }, [examId, comprehensiveStats, allStats, testScores]);

  if (loading || statsLoading) {
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

  const handleTestStart = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string, language?: string) => {
    analytics.trackTestStart(examId!, type, itemId);
    
    const sectionId = type;
    let testPath = topicId 
      ? `/test/${examId}/${sectionId}/${itemId}/${topicId}`
      : `/test/${examId}/${sectionId}/${itemId}`;
    
    // Add language parameter if provided
    if (language) {
      testPath += `?lang=${language}`;
    }
    
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    }
    
    navigate(testPath);
  };

  const handleViewSolutions = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    analytics.trackSolutionView(examId!, type, itemId);
    
    const solutionsPath = topicId 
      ? `/solutions/${examId}/${type}/${itemId}/${topicId}`
      : `/solutions/${examId}/${type}/${itemId}`;
    navigate(solutionsPath);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    
    analytics.trackSectionOpen(sectionId, examId!);
  };

  // Calculate filter counts for specific section
  const getFilterCounts = (section?: string) => {
    let completedCount = 0;
    let notAttemptedCount = 0;
    
    if (!section || section === 'mock') {
      // Count mock tests
      const allMockTests = [...mockTests.free, ...mockTests.premium];
      allMockTests.forEach(test => {
        const completionKey = `mock-${test.id}`;
        if (completedTests.has(completionKey)) {
          completedCount++;
        } else {
          notAttemptedCount++;
        }
      });
    }
    
    if (!section || section === 'pyq') {
      // Count PYQ tests
      pyqData.forEach(yearData => {
        yearData.papers.forEach(paper => {
          const completionKey = `pyq-${paper.id}`;
          if (completedTests.has(completionKey)) {
            completedCount++;
          } else {
            notAttemptedCount++;
          }
        });
      });
    }
    
    return { completedCount, notAttemptedCount };
  };

  const { completedCount, notAttemptedCount } = getFilterCounts(activeTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleMessageAction = (actionType: string, purchaseLink?: string) => {
    if (actionType === 'mock') {
      // Switch to mock tab and show all tests
      setActiveTab('mock');
      setTestFilter('all');
    } else if (actionType === 'pyq') {
      // Switch to pyq tab and show all tests
      setActiveTab('pyq');
      setTestFilter('all');
    } else if (actionType === 'premium') {
      // Handle premium exploration with purchase link
      if (purchaseLink) {
        // Navigate to premium page with specific plan and feature
        navigate(purchaseLink);
      } else {
        // Fallback to general premium page
        navigate('/premium');
      }
    }
  };

  // Get section-specific messages for edge cases
  const getSectionMessage = (section: string) => {
    const { completedCount, notAttemptedCount } = getFilterCounts(section);
    const totalCount = completedCount + notAttemptedCount;
    const currentMembership = userMembership;
    
    if (testFilter === 'attempted' && completedCount === 0) {
      if (section === 'mock') {
        return {
          type: 'info',
          message: 'Attempt your first mock test to see your progress here!',
          icon: '🎯',
          actionText: 'Start Mock Test',
          actionType: 'mock'
        };
      } else if (section === 'pyq') {
        return {
          type: 'info',
          message: 'Start solving previous year questions to track your completion!',
          icon: '📚',
          actionText: 'Start PYQ Test',
          actionType: 'pyq'
        };
      }
    }
    
    // Check if user has completed all free content
    if (testFilter === 'attempted' && completedCount > 0 && notAttemptedCount === 0) {
      if (section === 'mock') {
        // Check if user has premium membership
        if (!currentMembership || !currentMembership.isPremium) {
          return {
            type: 'congratulations',
            message: '🎉 Excellent! You\'ve completed all free mock tests! Upgrade to Premium for 50+ advanced mock tests with detailed analytics.',
            icon: '🏆',
            actionText: 'Upgrade to Premium',
            actionType: 'premium',
            purchaseLink: '/premium?plan=basic&feature=mock-tests'
          };
        } else if (currentMembership.planType === 'monthly' || currentMembership.planType === 'yearly') {
          return {
            type: 'congratulations',
            message: '🚀 Outstanding! You\'ve mastered all basic mock tests! Upgrade to Pro for unlimited access to all premium features.',
            icon: '💎',
            actionText: 'Upgrade to Pro',
            actionType: 'premium',
            purchaseLink: '/premium?plan=pro&feature=unlimited-access'
          };
        } else {
          return {
            type: 'congratulations',
            message: '🌟 Phenomenal! You\'ve completed all available mock tests! You\'re truly mastering this exam!',
            icon: '👑',
            actionText: 'View All Tests',
            actionType: 'mock'
          };
        }
      } else if (section === 'pyq') {
        if (!currentMembership || !currentMembership.isPremium) {
          return {
            type: 'congratulations',
            message: '📚 Amazing! You\'ve solved all free PYQ sets! Get Premium access to 10+ years of previous year papers with solutions.',
            icon: '🎓',
            actionText: 'Upgrade to Premium',
            actionType: 'premium',
            purchaseLink: '/premium?plan=basic&feature=pyq-access'
          };
        } else if (currentMembership.planType === 'monthly' || currentMembership.planType === 'yearly') {
          return {
            type: 'congratulations',
            message: '🔥 Incredible! You\'ve completed all basic PYQ sets! Upgrade to Pro for exclusive access to all years and detailed analysis.',
            icon: '💎',
            actionText: 'Upgrade to Pro',
            actionType: 'premium',
            purchaseLink: '/premium?plan=pro&feature=complete-pyq'
          };
        } else {
          return {
            type: 'congratulations',
            message: '🏅 Outstanding! You\'ve mastered all available PYQ sets! Your preparation is top-notch!',
            icon: '👑',
            actionText: 'View All PYQ',
            actionType: 'pyq'
          };
        }
      }
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-white/95 via-blue-50/95 to-indigo-50/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
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
                  src="/logos/alternate_image.png" 
                  alt="Step2Sarkari Logo" 
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold text-foreground uppercase">S2S</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Welcome, {displayName}!</p>
                {userPhone && (
                  <p className="text-xs text-muted-foreground">📱 {userPhone}</p>
                )}
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdminPanel(true)}
                  className="text-xs"
                >
                  Admin
                </Button>
              )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">{userStats.totalTests}</p>
              <p className="text-sm text-blue-100 font-medium">Tests Taken</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 text-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">{userStats.bestScore}</p>
              <p className="text-sm text-purple-100 font-medium">Best Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">{userStats.avgScoreLast10}</p>
              <p className="text-sm text-orange-100 font-medium">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>
            <Button
              variant={testFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestFilter('all')}
              className="text-xs"
            >
              All Tests ({completedCount + notAttemptedCount})
            </Button>
            <Button
              variant={testFilter === 'attempted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestFilter('attempted')}
              className="text-xs"
            >
              Completed ({completedCount})
            </Button>
            <Button
              variant={testFilter === 'not-attempted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTestFilter('not-attempted')}
              className="text-xs"
            >
              Not Attempted ({notAttemptedCount})
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={examConfig?.tabOrder[0] || "pyq"} value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 p-1 rounded-xl shadow-lg border border-white/50">
            {examConfig?.tabOrder.map((tab) => {
              const isEnabled = examConfigService.isSectionEnabled(examId as string, tab);
              if (!isEnabled) return null;

              const tabConfig = {
                pyq: { icon: FileText, label: 'Previous Year' },
                mock: { icon: Trophy, label: 'Mock Tests' },
                practice: { icon: BookOpen, label: 'Practice' }
              };

              const { icon: Icon, label } = tabConfig[tab];

              const tabGradients = {
                pyq: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500',
                mock: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500',
                practice: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500'
              };

              return (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className={`flex items-center space-x-2 ${tabGradients[tab]} data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* PYQ Tab - First */}
          <TabsContent value="pyq" className="space-y-6">
            <YearWiseTabs
              years={pyqData}
              completedTests={completedTests}
              testScores={testScores}
              onStartTest={(testId, language) => handleTestStart('pyq', testId, undefined, language)}
              onViewSolutions={(testId) => handleViewSolutions('pyq', testId)}
              onRetry={(testId) => handleTestStart('pyq', testId)}
              testFilter={testFilter}
              sectionMessage={getSectionMessage('pyq')}
              onMessageAction={handleMessageAction}
            />
          </TabsContent>

          {/* Mock Tests Tab - Second */}
          <TabsContent value="mock" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-emerald-50 to-green-50">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <span>Full Mock Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(() => {
                  const message = getSectionMessage('mock');
                  return message ? (
                    <div className={`mb-6 p-4 rounded-lg border ${
                      message.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' :
                      message.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                      'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{message.icon}</div>
                          <p className={`font-medium ${
                            message.type === 'info' ? 'text-blue-700' :
                            message.type === 'success' ? 'text-green-700' :
                            'text-yellow-700'
                          }`}>
                            {message.message}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleMessageAction(message.actionType, message.purchaseLink)}
                          className={`${
                            message.type === 'info' ? 'bg-blue-600 hover:bg-blue-700' :
                            message.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                            'bg-yellow-600 hover:bg-yellow-700'
                          } text-white`}
                          size="sm"
                        >
                          {message.actionText}
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...mockTests.free, ...mockTests.premium]
                    .filter(test => {
                      const isCompleted = completedTests.has(`mock-${test.id}`);
                      if (testFilter === 'attempted') return isCompleted;
                      if (testFilter === 'not-attempted') return !isCompleted;
                      return true;
                    })
                    .map((test) => {
                    const isCompleted = completedTests.has(`mock-${test.id}`);
                    const testScore = testScores.get(`mock-${test.id}`);
                    
                    return (
                      <EnhancedTestCard
                        key={test.id}
                        test={test}
                        isCompleted={isCompleted}
                        testScore={testScore}
                        onStartTest={(language) => handleTestStart('mock', test.id, undefined, language)}
                        onViewSolutions={() => handleViewSolutions('mock', test.id)}
                        onRetry={() => handleTestStart('mock', test.id)}
                        testType="mock"
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab - Coming Soon */}
          <TabsContent value="practice" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50 to-pink-50">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <span>Practice Sets (Subject wise)</span>
                  <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full font-semibold shadow-md animate-pulse">
                    Coming Soon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center animate-pulse">
                    <BookOpen className="w-12 h-12 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Practice Sets Coming Soon!</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We're working hard to bring you comprehensive practice sets for all subjects. 
                    Stay tuned for subject-wise practice questions with detailed solutions.
                  </p>
                  
                  {/* Practice Categories Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                      <h4 className="font-semibold text-purple-700 mb-2">Subject-wise Practice</h4>
                      <p className="text-sm text-purple-600">Targeted practice for each subject</p>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                      <h4 className="font-semibold text-purple-700 mb-2">Topic-wise Practice</h4>
                      <p className="text-sm text-purple-600">Focus on specific topics</p>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                      <h4 className="font-semibold text-purple-700 mb-2">Difficulty Levels</h4>
                      <p className="text-sm text-purple-600">Easy, Medium, Hard practice sets</p>
                    </div>
                    <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-300">
                      <h4 className="font-semibold text-purple-700 mb-2">Performance Analytics</h4>
                      <p className="text-sm text-purple-600">Track your progress</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>Quantitative Aptitude</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>English Language</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>General Intelligence</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>General Awareness</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminAccess onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
};

export default EnhancedExamDashboard;
