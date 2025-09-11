import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Flag
} from "lucide-react";
// Removed unused imports: getQuestionsForTest, getTestDuration
import { useExamStats } from "@/hooks/useExamStats";
import { useAuth } from "@/hooks/useAuth";
import { QuestionLoader, TestData, QuestionWithProps } from "@/lib/questionLoader";
import SolutionsDisplay from "@/components/SolutionsDisplay";

// Fallback function for calculating total duration
const calculateTotalDurationFallback = (questions: QuestionWithProps[]): number => {
  if (!questions || questions.length === 0) {
    return 60; // Default 1 hour
  }
  
  // Sum up all question durations (in seconds) and convert to minutes
  const totalSeconds = questions.reduce((total, question) => {
    return total + (question.duration || 60); // Default 60 seconds per question
  }, 0);
  
  // Convert to minutes and round to nearest integer
  return Math.round(totalSeconds / 60);
};

// Utility function to analyze subject distribution
const analyzeSubjectDistribution = (questions: QuestionWithProps[]) => {
  const subjectMap = new Map<string, { startIndex: number; endIndex: number; count: number }>();
  
  questions.forEach((question, index) => {
    const subject = question.subject;
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { startIndex: index, endIndex: index, count: 0 });
    }
    const subjectInfo = subjectMap.get(subject)!;
    subjectInfo.endIndex = index;
    subjectInfo.count++;
  });
  
  return Array.from(subjectMap.entries()).map(([subject, info]) => ({
    subject,
    startIndex: info.startIndex,
    endIndex: info.endIndex,
    count: info.count,
    range: `${info.startIndex + 1}-${info.endIndex + 1}`
  }));
};

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [testResults, setTestResults] = useState<{
    score: number;
    correct: number;
    timeTaken: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actualTestType, setActualTestType] = useState<string>('');
  const [actualTestId, setActualTestId] = useState<string>('');
  const [subjectDistribution, setSubjectDistribution] = useState<Array<{
    subject: string;
    startIndex: number;
    endIndex: number;
    count: number;
    range: string;
  }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithProps[]>([]);
  const questionGridRef = useRef<HTMLDivElement>(null);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  // Helper function to get original question number
  const getOriginalQuestionNumber = () => {
    if (!filteredQuestions[currentQuestion]) return 1;
    return questions.findIndex(q => q.id === filteredQuestions[currentQuestion].id) + 1;
  };

  // Auto-scroll to current question in the grid
  useEffect(() => {
    if (questionGridRef.current && filteredQuestions.length > 0) {
      const currentButton = questionGridRef.current.querySelector(`[data-question-index="${currentQuestion}"]`);
      if (currentButton) {
        currentButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentQuestion, filteredQuestions]);

  // Function to filter questions by subject
  const filterQuestionsBySubject = (subject: string | null) => {
    if (!subject) {
      setFilteredQuestions(questions);
      setSelectedSubject(null);
    } else {
      const filtered = questions.filter(q => q.subject === subject);
      setFilteredQuestions(filtered);
      setSelectedSubject(subject);
      // Reset to first question of the filtered set
      setCurrentQuestion(0);
    }
  };

  // Load language preference from localStorage or URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const languageFromUrl = urlParams.get('language');
    const languageFromStorage = localStorage.getItem('preferredLanguage');
    
    if (languageFromUrl) {
      setSelectedLanguage(languageFromUrl);
    } else if (languageFromStorage) {
      setSelectedLanguage(languageFromStorage);
    }
  }, []);

  // Load questions and set timer
  useEffect(() => {
    const loadTestData = async () => {
      try {
        
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
        
        
        // Load test data from JSON
        const loadedTestData = await QuestionLoader.loadQuestions(examId!, testTypeValue as 'pyq' | 'practice' | 'mock', testId);
        
        if (!loadedTestData) {
          console.error('Failed to load test data');
          setLoading(false);
          return;
        }
        
        
        setTestData(loadedTestData);
        setQuestions(loadedTestData.questions);
        
        // Analyze subject distribution
        const distribution = analyzeSubjectDistribution(loadedTestData.questions);
        setSubjectDistribution(distribution);
        
        // Initialize with all questions visible
        setFilteredQuestions(loadedTestData.questions);
        
        
        // Calculate total duration dynamically from questions and round to integer
        let totalDuration = 60; // Default fallback
        try {
          if (QuestionLoader.calculateTotalDuration) {
            totalDuration = Math.round(QuestionLoader.calculateTotalDuration(loadedTestData.questions));
          } else {
            // Use local fallback function
            totalDuration = calculateTotalDurationFallback(loadedTestData.questions);
          }
        } catch (error) {
          console.warn('Error calculating duration, using fallback:', error);
          totalDuration = calculateTotalDurationFallback(loadedTestData.questions);
        }
        setTimeLeft(totalDuration * 60); // Convert minutes to seconds
        
        // Set default language
        setSelectedLanguage(loadedTestData.examInfo?.defaultLanguage || 'english');
        
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

  // Handle language selection and start test
  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setTestStarted(true);
  };

  // Timer effect - only start when test is actually started
  useEffect(() => {
    if (timeLeft > 0 && !isCompleted && !loading && testStarted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted && !loading && testStarted) {
      // Auto-submit immediately when time is up without showing popup
      handleSubmit(true); // Skip confirmation for time up
    }
  }, [timeLeft, isCompleted, loading, testStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    // Get the original question index from the filtered questions
    const originalIndex = questions.findIndex(q => q.id === filteredQuestions[currentQuestion].id);
    setAnswers(prev => ({
      ...prev,
      [originalIndex]: optionIndex
    }));
  };

  const handleQuestionJump = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (selectedSubject && subjectDistribution.length > 1) {
      // If we're on the first question of a subject, move to previous subject
      const currentSubjectIndex = subjectDistribution.findIndex(s => s.subject === selectedSubject);
      if (currentSubjectIndex > 0) {
        const prevSubject = subjectDistribution[currentSubjectIndex - 1];
        filterQuestionsBySubject(prevSubject.subject);
        // Set to last question of previous subject
        const prevSubjectQuestions = questions.filter(q => q.subject === prevSubject.subject);
        setCurrentQuestion(prevSubjectQuestions.length - 1);
      } else {
        // If we're on the first subject, go back to "All"
        filterQuestionsBySubject(null);
        setCurrentQuestion(0);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (selectedSubject && subjectDistribution.length > 1) {
      // If we're on the last question of a subject, move to next subject
      const currentSubjectIndex = subjectDistribution.findIndex(s => s.subject === selectedSubject);
      if (currentSubjectIndex < subjectDistribution.length - 1) {
        const nextSubject = subjectDistribution[currentSubjectIndex + 1];
        filterQuestionsBySubject(nextSubject.subject);
      } else {
        // If we're on the last subject, go to first question of first subject
        const firstSubject = subjectDistribution[0];
        filterQuestionsBySubject(firstSubject.subject);
        setCurrentQuestion(0);
      }
    } else if (!selectedSubject) {
      // If we're viewing all questions and on the last question, go to first question
      setCurrentQuestion(0);
    }
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

  const handleSubmit = async (skipConfirmation = false) => {
    if (isSubmitting) return; // Prevent double submission
    
    // Show confirmation dialog first unless explicitly skipped (for time up)
    if (skipConfirmation) {
      await confirmSubmit();
    } else {
      setShowSubmitConfirmation(true);
    }
  };

  const confirmSubmit = async () => {
    setShowSubmitConfirmation(false);
    setIsSubmitting(true);
    
    try {
      const endTime = Date.now();
      const timeTaken = Math.round((endTime - startTime) / 1000);
      
      // Ensure we have a clean integer without floating-point precision issues
      const cleanTimeTaken = Math.round(timeTaken);
      
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
      
      
      // Submit test attempt using the new system
      if (examId) {
        try {
          await submitTestAttempt(
            examId,
            score,
            questions.length,
            correct,
            cleanTimeTaken,
            {
              details: questions.map((question, index) => ({
                questionId: question.id,
                selectedOption: answers[index] ?? -1,
                isCorrect: answers[index] === question.correct
              })),
              skipped: questions.length - Object.keys(answers).length
            },
            actualTestType,  // actualTestType is the test type (mock/pyq/practice)
            actualTestId,    // actualTestId is the actual test ID (mock-test-3, etc.)
            topic            // topic for practice tests
          );

          // Submit individual test score for Mock and PYQ tests only
          if (actualTestType === 'mock' || actualTestType === 'pyq') {
            // actualTestType is the test type (mock/pyq), actualTestId is the actual test ID
            await submitIndividualTestScore(examId, actualTestType, actualTestId, score);
          }

        } catch (error) {
          console.error('Error submitting test attempt:', error);
          // Continue to show solutions even if submission fails
        }
      }

      // Store test results and show solutions
      setTestResults({
        score,
        correct,
        timeTaken: cleanTimeTaken
      });
      setShowSolutions(true);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const question = filteredQuestions[currentQuestion];
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

  // Show start test screen if test is loaded but not started
  if (!testStarted && testData && questions.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Test Ready!</h2>
          <p className="text-muted-foreground mb-6">
            Your test is loaded and ready to start. Click the button below to begin.
          </p>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Duration:</strong> {Math.round(timeLeft / 60)} minutes</p>
              <p><strong>Questions:</strong> {questions.length}</p>
              <p><strong>Language:</strong> {selectedLanguage === 'english' ? 'English' : selectedLanguage === 'hindi' ? 'Hindi' : 'Both'}</p>
            </div>
            <Button 
              onClick={() => setTestStarted(true)}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold"
            >
              Start Test Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || !testData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">No Questions Available</h2>
          <p className="text-muted-foreground mb-4">This test doesn't have any questions yet or failed to load.</p>
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
        // Don't show highest marks in test completion, only in solutions view
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/exam/${examId}`)}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-foreground truncate">
                  {testData?.examInfo?.testName || topic || testType?.toUpperCase() || "Test"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Question {getOriginalQuestionNumber()} of {questions.length}
                  {selectedSubject && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      {selectedSubject.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between lg:space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeLeft < 60 ? 'text-destructive' : timeLeft < 300 ? 'text-destructive' : 'text-warning'}`} />
                <span className={`font-mono text-base sm:text-lg font-bold ${
                  timeLeft < 60 
                    ? 'text-destructive animate-pulse' 
                    : timeLeft < 300 
                    ? 'text-destructive' 
                    : 'text-foreground'
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Button 
                onClick={() => handleSubmit()} 
                className="gradient-primary border-0 text-sm sm:text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Submitting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Submit Test</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Subject Navigation - Only show for Mock and PYQ tests */}
          {subjectDistribution.length > 0 && (actualTestType === 'mock' || actualTestType === 'pyq') && (
            <div className="bg-card/50 backdrop-blur-sm border-t border-border/50">
              <div className="container mx-auto px-4 py-3">
                <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Subjects:</span>
                    <Button
                      variant={selectedSubject === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => filterQuestionsBySubject(null)}
                      className="text-xs"
                    >
                      All ({questions.length})
                    </Button>
                    {subjectDistribution.map((subjectInfo) => {
                      const subjectLabels: { [key: string]: string } = {
                        'maths': 'Maths',
                        'reasoning': 'Reasoning',
                        'general-awareness': 'General Awareness',
                        'english': 'English'
                      };
                      return (
                        <Button
                          key={subjectInfo.subject}
                          variant={selectedSubject === subjectInfo.subject ? "default" : "outline"}
                          size="sm"
                          onClick={() => filterQuestionsBySubject(subjectInfo.subject)}
                          className="text-xs"
                        >
                          <span className="hidden sm:inline">{subjectLabels[subjectInfo.subject] || subjectInfo.subject} ({subjectInfo.count})</span>
                          <span className="sm:hidden">{subjectLabels[subjectInfo.subject]?.substring(0, 3) || subjectInfo.subject?.substring(0, 3) || 'N/A'} ({subjectInfo.count})</span>
                        </Button>
                      );
                    })}
                  </div>
                  {selectedSubject && (
                    <div className="text-xs text-muted-foreground">
                      Showing {subjectDistribution.find(s => s.subject === selectedSubject)?.subject.replace('-', ' ') || selectedSubject} questions only
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="gradient-card border-0">
              <CardHeader>
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <CardTitle className="flex items-center space-x-2">
                    <span>Question {getOriginalQuestionNumber()}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLanguage(selectedLanguage === 'english' ? 'hindi' : 'english')}
                      disabled={question.subject === 'english'}
                      title={question.subject === 'english' ? 'Language conversion not available for English subject' : ''}
                      className="text-xs"
                    >
                      <span className="hidden sm:inline">{selectedLanguage === 'english' ? 'हिंदी' : 'English'}</span>
                      <span className="sm:hidden">{selectedLanguage === 'english' ? 'हि' : 'EN'}</span>
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
                
                {/* Question Image - Commented out as questionImage property doesn't exist */}
                {/* {question.questionImage && (
                  <div className="my-4 flex justify-center">
                    <img 
                      src={question.questionImage} 
                      alt="Question" 
                      className="max-w-full h-auto rounded-lg shadow-md border"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                )} */}
                
                <div className="space-y-3">
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          answers[questions.findIndex(q => q.id === filteredQuestions[currentQuestion].id)] === index
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={index}
                          checked={answers[questions.findIndex(q => q.id === filteredQuestions[currentQuestion].id)] === index}
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
                    disabled={currentQuestion === 0 && !selectedSubject}
                    className="text-sm sm:text-base"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{currentQuestion === 0 && selectedSubject ? 'Prev Subject' : 'Previous'}</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestion === filteredQuestions.length - 1 && !selectedSubject}
                    className="gradient-primary border-0 text-sm sm:text-base"
                  >
                    {currentQuestion === filteredQuestions.length - 1 && selectedSubject ? (
                      <>
                        <span className="hidden sm:inline">Next Subject</span>
                        <span className="sm:hidden">Next Sub</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
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
                <div ref={questionGridRef} className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-7 gap-1 p-1">
                    {filteredQuestions.map((_, index) => {
                      const originalIndex = questions.findIndex(q => q.id === filteredQuestions[index].id);
                      return (
                        <button
                          key={originalIndex}
                          data-question-index={index}
                          onClick={() => handleQuestionJump(index)}
                          className={`w-8 h-8 text-xs rounded-lg font-medium transition-all ${
                            index === currentQuestion
                              ? 'bg-primary text-primary-foreground'
                              : answers[originalIndex] !== undefined
                              ? 'bg-success text-success-foreground'
                              : flagged.has(originalIndex)
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {originalIndex + 1}
                        </button>
                      );
                    })}
                  </div>
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


      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              Confirm Test Submission
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-warning" />
            </div>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirmation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubmit}
                className="flex-1 bg-primary hover:bg-primary/90"
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestInterface;