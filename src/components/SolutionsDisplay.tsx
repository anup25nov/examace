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
  Trophy
} from 'lucide-react';

interface Question {
  id: string;
  questionEn: string;
  questionHi: string;
  options: string[];
  correct: number;
  difficulty: string;
  subject: string;
  topic: string;
  explanation?: string;
}

interface SolutionsDisplayProps {
  questions: Question[];
  userAnswers: { [key: number]: number };
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  onClose: () => void;
}

const SolutionsDisplay: React.FC<SolutionsDisplayProps> = ({
  questions,
  userAnswers,
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
  onClose
}) => {
  const [showExplanations, setShowExplanations] = useState<{ [key: number]: boolean }>(() => {
    // Show explanations by default for all questions
    const defaultState: { [key: number]: boolean } = {};
    questions.forEach((_, index) => {
      defaultState[index] = true;
    });
    return defaultState;
  });

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">Score</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{score}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Correct</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{correctAnswers}/{totalQuestions}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium text-muted-foreground">Time</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatTime(timeTaken)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-muted-foreground">Questions</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
              </div>
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
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {question.questionEn}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {question.questionHi}
                      </p>
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
                      </div>
                      <Badge 
                        variant={isCorrect ? "default" : "destructive"}
                        className={isCorrect ? "bg-green-100 text-green-800" : ""}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
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
                className="flex-1 sm:flex-none"
                size="lg"
              >
                Close Solutions
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
