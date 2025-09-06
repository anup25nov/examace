import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Target, RotateCcw } from 'lucide-react';
import { QuestionLoader, TestData, QuestionWithProps } from '@/lib/questionLoader';
import { useExamStats } from '@/hooks/useExamStats';
import { supabaseStatsService } from '@/lib/supabaseStats';
import SolutionsDisplay from '@/components/SolutionsDisplay';

const SolutionsViewer = () => {
  const { examId, sectionId, testType, topic } = useParams();
  const navigate = useNavigate();
  const { attempts, loadTestAttempts } = useExamStats(examId);
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<QuestionWithProps[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTestData();
  }, [examId, sectionId, testType, topic]);

  const loadTestData = async () => {
    if (!examId || !testType) return;

    try {
      setLoading(true);
      setError('');

      // Load test data
      const data = await QuestionLoader.loadQuestions(examId, testType as 'pyq' | 'practice' | 'mock', topic || testType);
      if (!data) {
        setError('Test data not found');
        return;
      }

      setTestData(data);
      setQuestions(data.questions);

      // Load user's completion for this test
      const { data: completions } = await supabaseStatsService.getTestCompletions(examId);
      const testCompletion = completions?.find(completion => 
        completion.test_type === testType && 
        completion.test_id === (topic || testType)
      );

      if (testCompletion) {
        // Reconstruct user answers from the completion
        const answers: { [key: number]: number } = {};
        if (testCompletion.answers && Array.isArray(testCompletion.answers)) {
          testCompletion.answers.forEach((answer: any, index: number) => {
            if (answer.selectedOption !== undefined && answer.selectedOption !== -1) {
              answers[index] = answer.selectedOption;
            }
          });
        }
        setUserAnswers(answers);

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

        const score = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

        setTestResults({
          score,
          correct,
          total: data.questions.length,
          timeTaken: testCompletion.time_taken || 0,
          obtainedMarks,
          totalMarks
        });
      } else {
        setError('No completion found for this test');
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
    <SolutionsDisplay
      questions={questions}
      userAnswers={userAnswers}
      score={testResults.score}
      totalQuestions={testResults.total}
      correctAnswers={testResults.correct}
      timeTaken={testResults.timeTaken}
      onClose={() => navigate(`/exam/${examId}`)}
    />
  );
};

export default SolutionsViewer;
