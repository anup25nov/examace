import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Clock,
  Target,
  Trophy,
  RefreshCw,
  Home,
  Youtube,
  Shield,
  AlertTriangle,
  Gift,
  Copy,
  Check,
  Share
} from 'lucide-react';
import ImageDisplay from '@/components/ImageDisplay';
import { QuestionReportModal } from './QuestionReportModal';
import { getYouTubeSolutionsForTest } from '@/config/youtubeConfig';
import { useAuth } from '@/hooks/useAuth';
import { referralService } from '@/lib/referralServiceSimple';
import { 
  isRightClickBlocked, 
  isDevToolsBlocked, 
  isTextSelectionBlocked, 
  isKeyboardShortcutsBlocked 
} from '@/config/appConfig';

interface Question {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[] | Array<{text: string; image?: string}> | Array<{en: string; hi?: string}>;
  correct: number;
  difficulty: string;
  subject?: string;
  topic: string;
  marks: number;
  negativeMarks: number;
  duration: number;
  explanation?: string;
  explanationEn?: string;
  explanationHi?: string;
  questionImage?: string;
  explanationImage?: string;
  hasImages?: boolean;
  questionImageData?: {en: string; hi?: string};
  optionImagesData?: Array<{en: string; hi?: string}>;
  explanationImageData?: {en: string; hi?: string};
}

interface SolutionsDisplayProps {
  questions: Question[];
  userAnswers: { [key: number]: number };
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  onClose: () => void;
  rank?: number;
  totalParticipants?: number;
  highestMarks?: number;
  onUpdateRank?: () => void;
  onBackToDashboard?: () => void;
  examId?: string;
  testType?: string;
  testId?: string;
}

const SolutionsDisplay: React.FC<SolutionsDisplayProps> = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
  onClose,
  rank,
  totalParticipants,
  highestMarks,
  onUpdateRank,
  onBackToDashboard,
  examId = 'ssc-cgl',
  testType = 'pyq',
  testId = 'test-id'
}) => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCopied, setReferralCopied] = useState(false);
  // Load referral code
  useEffect(() => {
    if (user) {
      loadReferralCode();
    }
  }, [user]);

  const loadReferralCode = async () => {
    try {
      const result = await referralService.generateReferralCode(user!.id);
      if (result.success && result.code) {
        setReferralCode(result.code);
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
    }
  };

  const handleDirectRefer = () => {
    if (referralCode) {
      const referralUrl = `${window.location.origin}/auth?ref=${referralCode}`;
      
      // Try to use Web Share API first, fallback to copy
      if (navigator.share) {
        navigator.share({
          title: 'Join S2S - Government Exam Preparation',
          text: 'Check out this amazing platform for government exam preparation!',
          url: referralUrl
        }).catch((error) => {
          console.log('Error sharing:', error);
          // Fallback to copy
          navigator.clipboard.writeText(referralUrl).then(() => {
            setReferralCopied(true);
            setTimeout(() => setReferralCopied(false), 2000);
          });
        });
      } else {
        // Fallback to copy
        navigator.clipboard.writeText(referralUrl).then(() => {
          setReferralCopied(true);
          setTimeout(() => setReferralCopied(false), 2000);
        });
      }
    }
  };

  // Security measures to prevent data inspection - CENTRALIZED CONFIG
  useEffect(() => {
    // Only apply security measures if enabled in config
    try {
      if (!isRightClickBlocked() && !isDevToolsBlocked() && !isTextSelectionBlocked() && !isKeyboardShortcutsBlocked()) {
        return;
      }
    } catch (error) {
      console.warn('Error checking security settings:', error);
      return;
    }

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      try {
        if (isRightClickBlocked()) {
          e.preventDefault();
        }
      } catch (error) {
        console.warn('Error in right click handler:', error);
      }
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if (isKeyboardShortcutsBlocked() || isDevToolsBlocked()) {
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'a')
          ) {
            e.preventDefault();
          }
        }
      } catch (error) {
        console.warn('Error in keyboard handler:', error);
      }
    };

    // Disable text selection
    const handleSelectStart = (e: Event) => {
      try {
        if (isTextSelectionBlocked()) {
          e.preventDefault();
        }
      } catch (error) {
        console.warn('Error in text selection handler:', error);
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Obfuscate sensitive data
  const obfuscateData = (data: any) => {
    if (typeof data === 'string') {
      return data.split('').map((char, index) => 
        index % 3 === 0 ? char : '*'
      ).join('');
    }
    return data;
  };
  // Helper function to get option text
  const getOptionText = (option: string | {text: string; image?: string} | {en: string; hi?: string; image?: string}): string => {
    if (typeof option === 'string') {
      return option;
    } else if (option && typeof option === 'object') {
      // Check if it's the language-aware format
      if ('en' in option && 'hi' in option) {
        return option.en; // Default to English for solutions
      } else {
        return (option as any)?.text || String(option);
      }
    }
    return String(option);
  };

  // Debug: Log question data structure
  useEffect(() => {
    if (questions.length > 0) {
      console.log('🔍 [SolutionsDisplay] Questions data structure:', questions.map((q, index) => ({
        index,
        id: q.id,
        correct: q.correct,
        correctAnswerIndex: (q as any).correctAnswerIndex,
        optionsLength: q.options?.length || 0,
        optionsType: Array.isArray(q.options) ? 'array' : typeof q.options
      })));
    }
  }, [questions]);
  const [showExplanations, setShowExplanations] = useState<{ [key: number]: boolean }>(() => {
    // Show explanations by default for all questions
    const defaultState: { [key: number]: boolean } = {};
    questions.forEach((_, index) => {
      defaultState[index] = true;
    });
    return defaultState;
  });

  // Calculate detailed marks breakdown
  const calculateMarksBreakdown = () => {
    let totalMarks = 0;
    let obtainedMarks = 0;
    let negativeMarks = 0;
    let attemptedQuestions = 0;
    let correctQuestions = 0;
    let incorrectQuestions = 0;
    let skippedQuestions = 0;

    questions.forEach((question, index) => {
      totalMarks += question.marks || 0;
      const userAnswer = userAnswers[index];
      
      if (userAnswer !== undefined) {
        attemptedQuestions++;
        if (question.correct !== undefined && userAnswer === question.correct) {
          obtainedMarks += question.marks || 0;
          correctQuestions++;
        } else {
          negativeMarks += question.negativeMarks || 0;
          incorrectQuestions++;
        }
      } else {
        skippedQuestions++;
      }
    });

    return {
      totalMarks,
      obtainedMarks,
      negativeMarks,
      netMarks: obtainedMarks - negativeMarks,
      attemptedQuestions,
      correctQuestions,
      incorrectQuestions,
      skippedQuestions
    };
  };

  const marksBreakdown = calculateMarksBreakdown();

  const toggleExplanation = (questionIndex: number) => {
    setShowExplanations(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'maths': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'english': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gk': return 'bg-green-100 text-green-800 border-green-200';
      case 'reasoning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get YouTube solutions for this test
  const youtubeSolutions = getYouTubeSolutionsForTest(testId);

  return (
    <div 
      className="min-h-screen bg-background p-4"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Security Warning - Removed as requested */}
      
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center space-x-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <span>Test Solutions</span>
            </CardTitle>
            
            {/* YouTube Solutions Section */}
            {youtubeSolutions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-red-200 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <Youtube className="w-5 h-5 mr-2" />
                  Watch Complete Solutions on YouTube
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {youtubeSolutions.map((solution, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-4 border-red-200 hover:bg-red-100"
                      onClick={() => window.open(solution.youtubeUrl, '_blank')}
                    >
                      <div className="flex items-center space-x-3">
                        <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-red-900 truncate">
                            {solution.title}
                          </p>
                          {solution.description && (
                            <p className="text-sm text-red-700 truncate">
                              {solution.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Direct Refer Button */}
            {referralCode && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Share with friends and earn rewards!
                    </span>
                  </div>
                  <Button
                    onClick={handleDirectRefer}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {referralCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share className="w-4 h-4 mr-1" />
                        Share & Earn
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Detailed Marks Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Detailed Performance Analysis
              </h3>
              
              {/* Main Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Correct</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{marksBreakdown.correctQuestions}</p>
                  <p className="text-xs text-muted-foreground">questions</p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-muted-foreground">Incorrect</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{marksBreakdown.incorrectQuestions}</p>
                  <p className="text-xs text-muted-foreground">questions</p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Attempted</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{marksBreakdown.attemptedQuestions}</p>
                  <p className="text-xs text-muted-foreground">out of {totalQuestions}</p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Time Taken</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
                  <p className="text-xs text-muted-foreground">Total Duration</p>
                </div>
              </div>

              {/* Net Score Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-700">Net Score</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{marksBreakdown.netMarks}</p>
                  <p className="text-xs text-muted-foreground">Final Marks</p>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-red-700">Negative Marks</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">-{marksBreakdown.negativeMarks}</p>
                  <p className="text-xs text-muted-foreground">for {marksBreakdown.incorrectQuestions} wrong answers</p>
                </div>
              </div>

              {/* Ranking & Competition Row - Always Show */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                {/* Your Rank - Always Show */}
                <div className="text-center bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Your Rank</span>
                    {onUpdateRank && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onUpdateRank}
                        className="text-xs h-6 px-2"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {rank !== null && rank !== undefined ? `#${rank}` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalParticipants !== null && totalParticipants !== undefined 
                      ? `out of ${totalParticipants} participants` 
                      : 'Loading...'}
                  </p>
                </div>

                {/* Highest Score - Always Show */}
                <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">Highest Score</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {highestMarks !== null && highestMarks !== undefined ? highestMarks : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {highestMarks !== null && highestMarks !== undefined 
                      ? 'marks achieved by anyone' 
                      : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Questions and Solutions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = question.correct !== undefined && userAnswer === question.correct;
            const hasExplanation = !!(question.explanation || question.explanationEn || question.explanationHi);

            return (
              <Card key={question.id} className="border-0 shadow-md">
                <CardContent className="p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                            Q{index + 1}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(question.difficulty || 'medium')}`}>
                            {question.difficulty || 'medium'}
                          </Badge>
                          <Badge className={`text-xs ${getSubjectColor(question.subject || 'general')}`}>
                            {question.subject || 'general'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.topic || 'general'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs bg-green-100 text-green-800">
                            +{question.marks || 0}
                          </Badge>
                          <Badge className="text-xs bg-red-100 text-red-800">
                            -{question.negativeMarks || 0}
                          </Badge>
                          <QuestionReportModal
                            examId={examId}
                            testType={testType}
                            testId={testId}
                            questionId={question.id}
                            questionText={question.questionEn}
                          />
                        </div>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 break-words">
                        {question.questionEn}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm break-words">
                        {question.questionHi}
                      </p>
                      
                      {/* Question Image */}
                      {question.questionImage && (
                        <div className="my-4 flex justify-center">
                          <ImageDisplay
                            imagePath={question.questionImage}
                            alt="Question image"
                            maxHeight="250px"
                            showZoom={true}
                            showDownload={true}
                          />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Options */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    {question.options && Array.isArray(question.options) ? question.options.map((option, optionIndex) => {
                      const isUserAnswer = userAnswer === optionIndex;
                      const isCorrectAnswer = question.correct !== undefined && question.correct === optionIndex;
                      
                      // Handle options - simple string format
                      let optionText: string;
                      let optionImage: string | undefined;
                      
                      if (typeof option === 'string') {
                        optionText = option;
                        optionImage = undefined;
                      } else if (option && typeof option === 'object') {
                        // Check if it's the language-aware format
                        if ('en' in option && 'hi' in option) {
                          // For solutions, show English by default
                          optionText = option.en;
                          optionImage = option.image;
                        } else {
                          // Fallback for old format
                          optionText = (option as any)?.text || String(option);
                          optionImage = (option as any)?.image;
                        }
                      } else {
                        optionText = String(option);
                        optionImage = undefined;
                      }
                      
                      let optionClass = "p-2 sm:p-3 rounded-lg border transition-colors";
                      
                      if (isCorrectAnswer) {
                        optionClass += " bg-green-50 border-green-200 text-green-800";
                      } else if (isUserAnswer && !isCorrect) {
                        optionClass += " bg-red-50 border-red-200 text-red-800";
                      } else {
                        optionClass += " bg-muted/50 border-border text-foreground";
                      }

                      return (
                        <div key={optionIndex} className={optionClass}>
                          <div className="flex items-start space-x-2 sm:space-x-3">
                            <span className="font-medium text-xs sm:text-sm flex-shrink-0 mt-0.5">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="block text-xs sm:text-sm break-words">{optionText}</span>
                              {optionImage && (
                                <div className="mt-2">
                                  <img 
                                    src={`/logos/${optionImage}`} 
                                    alt={`Option ${String.fromCharCode(65 + optionIndex)} image`}
                                    className="max-w-full h-auto rounded border"
                                    style={{ maxHeight: '150px' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {isCorrectAnswer && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              {isUserAnswer && !isCorrect && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center text-muted-foreground py-4">
                        No options available for this question.
                      </div>
                    )}
                  </div>

                  {/* Answer Summary */}
                  <div className="bg-muted/30 rounded-lg p-3 sm:p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-foreground">
                          Your Answer: {userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : 'Not Attempted'}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Correct Answer: {question.correct !== undefined && question.correct >= 0 && question.correct < (question.options?.length || 0) ? String.fromCharCode(65 + question.correct) : 'Not available'}
                        </p>
                        {userAnswer !== undefined && (
                          <p className={`text-xs sm:text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? `+${question.marks || 0} marks earned` : `-${question.negativeMarks || 0} marks deducted`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col sm:items-end space-y-1 sm:space-y-2">
                        <Badge 
                          variant={isCorrect ? "default" : "destructive"}
                          className={`text-xs ${isCorrect ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                        {userAnswer !== undefined && (
                          <Badge 
                            variant="outline"
                            className={`text-xs ${isCorrect ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}`}
                          >
                            {isCorrect ? `+${question.marks || 0}` : `-${question.negativeMarks || 0}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm sm:text-base text-foreground">Solution & Explanation</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExplanation(index)}
                        className="text-xs h-7 px-2"
                      >
                        {showExplanations[index] ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showExplanations[index] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <h5 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Step-by-step Solution:</h5>
                        <p className="text-blue-800 text-xs sm:text-sm leading-relaxed mb-3 break-words">
                          {question.explanationEn || question.explanationHi || question.explanation || `This ${question.difficulty || 'medium'} level ${question.subject || 'general'} question tests your knowledge of ${question.topic || 'general'}. The correct answer is option ${question.correct !== undefined ? String.fromCharCode(65 + question.correct) : 'Not available'} based on the given options.`}
                        </p>
                        
                        {/* Explanation Image - Direct from JSON */}
                        {(() => {
                          const explanationImage = question.explanationImage;
                          const imagePath = explanationImage ? 
                            (typeof explanationImage === 'string' ? 
                              explanationImage : 
                              (explanationImage as any).en) :
                            null;
                          
                          return imagePath && (
                            <div className="mt-3 flex justify-center">
                              <ImageDisplay
                                imagePath={imagePath}
                                alt="Solution explanation"
                                maxHeight="250px"
                                showZoom={true}
                                showDownload={true}
                                caption="Step-by-step solution diagram"
                              />
                            </div>
                          );
                        })()}
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-green-800 text-sm font-medium">
                            <strong>Final Answer:</strong> Option {question.correct !== undefined && question.correct >= 0 && question.correct < (question.options?.length || 0) ? String.fromCharCode(65 + question.correct) : 'N/A'} - {question.options && question.correct !== undefined && question.correct >= 0 && question.correct < question.options.length && question.options[question.correct] ? getOptionText(question.options[question.correct]) : 'Answer not available'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onBackToDashboard || onClose}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                size="lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                Print Solutions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SolutionsDisplay;
