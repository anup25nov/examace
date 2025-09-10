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
    
    const allMockTests = [...mockTests.free, ...mockTests.premium];
    allMockTests.forEach(test => {
      const completionKey = `mock-${test.id}`;
      if (completedTests.has(completionKey)) {
        completedCount++;
      } else {
        notAttemptedCount++;
      }
    });
    
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
    
    return { completedCount, notAttemptedCount };
  };

  const { completedCount, notAttemptedCount } = getFilterCounts();

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
        <Tabs defaultValue="mock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mock" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Mock Tests</span>
            </TabsTrigger>
            <TabsTrigger value="pyq" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Previous Year</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Practice</span>
            </TabsTrigger>
          </TabsList>

          {/* Mock Tests Tab */}
          <TabsContent value="mock" className="space-y-6">
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-success" />
                  <span>Full Mock Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="free" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="free" className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Free Tests</span>
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <span>Premium Tests</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="free">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockTests.free
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
                  </TabsContent>

                  <TabsContent value="premium">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mockTests.premium
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PYQ Tab */}
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

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <span>Practice Sets (Subject wise)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {practiceData.map((subject) => (
                    <Card key={subject.id} className="border-0 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(subject.topics).map(([topicId, topic]: [string, any]) => (
                            <div key={topicId} className="space-y-3">
                              <h4 className="font-semibold text-foreground">{topic.name}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {topic.sets
                                  .filter((set: PremiumTest) => {
                                    const isCompleted = completedTests.has(`practice-${set.id}-${set.id}`);
                                    if (testFilter === 'attempted') return isCompleted;
                                    if (testFilter === 'not-attempted') return !isCompleted;
                                    return true;
                                  })
                                  .map((set: PremiumTest) => {
                                  const isCompleted = completedTests.has(`practice-${set.id}-${set.id}`);
                                  const testScore = testScores.get(`practice-${set.id}-${set.id}`);
                                  
                                  return (
                                    <EnhancedTestCard
                                      key={set.id}
                                      test={set}
                                      isCompleted={isCompleted}
                                      testScore={testScore}
                                      onStartTest={() => handleTestStart('practice', set.id, set.id)}
                                      onViewSolutions={() => handleViewSolutions('practice', set.id, set.id)}
                                      onRetry={() => handleTestStart('practice', set.id, set.id)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
