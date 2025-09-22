import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Filter,
  Search,
  TrendingUp,
  Users,
  Award,
  Clock,
  Target,
  Star,
  BookOpen,
  Brain,
  Crown,
  Zap,
  ChevronDown,
  ChevronRight,
  Trophy
} from "lucide-react";
import { examConfigs } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useComprehensiveStats } from "@/hooks/useComprehensiveStats";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { QuestionLoader } from "@/lib/questionLoader";
import { analytics } from "@/lib/analytics";
import { testAvailabilityService } from "@/lib/testAvailability";
import { ProfessionalExamCard } from "@/components/ProfessionalExamCard";
import { ProfessionalSectionHeader } from "@/components/ProfessionalSectionHeader";
import { ReferralBanner } from "@/components/ReferralBanner";
import { PYQYearSelector } from "@/components/PYQYearSelector";
import { MockTestSelector } from "@/components/MockTestSelector";
import Footer from "@/components/Footer";

const ProfessionalExamDashboard = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { profile } = useDashboardData();
  const { allStats, loadAllStats, getExamStatById, isTestCompleted, getIndividualTestScore } = useExamStats();
  const { stats: comprehensiveStats, loading: statsLoading, error: statsError, refreshStats } = useComprehensiveStats(examId);
  
  // Remove focus event listener to prevent unnecessary API calls
  // Stats will be refreshed only when needed (e.g., after test completion)
  
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    avgScore: 0,
    bestScore: 0,
    bestRank: 0,
    lastActive: null as Date | null
  });
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pyq: true,
    mock: true,
    practice: false
  });
  
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [testScores, setTestScores] = useState<Map<string, { score: number; rank: number; totalParticipants: number }>>(new Map());
  const [testFilter, setTestFilter] = useState<'all' | 'attempted' | 'not-attempted'>('all');
  const [selectedPYQYear, setSelectedPYQYear] = useState<string>('');
  
  const [availableTests, setAvailableTests] = useState<{
    mock: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string; isPremium?: boolean }>;
    pyq: Array<{ year: string; papers: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string; isPremium?: boolean }> }>;
    practice: Array<{ id: string; name: string; duration: number; questions: any[]; breakdown?: string; isPremium?: boolean }>;
  }>({ mock: [], pyq: [], practice: [] });

  const exam = examConfigs[examId as string];
  const userEmail = profile?.email || localStorage.getItem("userEmail");

  // Load available tests dynamically
  useEffect(() => {
    const loadTests = async () => {
      if (!examId) return;
      
      try {
        const tests = await testAvailabilityService.getAvailableTests(examId);
        setAvailableTests(tests);
      } catch (error) {
        console.error('Error loading tests:', error);
        // Set default tests if loading fails
        setAvailableTests({
          mock: [
            { id: 'mock-test-1', name: 'SSC CGL Mock Test 1', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: false },
            { id: 'mock-test-2', name: 'SSC CGL Mock Test 2', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: false },
            { id: 'mock-test-3', name: 'SSC CGL Premium Mock Test 1', duration: 180, questions: [], breakdown: 'Advanced General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: true }
          ],
          pyq: [
            {
              year: '2024',
              papers: [
                { id: '2024-set-1', name: 'SSC CGL 2024 Set 1', duration: 180, questions: [], breakdown: 'General Intelligence, English, Quantitative Aptitude, General Awareness', isPremium: false }
              ]
            }
          ],
          practice: [
            { id: 'maths-algebra', name: 'Mathematics - Algebra', duration: 60, questions: [], breakdown: 'Algebra fundamentals and practice', isPremium: true }
          ]
        });
      }
    };

    loadTests();
  }, [examId]);

  // Load user stats and completions
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user || !examId) return;

      try {
        await loadAllStats();
        
        // Load test completions
        const { data: completions } = await testAvailabilityService.getTestCompletions(examId);
        if (completions) {
          const completedSet = new Set<string>();
          const scoresMap = new Map<string, { score: number; rank: number; totalParticipants: number }>();
          
          completions.forEach(completion => {
            const key = completion.topic_name 
              ? `${completion.test_type}-${completion.test_id}-${completion.topic_name}`
              : `${completion.test_type}-${completion.test_id}`;
            
            completedSet.add(key);
            
            if (completion.score !== null) {
              scoresMap.set(key, {
                score: completion.score,
                rank: completion.rank || 0,
                totalParticipants: completion.total_participants || 0
              });
            }
          });
          
          setCompletedTests(completedSet);
          setTestScores(scoresMap);
        }

        // Load exam-specific stats - use comprehensive stats if available
        if (comprehensiveStats) {
          // Calculate best rank from individual test scores
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
            lastActive: comprehensiveStats.lastTestDate ? new Date(comprehensiveStats.lastTestDate) : null
          });
        } else {
          // Fallback to legacy stats
          const examStats = getExamStatById(examId);
          if (examStats) {
            // Calculate best rank from individual test scores
            let bestRank = 0;
            testScores.forEach((scoreData) => {
              if (scoreData.rank > 0 && (bestRank === 0 || scoreData.rank < bestRank)) {
                bestRank = scoreData.rank;
              }
            });

            setUserStats({
              totalTests: examStats.totalTests || 0,
              avgScore: examStats.averageScore || 0,
              bestScore: examStats.bestScore || 0,
              bestRank: bestRank,
              lastActive: (examStats as any).lastActive ? new Date((examStats as any).lastActive) : null
            });
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [isAuthenticated, user, examId, comprehensiveStats]);

  // Track page view
  useEffect(() => {
    if (examId) {
      analytics.trackPageView('exam-dashboard', `Exam Dashboard - ${examId}`);
    }
  }, [examId]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    
    analytics.trackSectionOpen(sectionId, examId!);
  };

  // Create professional test card
  const createProfessionalTestCard = (
    testId: string,
    testName: string,
    testType: 'mock' | 'pyq' | 'practice',
    topicId?: string,
    isPaid: boolean = false,
    requiredPlan: string = 'basic'
  ) => {
    const completionKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const isCompleted = completedTests.has(completionKey);
    
    // Apply filter
    if (testFilter === 'attempted' && !isCompleted) return null;
    if (testFilter === 'not-attempted' && isCompleted) return null;
    
    
    // Get score and rank for Mock and PYQ tests  
    const scoreKey = topicId ? `${testType}-${testId}-${topicId}` : `${testType}-${testId}`;
    const testScore = testScores.get(scoreKey);

    // Determine difficulty and popularity based on test type

    return (
      <ProfessionalExamCard
        key={testId}
        testId={testId}
        testName={testName}
        testType={testType}
        topicId={topicId}
        isCompleted={isCompleted}
        testScore={testScore?.score}
        testRank={testScore?.rank}
        totalParticipants={testScore?.totalParticipants}
        isPaid={isPaid}
        requiredPlan={requiredPlan}
        onStartTest={() => navigate(`/test/${examId}/${testType}/${testId}${topicId ? `/${topicId}` : ''}`)}
        onRetryTest={() => navigate(`/test/${examId}/${testType}/${testId}${topicId ? `/${topicId}` : ''}`)}
        onViewSolutions={() => navigate(`/solutions/${examId}/${testType}/${testId}${topicId ? `/${topicId}` : ''}`)}
        onUpgradeClick={() => navigate('/membership')}
        testInfo={{
          questions: 100,
          marks: 200,
          duration: 180
        }}
      />
    );
  };

  // Get section stats
  const getSectionStats = (sectionId: string) => {
    let totalTests = 0;
    let completedCount = 0;
    
    if (sectionId === 'mock') {
      totalTests = availableTests.mock.length;
      completedCount = availableTests.mock.filter(test => 
        completedTests.has(`mock-${test.id}`)
      ).length;
    } else if (sectionId === 'pyq') {
      totalTests = availableTests.pyq.reduce((sum, year) => sum + year.papers.length, 0);
      completedCount = availableTests.pyq.reduce((sum, year) => 
        sum + year.papers.filter(paper => 
          completedTests.has(`pyq-${paper.id}`)
        ).length, 0
      );
    } else if (sectionId === 'practice') {
      totalTests = availableTests.practice.length;
      completedCount = availableTests.practice.filter(test => 
        completedTests.has(`practice-${test.id}`)
      ).length;
    }
    
    return { totalTests, completedCount };
  };

  // Handler functions for new components
  const handleTestStart = (type: 'practice' | 'pyq' | 'mock', itemId: string, topicId?: string) => {
    // Track test start
    analytics.trackTestStart(examId!, type, itemId);
    
    // Navigate to test interface
    const testPath = topicId 
      ? `/test/${examId}/${type}/${itemId}/${topicId}`
      : `/test/${examId}/${type}/${itemId}`;
    
    navigate(testPath);
  };

  const handleMockTestSelect = (testId: string) => {
    handleTestStart('mock', testId);
  };

  const handleMockTestRetry = (testId: string) => {
    handleTestStart('mock', testId);
  };

  const handleMockTestViewSolutions = (testId: string) => {
    navigate(`/solutions/${examId}/mock/${testId}`);
  };

  const handlePYQYearSelect = (year: string) => {
    setSelectedPYQYear(year);
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam dashboard...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{exam.name}</h1>
                <p className="text-gray-600">Master your preparation with comprehensive tests</p>
              </div>
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Users className="w-3 h-3 mr-1" />
                  {userStats.totalTests} Tests Taken
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Award className="w-3 h-3 mr-1" />
                  Best: {userStats.bestScore}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Referral Banner */}
        <div className="mb-8">
          <ReferralBanner variant="banner" />
        </div>

        {/* Performance Overview */}
        {isAuthenticated && userStats.totalTests > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Performance</h2>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Progress Tracking
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.totalTests}</div>
                  <div className="text-sm text-gray-600">Tests Completed</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.avgScore}</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{userStats.bestScore}</div>
                  <div className="text-sm text-gray-600">Best Score</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">#{userStats.bestRank}</div>
                  <div className="text-sm text-gray-600">Best Rank</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Options */}
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <Button
                variant={testFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTestFilter('all')}
                className={testFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                All Tests
              </Button>
              <Button
                variant={testFilter === 'attempted' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTestFilter('attempted')}
                className={testFilter === 'attempted' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                Attempted
              </Button>
              <Button
                variant={testFilter === 'not-attempted' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTestFilter('not-attempted')}
                className={testFilter === 'not-attempted' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                Not Attempted
              </Button>
            </div>
          </div>
        </div>

        {/* Test Sections */}
        <div className="space-y-8">
          {/* Mock Tests Section */}
          {availableTests.mock.length > 0 && (
            <MockTestSelector
              mockTests={availableTests.mock}
              onTestSelect={handleMockTestSelect}
              onRetryTest={handleMockTestRetry}
              onViewSolutions={handleMockTestViewSolutions}
              completedTests={completedTests}
              testScores={testScores}
            />
          )}

          {/* PYQ Section */}
          {availableTests.pyq.length > 0 && (
            <div className="space-y-4">
              <PYQYearSelector
                years={availableTests.pyq}
                onYearSelect={handlePYQYearSelect}
                selectedYear={selectedPYQYear}
                completedTests={completedTests}
                testType="pyq"
              />
              
              {/* PYQ Papers for Selected Year */}
              {selectedPYQYear && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableTests.pyq
                    .find(year => year.year === selectedPYQYear)
                    ?.papers.map((paper) =>
                      createProfessionalTestCard(paper.id, paper.name, 'pyq', undefined, paper.isPremium || false, 'basic')
                    )}
                </div>
              )}
            </div>
          )}

          {/* Practice Section */}
          {availableTests.practice.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Practice Tests</h3>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTests.practice.map((test) =>
                  createProfessionalTestCard(test.id, test.name, 'practice', undefined, true, 'premium')
                )}
              </div>
            </div>
          )}
        </div>

        {/* Referral Banner at Bottom */}
        <div className="mt-12">
          <ReferralBanner variant="card" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfessionalExamDashboard;
