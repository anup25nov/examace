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
  CheckCircle
} from "lucide-react";
import { examConfigs } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QuestionLoader } from "@/lib/questionLoader";

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
    lastActive: null as Date | null
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [availableTests, setAvailableTests] = useState<{
    mock: Array<{ id: string; name: string; description: string }>;
    pyq: Array<{ id: string; name: string; description: string }>;
    practice: Array<{ id: string; name: string; description: string }>;
  }>({ mock: [], pyq: [], practice: [] });

  const exam = examConfigs[examId as string];
  const userEmail = profile?.email || localStorage.getItem("userEmail");

  // Load available tests
  useEffect(() => {
    const loadAvailableTests = async () => {
      if (examId) {
        const tests = await QuestionLoader.getAvailableTests(examId);
        setAvailableTests(tests);
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
    for (const test of availableTests.pyq) {
      const isCompleted = await isTestCompleted(examId, 'pyq', test.id, null);
      if (isCompleted) {
        // For PYQ tests, topicId is null, so the key becomes pyq-testId
        completed.add(`pyq-${test.id}`);
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
    for (const test of availableTests.pyq) {
      const scoreResult = await getIndividualTestScore(examId, 'pyq', test.id);
      // Handle both Supabase result format and fallback format
      const scoreData = (scoreResult as any).data || scoreResult;
      if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
        // For PYQ tests, topicId is null, so the key becomes pyq-testId
        scores.set(`pyq-${test.id}`, {
          score: scoreData.score,
          rank: scoreData.rank || 0,
          totalParticipants: scoreData.totalParticipants || 0
        });
      }
    }

    setTestScores(scores);
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
  }, [examId, availableTests]);

  // Separate useEffect for updating userStats when allStats change
  useEffect(() => {
    
    if (examId && allStats.length > 0) {
      const currentExamStats = allStats.find(stat => stat.examId === examId);
      if (currentExamStats) {
        
        setUserStats({
          totalTests: currentExamStats.totalTests,
          avgScore: currentExamStats.averageScore,
          bestScore: currentExamStats.bestScore,
          lastActive: currentExamStats.lastTestDate
        });
      } else {
        setUserStats({
          totalTests: 0,
          avgScore: 0,
          bestScore: 0,
          lastActive: null
        });
      }
    } else if (examId && allStats.length === 0) {
      setUserStats({
        totalTests: 0,
        avgScore: 0,
        bestScore: 0,
        lastActive: null
      });
    }
  }, [examId, allStats]);

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
    
    
    // The route expects: /test/:examId/:sectionId/:testType/:topic?
    // Use the actual test type as sectionId
    const sectionId = type; // Use the actual test type (mock/pyq/practice) as sectionId
    const testPath = topicId 
      ? `/test/${examId}/${sectionId}/${type}/${topicId}`
      : `/test/${examId}/${sectionId}/${type}/${itemId}`;
    navigate(testPath);
  };

  const handleViewSolutions = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    // Navigate to solutions view for the completed test
    const sectionId = type; // Use the actual test type (mock/pyq/practice) as sectionId
    const solutionsPath = topicId 
      ? `/solutions/${examId}/${sectionId}/${type}/${topicId}`
      : `/solutions/${examId}/${sectionId}/${type}/${itemId}`;
    navigate(solutionsPath);
  };


  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Helper function to create test button with completion indicator
  const createTestButton = (
    testId: string,
    testName: string,
    testType: 'mock' | 'pyq' | 'practice',
    topicId?: string,
    additionalInfo?: string
  ) => {
    const completionKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const isCompleted = completedTests.has(completionKey);
    
    // Get score and rank for Mock and PYQ tests
    const scoreKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const testScore = testScores.get(scoreKey);

    return (
      <Card key={testId} className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
        isCompleted ? 'border-green-200 bg-green-50/50' : 'border-border'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm">{testName}</h3>
                {isCompleted && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  </div>
                )}
              </div>
              {additionalInfo && (
                <p className="text-xs text-muted-foreground mb-2">{additionalInfo}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          
          {/* Show score and rank for Mock and PYQ tests */}
          {testScore && (testType === 'mock' || testType === 'pyq') && (
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{testScore.score}%</div>
                  <div className="text-xs text-blue-500 font-medium">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">#{testScore.rank}</div>
                  <div className="text-xs text-purple-500 font-medium">Rank</div>
                </div>
              </div>
              {testScore.totalParticipants > 0 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    out of {testScore.totalParticipants} participants
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-2">
            {isCompleted ? (
              <>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => handleViewSolutions(testType, testId, topicId)}
                  >
                    📖 View Solutions
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-8 text-xs"
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
                className="w-full h-8 text-xs"
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
              <div>
                <h1 className="text-2xl font-bold text-foreground">{exam.name}</h1>
                <p className="text-sm text-muted-foreground">{exam.fullName}</p>
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
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Performance Statistics</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Based on Mock Tests and Previous Year Questions (PYQ) only
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{userStats.totalTests}</p>
              <p className="text-sm text-muted-foreground">Tests Taken</p>
              <p className="text-xs text-muted-foreground">(Mock + PYQ)</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{userStats.avgScore}%</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-xs text-muted-foreground">(Mock + PYQ)</p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-foreground">{userStats.bestScore}%</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
              <p className="text-xs text-muted-foreground">(Mock + PYQ)</p>
            </CardContent>
          </Card>


        </div>

        {/* Quick Mock Test */}
        <Card className="exam-card-hover cursor-pointer gradient-primary text-white border-0 mb-8">
          <CardContent className="p-6 text-center">
            <Play className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Quick Full Mock Test</h3>
            <p className="text-white/90 mb-4">Take a complete practice test with 100 questions in 180 minutes</p>
            <Button 
              variant="secondary" 
              className="w-full max-w-xs"
              onClick={() => {
                // Find the first available mock test
                if (availableTests.mock.length > 0) {
                  const firstTest = availableTests.mock[0];
                  handleTestStart('mock', firstTest.id, firstTest.id);
                }
              }}
            >
              Start Mock Test
            </Button>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          {exam.sections.map((section) => (
            <Card key={section.id} className="gradient-card border-0">
              <Collapsible 
                open={openSections[section.id]} 
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {iconMap[section.icon] && React.createElement(iconMap[section.icon], {
                          className: `w-6 h-6 ${section.color}`
                        })}
                        <span>{section.name}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                        openSections[section.id] ? 'rotate-180' : ''
                      }`} />
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent>
                    {/* Mock Tests */}
                    {section.id === 'mock' && availableTests.mock.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableTests.mock.map((test) => 
                          createTestButton(
                            test.id,
                            test.name, // Use the name from JSON
                            'mock',
                            null, // Mock tests don't have topicId
                            test.description // Use the description from JSON
                          )
                        )}
                      </div>
                    )}

                    {/* Previous Year Questions */}
                    {section.id === 'pyq' && availableTests.pyq.length > 0 && (
                      <div className="space-y-6">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-warning" />
                                <span className="text-lg font-semibold">Previous Year Papers ({availableTests.pyq.length} sets)</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                              {availableTests.pyq.map((test) => 
                                createTestButton(
                                  test.id,
                                  test.name, // Use the name from JSON
                                  'pyq',
                                  null, // PYQ tests don't have topicId
                                  test.description // Use the description from JSON
                                )
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
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
                              test.id,
                              test.description // Use the description from JSON
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;