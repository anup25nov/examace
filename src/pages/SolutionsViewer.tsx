import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { secureDynamicQuestionLoader, TestData, QuestionWithProps } from '@/lib/secureDynamicQuestionLoader';
import { useExamStats } from '@/hooks/useExamStats';
import { useAuth } from '@/hooks/useAuth';
import { supabaseStatsService } from '@/lib/supabaseStats';
import SolutionsDisplay from '@/components/SolutionsDisplay';
import { ReferralBanner } from '@/components/ReferralBanner';
import ImageDisplay from '@/components/ImageDisplay';

const SolutionsViewer = () => {
  const { examId, sectionId, testType, topic } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadTestAttempts } = useExamStats(examId);
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<QuestionWithProps[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actualTestType, setActualTestType] = useState<string>('');
  const [actualTestId, setActualTestId] = useState<string>('');
  const [rank, setRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<number | null>(null);
  const [highestMarks, setHighestMarks] = useState<number | null>(null);

  useEffect(() => {
    loadTestData();
  }, [examId, sectionId, testType, topic]);

  // Separate useEffect to fetch rank info when user is ready
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { 
      userId: user?.id, 
      actualTestType, 
      actualTestId, 
      examId 
    });
    
    if (user?.id && actualTestType && actualTestId) {
      console.log('🔄 User authenticated, fetching rank info...');
      fetchRankInfo(examId!, actualTestType, actualTestId);
    } else {
      console.log('⚠️ Missing required data for rank fetch:', {
        hasUser: !!user?.id,
        hasTestType: !!actualTestType,
        hasTestId: !!actualTestId,
        hasExamId: !!examId
      });
    }
  }, [user?.id, actualTestType, actualTestId, examId]);

  const fetchRankInfo = async (examId: string, testType: string, testId: string) => {
    try {
      // Only fetch rank info if user is authenticated
      if (!user?.id) {
        console.warn('fetchRankInfo: User not authenticated, skipping rank fetch');
        return;
      }

      // Get real-time rank and highest score data
      const { data: rankData, error: rankError } = await supabaseStatsService.getTestRankAndHighestScore(examId, testType, testId, user.id);
      
      if (rankError) {
        console.error('Error fetching rank info:', rankError);
        // Fallback to individual test score
        const { data: fallbackData } = await supabaseStatsService.getIndividualTestScore(examId, testType, testId);
        if (fallbackData) {
          setRank(fallbackData.rank || 0);
          setTotalParticipants(fallbackData.total_participants || 0);
          // For fallback, we don't have the highest score, so set it to null
          setHighestMarks(null);
        }
        return;
      }

      if (rankData) {
        console.log('✅ Real-time rank data received:', rankData);
        setRank(rankData.user_rank || null);
        setTotalParticipants(rankData.total_participants || 0);
        // highest_score from the API is the actual highest score achieved by anyone
        // Show 0 if highest_score is 0, only show null if it's actually null/undefined
        const highestScore = rankData.highest_score !== null && rankData.highest_score !== undefined ? rankData.highest_score : null;
        setHighestMarks(highestScore);
        console.log('✅ Set rank values:', { 
          rank: rankData.user_rank || null, 
          totalParticipants: rankData.total_participants || 0, 
          highestMarks: highestScore 
        });
      } else {
        console.log('⚠️ No real-time rank data, trying fallback...');
        // Fallback to individual test score if no real-time data
        const { data: fallbackData } = await supabaseStatsService.getIndividualTestScore(examId, testType, testId);
        if (fallbackData) {
          console.log('✅ Fallback data received:', fallbackData);
          setRank(fallbackData.rank || null);
          setTotalParticipants(fallbackData.total_participants || 0);
          // For fallback, we don't have the highest score, so set it to null
          setHighestMarks(null);
          console.log('✅ Set fallback values:', { 
            rank: fallbackData.rank || null, 
            totalParticipants: fallbackData.total_participants || 0, 
            highestMarks: null 
          });
        } else {
          console.log('❌ No fallback data available, trying to get highest score only...');
          // Last resort: try to get just the highest score
          const { data: highestScoreData } = await (supabaseStatsService as any).getTestHighestScore(examId, testType, testId);
          if (highestScoreData) {
            setHighestMarks(highestScoreData.highest_score);
            console.log('✅ Got highest score only:', highestScoreData.highest_score);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching rank info:', error);
      // Set default values if rank info is not available
      setRank(null);
      setTotalParticipants(null);
      setHighestMarks(null);
    }
  };

  const handleUpdateRank = async () => {
    if (actualTestType && actualTestId) {
      await fetchRankInfo(examId!, actualTestType, actualTestId);
    }
  };

  const loadTestData = async () => {
    if (!examId || !testType) return;

    try {
      setLoading(true);
      setError('');

      // Determine the correct test ID based on the route parameters
      let testId = '';
      let testTypeValue = '';
      
      // The sectionId tells us the test type, testType is the actual test ID
      if (sectionId === 'mock') {
        testTypeValue = 'mock';
        testId = testType || 'mock-test-1';
      } else if (sectionId === 'pyq') {
        testTypeValue = 'pyq';
        testId = testType || '2024-day1-shift1';
      } else if (sectionId === 'practice') {
        testTypeValue = 'practice';
        testId = testType || 'maths-algebra';
      } else {
        // Fallback to old logic for backward compatibility
        testTypeValue = testType || 'mock';
        if (testType === 'mock') {
          testId = topic || 'mock-test-1';
        } else if (testType === 'pyq') {
          testId = topic || '2024-set-1';
        } else if (testType === 'practice') {
          testId = topic || 'maths-algebra';
        }
      }
      
      // Set the state variables
      setActualTestType(testTypeValue);
      setActualTestId(testId);

        // Load test data securely
        const data = await secureDynamicQuestionLoader.loadQuestions(
          examId, 
          testTypeValue as 'pyq' | 'practice' | 'mock', 
          testId,
          undefined,
          user?.id,
          testTypeValue === 'pyq' && testId === '2024-paper-5' // Premium test check
        );
      if (!data) {
        setError('Test data not found');
        return;
      }

      setTestData(data);
      setQuestions(data.questions);

      console.log('📚 Test questions:', data.questions.map((q, index) => ({ index, id: q.id })));

      // Load user's test attempt for this test
      const { data: attempts } = await supabaseStatsService.getTestAttempts(examId);
      const testAttempt = attempts?.find(attempt => 
        attempt.test_type === testTypeValue && 
        attempt.test_id === testId
      );

      console.log('🔍 Looking for test attempt:', { testTypeValue, testId });
      console.log('📊 Available attempts:', attempts);
      console.log('✅ Found test attempt:', testAttempt);

      if (testAttempt) {
        // Reconstruct user answers from the attempt
        const answers: { [key: number]: number } = {};
        if (testAttempt.answers && testAttempt.answers.details && Array.isArray(testAttempt.answers.details)) {
          console.log('🔍 Processing answer details:', testAttempt.answers.details);
          testAttempt.answers.details.forEach((answer: any) => {
            // Find the question index by matching questionId
            const questionIndex = data.questions.findIndex(q => q.id === answer.questionId);
            console.log(`🔍 Answer for questionId ${answer.questionId}:`, { 
              questionIndex, 
              selectedOption: answer.selectedOption,
              isCorrect: answer.isCorrect 
            });
            if (questionIndex !== -1 && answer.selectedOption !== undefined && answer.selectedOption !== -1) {
              answers[questionIndex] = answer.selectedOption;
            }
          });
        }
        setUserAnswers(answers);

        console.log('📝 Reconstructed answers:', answers);

        // Calculate test results
        const correct = Object.keys(answers).reduce((count, index) => {
          const questionIndex = parseInt(index);
          const question = data.questions[questionIndex];
          const userAnswer = answers[questionIndex];
          return count + (userAnswer === question.correct ? 1 : 0);
        }, 0);

        const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
        const obtainedMarks = data.questions.reduce((sum, q, index) => {
          const userAnswer = answers[index];
          if (userAnswer === undefined) return sum; // Skipped
          if (userAnswer === q.correct) return sum + q.marks; // Correct
          return sum - q.negativeMarks; // Incorrect
        }, 0);

        // Use the score from the API (which is already calculated correctly)
        const apiScore = testAttempt.score || 0;
        const calculatedScore = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
        
        // Use API score if available, otherwise use calculated score
        const finalScore = apiScore > 0 ? apiScore : calculatedScore;

        console.log('📊 Calculated results:', { 
          correct, 
          total: data.questions.length, 
          apiScore,
          calculatedScore,
          finalScore,
          obtainedMarks, 
          totalMarks,
          timeTaken: testAttempt.time_taken 
        });

        setTestResults({
          score: finalScore,
          correct,
          total: data.questions.length,
          timeTaken: testAttempt.time_taken || 0,
          obtainedMarks,
          totalMarks
        });

        // Rank information will be fetched by useEffect when user is ready
      } else {
        console.log('❌ No test attempt found for this test');
        setError('No completion found for this test');
        
        // Rank information will be fetched by useEffect when user is ready
      }
    } catch (err) {
      console.error('Error loading test data:', err);
      setError('Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading solutions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate(`/exam/${examId}`)} variant="outline">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!testData || !testResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Data Found</h1>
          <p className="text-muted-foreground mb-4">Unable to load test data or results</p>
          <Button onClick={() => navigate(`/exam/${examId}`)} variant="outline">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <SolutionsDisplay
        questions={questions}
        userAnswers={userAnswers}
        score={testResults.score}
        totalQuestions={testResults.total}
        correctAnswers={testResults.correct}
        timeTaken={testResults.timeTaken}
        onClose={() => navigate(`/exam/${examId}`)}
        rank={rank}
        totalParticipants={totalParticipants}
        highestMarks={highestMarks}
        onUpdateRank={handleUpdateRank}
        examId={examId}
        testType={actualTestType}
        testId={actualTestId}
      />
    </div>
  );
};

export default SolutionsViewer;
