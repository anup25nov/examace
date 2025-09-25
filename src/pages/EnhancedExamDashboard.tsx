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
import { dynamicExamService } from "@/lib/dynamicExamService";
import { useExamStats } from "@/hooks/useExamStats";
import { useComprehensiveStats } from "@/hooks/useComprehensiveStats";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { analytics } from "@/lib/analytics";
import { EnhancedTestCard } from "@/components/EnhancedTestCard";
import { YearWiseTabs } from "@/components/YearWiseTabs";
import { secureTestDataLoader } from "@/lib/secureTestDataLoader";
import { premiumService, PremiumTest } from "@/lib/premiumService";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { bulkTestService } from "@/lib/bulkTestService";
import PullToRefresh from "@/components/PullToRefresh";
import ResponsiveScrollContainer from "@/components/ResponsiveScrollContainer";

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
  const { profile, membership } = useDashboardData();
  const { allStats, loadAllStats, getExamStatById, isTestCompleted, getIndividualTestScore } = useExamStats();
  const { stats: comprehensiveStats, loading: statsLoading, error: statsError, refreshStats } = useComprehensiveStats(examId);
  
  // Remove focus event listener to prevent unnecessary API calls
  // Stats will be refreshed only when needed (e.g., after test completion)
  
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    bestRank: 0,
    lastActive: null as Date | null,
    avgScoreLast10: 0
  });
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [testFilter, setTestFilter] = useState<'all' | 'attempted' | 'not-attempted'>('all');
  const [activeTab, setActiveTab] = useState<string>('pyq');
  
  // New state for enhanced features
  const [mockTests, setMockTests] = useState<{ free: PremiumTest[]; premium: PremiumTest[] }>({ free: [], premium: [] });
  const [pyqData, setPyqData] = useState<any[]>([]);
  const [practiceData, setPracticeData] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState(membership || premiumService.getUserMembership());

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    try {
      // Refresh all stats and data
      await loadAllStats();
      await refreshStats();
      
      // Reload exam data
      if (examId) {
        const exam = dynamicExamService.getExamConfig(examId);
        if (exam) {
          // Reload mock tests using dynamicTestDataLoader
          const { dynamicTestDataLoader } = await import('@/lib/dynamicTestDataLoader');
          const mockData = await dynamicTestDataLoader.getMockTests(examId);
          const convertedMockData = mockData.map(test => ({
            id: test.id,
            name: test.name,
            duration: test.duration,
            questions: test.questions.length,
            subjects: test.subjects || [],
            difficulty: 'medium',
            description: test.description || '',
            isPremium: test.isPremium || false,
            price: test.isPremium ? 99 : 0,
            benefits: test.isPremium ? ['Advanced questions', 'Detailed solutions'] : [],
            questionData: test.questions
          }));
          setMockTests({ free: convertedMockData.filter(t => !t.isPremium), premium: convertedMockData.filter(t => t.isPremium) });
          
          // Reload PYQ data
          const pyqData = await dynamicTestDataLoader.getPYQData(examId);
          setPyqData(pyqData);
          
          // Reload practice data
          const practiceData = await dynamicTestDataLoader.getPracticeData(examId);
          setPracticeData(practiceData);
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };
  
  // Check for last visited section on component mount
  useEffect(() => {
    const lastVisitedSection = localStorage.getItem('lastVisitedSection');
    if (lastVisitedSection && ['pyq', 'mock', 'practice'].includes(lastVisitedSection)) {
      setActiveTab(lastVisitedSection);
      // Clear the stored section after using it
      localStorage.removeItem('lastVisitedSection');
    }
  }, []);
  
  // Update membership status when context data changes
  useEffect(() => {
    if (membership) {
      setUserMembership(membership);
    } else {
      // Fallback to service if no membership in context
      const serviceMembership = premiumService.getUserMembership();
      setUserMembership(serviceMembership);
    }
  }, [membership]);

  const exam = dynamicExamService.getExamConfig(examId as string);
  // Using dynamic exam service instead of examConfigService
  const userPhone = (profile as any)?.phone || localStorage.getItem("userPhone");
  const userName = (profile as any)?.name || localStorage.getItem("userName");
  const cleanedPhone = userPhone?.replace(/^\+91/, "");
  const displayName = userName || (cleanedPhone ? `Hi, ${cleanedPhone}` : "User");

  // Load test data dynamically
  useEffect(() => {
    const loadDynamicTestData = async () => {
      if (examId) {
        try {
          const { mock, pyq, practice } = await secureTestDataLoader.getAllTestData(examId);
          
          // Process mock tests
          const freeTests = mock.filter(test => !test.isPremium);
          const premiumTests = mock.filter(test => test.isPremium);
          
          setMockTests({
            free: freeTests.map(test => ({
              id: test.id,
              name: test.name,
              duration: test.duration,
              questions: test.questions, // questions is already a number
              breakdown: test.description,
              subjects: test.subjects,
              difficulty: test.difficulty,
              description: test.description,
              isPremium: test.isPremium,
              price: test.price
            })),
            premium: premiumTests.map(test => ({
              id: test.id,
              name: test.name,
              duration: test.duration,
              questions: test.questions, // questions is already a number
              breakdown: test.description,
              subjects: test.subjects,
              difficulty: test.difficulty,
              description: test.description,
              isPremium: test.isPremium,
              price: test.price
            }))
          });

          // Process PYQ data - group by year
          const pyqByYear = pyq.reduce((acc, test) => {
            const year = test.year || test.metadata?.year || '2024';
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push({
              id: test.id,
              name: test.name,
              duration: test.duration,
              questions: test.questions, // questions is already a number
              breakdown: test.description,
              subjects: test.subjects,
              difficulty: test.difficulty,
              description: test.description,
              isPremium: test.isPremium,
              price: test.price
            });
            return acc;
          }, {} as Record<string, any[]>);

          const pyqData = Object.entries(pyqByYear).map(([year, papers]) => ({
            year,
            papers
          }));

          setPyqData(pyqData);

          // Process practice data
          setPracticeData(practice.map(test => ({
            id: test.id,
            name: test.name,
            duration: test.duration,
            questions: test.questions, // questions is already a number
            breakdown: test.description,
            isPremium: test.isPremium,
            price: test.price
          })));
        } catch (error) {
          console.error('❌ [EnhancedExamDashboard] Error loading test data:', error);
          // Fallback to empty data
          setMockTests({ free: [], premium: [] });
          setPyqData([]);
          setPracticeData([]);
        }
      }
    };

    loadDynamicTestData();
  }, [examId]);

  // Check test completions using bulk API
  const checkTestCompletions = async () => {
    if (!examId || !exam) return;

    try {
      // Get all test completions for the exam at once
      const { data: allCompletions, error } = await bulkTestService.getAllTestCompletionsForExam(examId);
      
      if (error) {
        console.error('Error getting bulk test completions:', error);
        return;
      }

      // Process completions into maps
      const { completedTests, testScores } = bulkTestService.processBulkCompletionsWithType(allCompletions);
      
      // Minimal logging for debugging
      console.log('✅ [EnhancedExamDashboard] Loaded test completions:', completedTests.size, 'completed tests');
      
      setCompletedTests(completedTests);
      setTestScores(testScores);
    } catch (error) {
      console.error('Error in checkTestCompletions:', error);
    }
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

  // Test scores are now loaded with completions in the bulk API

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

  // Get membership badge
  const getMembershipBadge = () => {
    if (!userMembership) {
      return <Badge variant="outline" className="text-xs">Free</Badge>;
    }
    
    // Handle different UserMembership interfaces
    const planId = (userMembership as any).plan_id || (userMembership as any).planType;
    
    switch (planId) {
      case 'pro':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Pro</Badge>;
      case 'pro_plus':
        return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Pro+</Badge>;
      case 'yearly':
      case 'lifetime':
        return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Pro+</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Free</Badge>;
    }
  };

  // Get section-specific messages for edge cases
  const getSectionMessage = (section: string): {
    type: 'info' | 'success' | 'warning';
    message: string;
    icon: string;
    actionText: string;
    actionType: string;
    purchaseLink?: string;
  } | undefined => {
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
            type: 'success',
            message: '🎉 Excellent! You\'ve completed all free mock tests! Upgrade to Premium for 50+ advanced mock tests with detailed analytics.',
            icon: '🏆',
            actionText: 'Upgrade to Premium',
            actionType: 'premium',
            purchaseLink: '/premium?plan=basic&feature=mock-tests'
          };
        } else if (currentMembership.planType === 'monthly' || currentMembership.planType === 'yearly') {
          return {
            type: 'success',
            message: '🚀 Outstanding! You\'ve mastered all basic mock tests! Upgrade to Pro for unlimited access to all premium features.',
            icon: '💎',
            actionText: 'Upgrade to Pro',
            actionType: 'premium',
            purchaseLink: '/premium?plan=pro&feature=unlimited-access'
          };
        } else {
          return {
            type: 'success',
            message: '🌟 Phenomenal! You\'ve completed all available mock tests! You\'re truly mastering this exam!',
            icon: '👑',
            actionText: 'View All Tests',
            actionType: 'mock'
          };
        }
      } else if (section === 'pyq') {
        if (!currentMembership || !currentMembership.isPremium) {
          return {
            type: 'success',
            message: '📚 Amazing! You\'ve solved all free PYQ sets! Get Premium access to 10+ years of previous year papers with solutions.',
            icon: '🎓',
            actionText: 'Upgrade to Premium',
            actionType: 'premium',
            purchaseLink: '/premium?plan=basic&feature=pyq-access'
          };
        } else if (currentMembership.planType === 'monthly' || currentMembership.planType === 'yearly') {
          return {
            type: 'success',
            message: '🔥 Incredible! You\'ve completed all basic PYQ sets! Upgrade to Pro for exclusive access to all years and detailed analysis.',
            icon: '💎',
            actionText: 'Upgrade to Pro',
            actionType: 'premium',
            purchaseLink: '/premium?plan=pro&feature=complete-pyq'
          };
        } else {
          return {
            type: 'success',
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
    <PullToRefresh onRefresh={handleRefresh}>
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
                <div className="flex items-center space-x-2 justify-end">
                  <p className="text-sm font-medium text-foreground">{displayName}!</p>
                  {/* {getMembershipBadge()} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Stats Overview */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-lg font-bold text-foreground">Performance Statistics</h3>
          </div>
        </div>
        
        {/* Main Stats Grid - Optimized for mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 max-w-6xl mx-auto">
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white">
            <CardContent className="p-3 md:p-6">
              <div className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{userStats.totalTests}</p>
              <p className="text-xs md:text-sm text-blue-100 font-medium">Test Attempted</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 text-white">
            <CardContent className="p-3 md:p-6">
              <div className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{userStats.bestScore}</p>
              <p className="text-xs md:text-sm text-purple-100 font-medium">Best Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-orange-500 via-red-600 to-pink-600 text-white">
            <CardContent className="p-3 md:p-6">
              <div className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Star className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{userStats.avgScoreLast10}</p>
              <p className="text-xs md:text-sm text-orange-100 font-medium">Average Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white">
            <CardContent className="p-3 md:p-6">
              <div className="w-10 h-10 md:w-16 md:h-16 mx-auto mb-2 md:mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <p className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{userStats.bestRank || 'N/A'}</p>
              <p className="text-xs md:text-sm text-green-100 font-medium">Best Rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pyq" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 p-1 rounded-xl shadow-lg border border-white/50">
            {exam?.sections.map((section) => {
              // Hide practice section for now
              if (section.id === 'practice') return null;
              
              const isEnabled = true; // All sections are enabled in dynamic system
              if (!isEnabled) return null;

              const tabConfig = {
                pyq: { icon: FileText, label: 'Previous Year' },
                mock: { icon: Trophy, label: 'Mock Tests' },
                practice: { icon: BookOpen, label: 'Practice' }
              };

              const { icon: Icon, label } = tabConfig[section.id as keyof typeof tabConfig];

              const tabGradients = {
                pyq: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500',
                mock: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500',
                practice: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500'
              };

              return (
                <TabsTrigger 
                  key={section.id}
                  value={section.id} 
                  className={`flex items-center space-x-2 ${tabGradients[section.id as keyof typeof tabGradients]} data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-medium`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Test Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-center gap-2 px-2">
              <div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
                <Button
                  variant={testFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Test filter changed to: all');
                    setTestFilter('all');
                  }}
                  className="text-xs flex-1 sm:flex-none min-w-0"
                >
                  <span className="hidden sm:inline">All Tests</span>
                  <span className="sm:hidden">All</span>
                  <span className={`ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                    testFilter === 'all' ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'
                  }`}>
                    {completedCount + notAttemptedCount}
                  </span>
                </Button>
                <Button
                  variant={testFilter === 'attempted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Test filter changed to: attempted');
                    setTestFilter('attempted');
                  }}
                  className="text-xs flex-1 sm:flex-none min-w-0"
                >
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs font-bold">
                    {completedCount}
                  </span>
                </Button>
                <Button
                  variant={testFilter === 'not-attempted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    console.log('Test filter changed to: not-attempted');
                    setTestFilter('not-attempted');
                  }}
                  className="text-xs flex-1 sm:flex-none min-w-0"
                >
                  <span className="hidden sm:inline">Not Attempted</span>
                  <span className="sm:hidden">New</span>
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-600 text-white text-xs font-bold">
                    {notAttemptedCount}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* PYQ Tab - First */}
          <TabsContent value="pyq" className="space-y-0">
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
          <TabsContent value="mock" className="space-y-0">
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
                <ResponsiveScrollContainer
                  cardCount={[...mockTests.free, ...mockTests.premium].filter(test => {
                    const isCompleted = completedTests.has(`mock-${test.id}`) || completedTests.has(test.id);
                    if (testFilter === 'attempted') return isCompleted;
                    if (testFilter === 'not-attempted') return !isCompleted;
                    return true;
                  }).length}
                  className="min-w-0"
                >
                  {[...mockTests.free, ...mockTests.premium]
                    .filter(test => {
                      const isCompleted = completedTests.has(`mock-${test.id}`) || completedTests.has(test.id);
                      if (testFilter === 'attempted') return isCompleted;
                      if (testFilter === 'not-attempted') return !isCompleted;
                      return true;
                    })
                    .map((test) => {
                    const isCompleted = completedTests.has(`mock-${test.id}`) || completedTests.has(test.id);
                    const testScore = testScores.get(`mock-${test.id}`) || testScores.get(test.id);
                    
                    return (
                      <div key={test.id} className="w-full">
                        <EnhancedTestCard
                          test={test}
                          isCompleted={isCompleted}
                          testScore={testScore}
                          onStartTest={(language) => handleTestStart('mock', test.id, undefined, language)}
                          onViewSolutions={() => handleViewSolutions('mock', test.id)}
                          onRetry={() => handleTestStart('mock', test.id)}
                          testType="mock"
                        />
                      </div>
                    );
                  })}
                </ResponsiveScrollContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab - Hidden for now */}
          {/* <TabsContent value="practice" className="space-y-6">
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
          </TabsContent> */}
        </Tabs>
      </div>
      <Footer />

      </div>
    </PullToRefresh>
  );
};

export default EnhancedExamDashboard;
