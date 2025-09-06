import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Flag,
  RotateCcw
} from "lucide-react";
import { getQuestionsForTest, getTestDuration } from "@/config/examConfig";
import { useExamStats } from "@/hooks/useExamStats";
import { useAuth } from "@/hooks/useAuth";
import { QuestionLoader, TestData, QuestionWithProps } from "@/lib/questionLoader";
import { LanguageSelector } from "@/components/LanguageSelector";
import SolutionsDisplay from "@/components/SolutionsDisplay";

// Questions will be loaded dynamically based on test parameters

const TestInterface = () => {
  const { examId, sectionId, testType, topic } = useParams();
  const navigate = useNavigate();
  const { getUserId } = useAuth();
  const { submitTestAttempt, submitIndividualTestScore } = useExamStats(examId);
  
  const [testData, setTestData] = useState<TestData | null>(null);
  const [questions, setQuestions] = useState<QuestionWithProps[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(true);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);
  const [testResults, setTestResults] = useState<{
    score: number;
    correct: number;
    timeTaken: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load questions and set timer
  useEffect(() => {
    const loadTestData = async () => {
      try {
        console.log('Route parameters:', { examId, sectionId, testType, topic });
        
        // Determine the correct test ID based on the route parameters
        let actualTestId = '';
        
        if (testType === 'mock') {
          // Use the topic parameter for mock test ID (e.g., mock-test-1, mock-test-2)
          actualTestId = topic || 'mock-test-1';
        } else if (testType === 'pyq') {
          actualTestId = topic || '2024-day1-shift1';
        } else if (testType === 'practice') {
          actualTestId = topic || 'maths-algebra';
        }
        
        console.log('Loading test data for:', { examId, testType, actualTestId });
        
        // Load test data from JSON
        const loadedTestData = await QuestionLoader.loadQuestions(examId!, testType as 'pyq' | 'practice' | 'mock', actualTestId);
        
        if (!loadedTestData) {
          console.error('Failed to load test data');
          setLoading(false);
          return;
        }
        
        setTestData(loadedTestData);
        setQuestions(loadedTestData.questions);
        
        console.log('Test data loaded successfully:', {
          examInfo: loadedTestData.examInfo,
          questionsCount: loadedTestData.questions.length,
          firstQuestion: loadedTestData.questions[0]
        });
        
        // Calculate total duration dynamically from questions
        const totalDuration = QuestionLoader.calculateTotalDuration(loadedTestData.questions);
        setTimeLeft(totalDuration * 60); // Convert minutes to seconds
        
        // Check if user has a preferred language
        const preferredLanguage = localStorage.getItem('preferredLanguage');
        if (preferredLanguage && loadedTestData.examInfo.languages.includes(preferredLanguage)) {
          setSelectedLanguage(preferredLanguage);
          setShowLanguageSelector(false);
        } else {
          setSelectedLanguage(loadedTestData.examInfo.defaultLanguage);
          setShowLanguageSelector(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading test data:', error);
        setLoading(false);
      }
    };

    if (examId && sectionId && testType) {
      loadTestData();
    }
  }, [examId, sectionId, testType, topic]);

  // Handle language selection
  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageSelector(false);
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted && !loading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted && !loading) {
      handleSubmit();
    }
  }, [timeLeft, isCompleted, loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);
      
      let correct = 0;
      let incorrect = 0;
      
      questions.forEach((question, index) => {
        if (answers[index] !== undefined) {
          if (answers[index] === question.correct) {
            correct++;
          } else {
            incorrect++;
          }
        }
      });

      // Calculate score using individual question marks and negative marks
      let totalMarks = 0;
      let obtainedMarks = 0;
      
      questions.forEach((question, index) => {
        totalMarks += question.marks;
        if (answers[index] !== undefined) {
          if (answers[index] === question.correct) {
            obtainedMarks += question.marks;
          } else {
            obtainedMarks -= question.negativeMarks;
          }
        }
      });
      
      // Prevent division by zero
      const score = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
      
      console.log('Score calculation details:', {
        totalMarks,
        obtainedMarks,
        score,
        questionsCount: questions.length,
        answersCount: Object.keys(answers).length
      });
      
      // Submit test attempt using the new system
      if (examId) {
        try {
          await submitTestAttempt(
            examId,
            score,
            questions.length,
            correct,
            timeTaken,
            {
              details: questions.map((question, index) => ({
                questionId: question.id,
                selectedOption: answers[index] ?? -1,
                isCorrect: answers[index] === question.correct
              })),
              skipped: questions.length - Object.keys(answers).length
            },
            sectionId!,
            testType!,
            topic
          );

          // Submit individual test score for Mock and PYQ tests only
          if (sectionId === 'mock' || sectionId === 'pyq') {
            // sectionId is the test type (mock/pyq), testType is the actual test ID
            await submitIndividualTestScore(examId, sectionId, testType, score);
          }

          console.log('Test attempt submitted successfully');
        } catch (error) {
          console.error('Error submitting test attempt:', error);
          // Continue to show solutions even if submission fails
        }
      }

      // Store test results and show solutions
      setTestResults({
        score,
        correct,
        timeTaken
      });
      setShowSolutions(true);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const question = questions[currentQuestion];
  const answered = Object.keys(answers).length;
  const unanswered = questions.length - answered;

  // Add safety checks
  if (!questions || questions.length === 0 || !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Loading Questions...</h2>
          <p className="text-muted-foreground">Preparing your test</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Loading Test...</h2>
          <p className="text-muted-foreground">Preparing your questions</p>
        </div>
      </div>
    );
  }

  // Show language selector if needed
  if (showLanguageSelector && testData) {
    return (
      <LanguageSelector
        examName={testData.examInfo.examName}
        testName={testData.examInfo.testName}
        languages={testData.examInfo.languages}
        defaultLanguage={testData.examInfo.defaultLanguage}
        onLanguageSelect={handleLanguageSelect}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-4">This test doesn't have any questions yet.</p>
          <Button onClick={() => navigate(`/exam/${examId}`)} variant="outline">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (showSolutions && testResults) {
    return (
      <SolutionsDisplay
        questions={questions}
        userAnswers={answers}
        score={testResults.score}
        totalQuestions={questions.length}
        correctAnswers={testResults.correct}
        timeTaken={testResults.timeTaken}
        onClose={() => navigate(`/exam/${examId}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/exam/${examId}`)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {testData?.examInfo.testName || topic || testType?.toUpperCase() || "Test"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length} • {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-warning" />
                <span className="font-mono text-lg font-bold text-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button 
                onClick={handleSubmit} 
                className="gradient-primary border-0"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Test'
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="gradient-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Question {currentQuestion + 1}</span>
                    <Badge variant={question.difficulty === 'easy' ? 'secondary' : 'default'}>
                      {question.difficulty}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'hindi' : 'english')}
                    >
                      {selectedLanguage === 'english' ? 'हिंदी' : 'English'}
                    </Button>
                    <Button
                      variant={flagged.has(currentQuestion) ? "default" : "outline"}
                      size="sm"
                      onClick={toggleFlag}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg leading-relaxed text-foreground">
                  {selectedLanguage === 'hindi' ? question.questionHi : question.questionEn}
                </div>
                
                <div className="space-y-3">
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          answers[currentQuestion] === index
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index}
                          checked={answers[currentQuestion] === index}
                          onChange={() => handleAnswerSelect(index)}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-foreground">{option}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No options available for this question</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestion === questions.length - 1}
                    className="gradient-primary border-0"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Navigation Panel */}
          <div className="space-y-4">
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-sm">Question Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionJump(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        index === currentQuestion
                          ? 'bg-primary text-primary-foreground'
                          : answers[index] !== undefined
                          ? 'bg-success text-success-foreground'
                          : flagged.has(index)
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Answered:</span>
                    <span className="font-medium text-success">{answered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Not Answered:</span>
                    <span className="font-medium text-muted-foreground">{unanswered}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Flagged:</span>
                    <span className="font-medium text-warning">{flagged.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>Current</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-success rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-warning rounded"></div>
                    <span>Flagged</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <span>Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;