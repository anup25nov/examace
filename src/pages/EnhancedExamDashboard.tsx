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
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { analytics } from "@/lib/analytics";
import { ReferralBanner } from "@/components/ReferralBanner";
import { EnhancedTestCard } from "@/components/EnhancedTestCard";
import { YearWiseTabs } from "@/components/YearWiseTabs";
import { testDataLoader, YearData } from "@/lib/testDataLoader";
import { premiumService, PremiumTest } from "@/lib/premiumService";
import { examConfigService } from "@/lib/examConfigService";
import Footer from "@/components/Footer";

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
  
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    bestRank: 0,
    lastActive: null as Date | null
  });
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [testFilter, setTestFilter] = useState<'all' | 'attempted' | 'not-attempted'>('all');
  
  // New state for enhanced features
  const [mockTests, setMockTests] = useState<{ free: PremiumTest[]; premium: PremiumTest[] }>({ free: [], premium: [] });
  const [pyqData, setPyqData] = useState<YearData[]>([]);
  const [practiceData, setPracticeData] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState(premiumService.getUserMembership());

  const exam = examConfigs[examId as string];
  const examConfig = examConfigService.getExamConfig(examId as string);
  const userEmail = profile?.email || localStorage.getItem("userEmail");

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
    if (examId && allStats.length > 0) {
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
          lastActive: currentExamStats.lastTestDate
        });
      }
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
    analytics.trackTestStart(examId!, type, itemId);
    
    const sectionId = type;
    const testPath = topicId 
      ? `/test/${examId}/${sectionId}/${itemId}/${topicId}`
      : `/test/${examId}/${sectionId}/${itemId}`;
    
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

  // Calculate filter counts
  const getFilterCounts = () => {
    let completedCount = 0;
    let notAttemptedCount = 0;
    
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
    
    // Count practice tests (when they become available)
    practiceData.forEach(subject => {
      Object.values(subject.topics).forEach((topic: any) => {
        topic.sets.forEach((set: PremiumTest) => {
          const completionKey = `practice-${set.id}-${set.id}`;
          if (completedTests.has(completionKey)) {
            completedCount++;
          } else {
            notAttemptedCount++;
          }
        });
      });
    });
    
    return { completedCount, notAttemptedCount };
  };

  const { completedCount, notAttemptedCount } = getFilterCounts();

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
                <p className="text-sm font-medium text-foreground">Welcome!</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Referral Banner */}
        <div className="mb-6">
          <ReferralBanner variant="banner" />
        </div>

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
          
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">{userStats.avgScore}%</p>
              <p className="text-sm text-green-100 font-medium">Average Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 text-white">
            <CardContent className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <p className="text-3xl font-bold mb-2">{userStats.bestScore}%</p>
              <p className="text-sm text-purple-100 font-medium">Best Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
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
        <Tabs defaultValue={examConfig?.tabOrder[0] || "pyq"} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-${examConfig?.tabOrder.length || 3} bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-100 p-1 rounded-xl shadow-lg border border-white/50`}>
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
                mock: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500',
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
              onStartTest={(testId) => handleTestStart('pyq', testId)}
              onViewSolutions={(testId) => handleViewSolutions('pyq', testId)}
              onRetry={(testId) => handleTestStart('pyq', testId)}
              testFilter={testFilter}
            />
          </TabsContent>

          {/* Mock Tests Tab - Second */}
          <TabsContent value="mock" className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <span>Full Mock Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        onStartTest={() => handleTestStart('mock', test.id)}
                        onViewSolutions={() => handleViewSolutions('mock', test.id)}
                        onRetry={() => handleTestStart('mock', test.id)}
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
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Practice Sets Coming Soon!</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We're working hard to bring you comprehensive practice sets for all subjects. 
                    Stay tuned for subject-wise practice questions with detailed solutions.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Quantitative Aptitude</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>English Language</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>General Intelligence</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
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
    </div>
  );
};

export default EnhancedExamDashboard;
