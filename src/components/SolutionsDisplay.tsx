import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';

interface Question {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[];
  correct: number;
  difficulty: string;
  subject?: string;
  topic: string;
  marks: number;
  negativeMarks: number;
  duration: number;
  explanation?: string;
  questionImage?: string;
  explanationImage?: string;
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
  onUpdateRank
}) => {
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
      totalMarks += question.marks;
      const userAnswer = userAnswers[index];
      
      if (userAnswer !== undefined) {
        attemptedQuestions++;
        if (userAnswer === question.correct) {
          obtainedMarks += question.marks;
          correctQuestions++;
        } else {
          negativeMarks += question.negativeMarks;
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold text-foreground flex items-center justify-center space-x-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <span>Test Solutions</span>
            </CardTitle>
            
            {/* Quick Performance Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="text-center">
                  <span className="text-slate-600">Total Questions:</span>
                  <span className="ml-1 font-semibold text-slate-800">{totalQuestions}</span>
                </div>
                <div className="text-center">
                  <span className="text-green-600">Correct:</span>
                  <span className="ml-1 font-semibold text-green-700">{marksBreakdown.correctQuestions}</span>
                </div>
                <div className="text-center">
                  <span className="text-red-600">Incorrect:</span>
                  <span className="ml-1 font-semibold text-red-700">{marksBreakdown.incorrectQuestions}</span>
                </div>
                <div className="text-center">
                  <span className="text-orange-600">Skipped:</span>
                  <span className="ml-1 font-semibold text-orange-700">{marksBreakdown.skippedQuestions}</span>
                </div>
                <div className="text-center">
                  <span className="text-blue-600">Net Score:</span>
                  <span className="ml-1 font-semibold text-blue-700">{marksBreakdown.netMarks}/{marksBreakdown.totalMarks}</span>
                </div>
                {rank && totalParticipants && (
                  <div className="text-center">
                    <span className="text-purple-600">Rank:</span>
                    <span className="ml-1 font-semibold text-purple-700">#{rank} of {totalParticipants}</span>
                  </div>
                )}
              </div>
              {rank && totalParticipants && onUpdateRank && (
                <div className="mt-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUpdateRank}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Update Rank
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rank updates as more students attempt this test
                  </p>
                </div>
              )}
            </div>
            {/* Detailed Marks Breakdown */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Detailed Performance Analysis
              </h3>
              
              {/* Primary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium text-muted-foreground">Score</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{score}%</p>
                  <p className="text-xs text-muted-foreground">Overall Performance</p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{marksBreakdown.correctQuestions}/{marksBreakdown.attemptedQuestions}</p>
                  <p className="text-xs text-muted-foreground">
                    {marksBreakdown.attemptedQuestions > 0 ? Math.round((marksBreakdown.correctQuestions / marksBreakdown.attemptedQuestions) * 100) : 0}% correct
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-muted-foreground">Time Taken</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
                  <p className="text-xs text-muted-foreground">Total Duration</p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <BookOpen className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-muted-foreground">Attempted</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{marksBreakdown.attemptedQuestions}/{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">
                    {marksBreakdown.skippedQuestions > 0 ? `${marksBreakdown.skippedQuestions} skipped` : 'All questions'}
                  </p>
                </div>
              </div>

              {/* Marks Breakdown Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-green-700">Marks Obtained</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">+{marksBreakdown.obtainedMarks}</p>
                  <p className="text-xs text-muted-foreground">out of {marksBreakdown.totalMarks} total</p>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-red-700">Negative Marks</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">-{marksBreakdown.negativeMarks}</p>
                  <p className="text-xs text-muted-foreground">for {marksBreakdown.incorrectQuestions} wrong answers</p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-blue-700">Net Score</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{marksBreakdown.netMarks}</p>
                  <p className="text-xs text-muted-foreground">Final Marks</p>
                </div>
              </div>

              {/* Ranking & Competition Row */}
              {(rank && totalParticipants) || highestMarks ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                  {rank && totalParticipants && (
                    <div className="text-center bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Trophy className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Your Rank</span>
                        <button
                          onClick={onUpdateRank}
                          className="text-xs text-purple-500 hover:text-purple-700"
                          title="Rank will be updated as more students attempt this test"
                        >
                          ℹ️
                        </button>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">#{rank}</p>
                      <p className="text-xs text-muted-foreground">out of {totalParticipants} participants</p>
                    </div>
                  )}
                  {highestMarks && (
                    <div className="text-center bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Trophy className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Highest Score</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{highestMarks}</p>
                      <p className="text-xs text-muted-foreground">marks achieved by anyone</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        {/* Questions and Solutions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correct;
            const hasExplanation = !!question.explanation;

            return (
              <Card key={question.id} className="border-0 shadow-md">
                <CardContent className="p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-sm font-medium">
                          Q{index + 1}
                        </Badge>
                        <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </Badge>
                        <Badge className={`text-xs ${getSubjectColor(question.subject)}`}>
                          {question.subject}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.topic}
                        </Badge>
                        <Badge className="text-xs bg-green-100 text-green-800">
                          +{question.marks} marks
                        </Badge>
                        <Badge className="text-xs bg-red-100 text-red-800">
                          -{question.negativeMarks} marks
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {question.questionEn}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {question.questionHi}
                      </p>
                      
                      {/* Question Image */}
                      {question.questionImage && (
                        <div className="my-4 flex justify-center">
                          <img 
                            src={question.questionImage} 
                            alt="Question" 
                            className="max-w-full h-auto rounded-lg shadow-md border"
                            style={{ maxHeight: '300px' }}
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
                  <div className="space-y-3 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = userAnswer === optionIndex;
                      const isCorrectAnswer = question.correct === optionIndex;
                      
                      let optionClass = "p-3 rounded-lg border transition-colors";
                      
                      if (isCorrectAnswer) {
                        optionClass += " bg-green-50 border-green-200 text-green-800";
                      } else if (isUserAnswer && !isCorrect) {
                        optionClass += " bg-red-50 border-red-200 text-red-800";
                      } else {
                        optionClass += " bg-muted/50 border-border text-foreground";
                      }

                      return (
                        <div key={optionIndex} className={optionClass}>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-sm">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {isCorrectAnswer && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {isUserAnswer && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Summary */}
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Your Answer: {userAnswer !== undefined ? String.fromCharCode(65 + userAnswer) : 'Not Attempted'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Correct Answer: {String.fromCharCode(65 + question.correct)}
                        </p>
                        {userAnswer !== undefined && (
                          <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? `+${question.marks} marks earned` : `-${question.negativeMarks} marks deducted`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge 
                          variant={isCorrect ? "default" : "destructive"}
                          className={isCorrect ? "bg-green-100 text-green-800" : ""}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                        {userAnswer !== undefined && (
                          <Badge 
                            variant="outline"
                            className={isCorrect ? "border-green-200 text-green-700" : "border-red-200 text-red-700"}
                          >
                            {isCorrect ? `+${question.marks}` : `-${question.negativeMarks}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Solution & Explanation</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExplanation(index)}
                      >
                        {showExplanations[index] ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showExplanations[index] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Step-by-step Solution:</h5>
                        <p className="text-blue-800 text-sm leading-relaxed mb-3">
                          {question.explanation || `This ${question.difficulty} level ${question.subject} question tests your knowledge of ${question.topic}. The correct answer is option ${String.fromCharCode(65 + question.correct)} based on the given options.`}
                        </p>
                        
                        {/* Explanation Image */}
                        {question.explanationImage && (
                          <div className="mt-3 flex justify-center">
                            <img 
                              src={question.explanationImage} 
                              alt="Explanation" 
                              className="max-w-full h-auto rounded-lg shadow-sm border"
                              style={{ maxHeight: '250px' }}
                            />
                          </div>
                        )}
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-green-800 text-sm font-medium">
                            <strong>Final Answer:</strong> Option {String.fromCharCode(65 + question.correct)} - {question.options[question.correct]}
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
                onClick={onClose}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-semibold"
                size="lg"
              >
                🏠 Go to Dashboard
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
