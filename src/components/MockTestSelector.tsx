import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Play, RotateCcw, BookOpen, Clock, Target } from 'lucide-react';
import ResponsiveScrollContainer from '@/components/ResponsiveScrollContainer';

interface MockTestSelectorProps {
  mockTests: any[];
  onTestSelect: (testId: string) => void;
  onRetryTest: (testId: string) => void;
  onViewSolutions: (testId: string) => void;
  completedTests: Set<string>;
  testScores: Map<string, { score: number; rank: number; totalParticipants: number }>;
}

export const MockTestSelector: React.FC<MockTestSelectorProps> = ({
  mockTests,
  onTestSelect,
  onRetryTest,
  onViewSolutions,
  completedTests,
  testScores
}) => {
  // Removed pagination - using scroller instead

  const getCompletionStats = () => {
    const total = mockTests.length;
    const completed = mockTests.filter(test => 
      completedTests.has(`mock-${test.id}`)
    ).length;
    return { completed, total };
  };

  if (mockTests.length === 0) return null;

  const stats = getCompletionStats();

  return (
    <div className="space-y-0">
      {/* Mock Test Cards Container */}
      <Card className="gradient-card border-0 shadow-lg h-[420px] flex flex-col">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex flex-col space-y-4">
            {/* Main Header - Top */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Mock Tests</h3>
                  <p className="text-sm text-blue-100">
                    {stats.total} Practice Tests Available
                  </p>
                </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-hidden">
          {/* Test Cards Grid with Scroller */}
          <ResponsiveScrollContainer cardCount={mockTests.length}>
            {mockTests.map((test) => {
              const isCompleted = completedTests.has(`mock-${test.id}`);
              const testScore = testScores.get(`mock-${test.id}`);

              return (
                <Card 
                  key={test.id} 
                  className={`test-card relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.05] hover:border-primary/40 h-72 group ${
                    isCompleted 
                      ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg' 
                      : test.isPremium
                        ? 'border-2 border-yellow-400 bg-white shadow-xl ring-4 ring-yellow-200/60 hover:ring-yellow-300/80'
                        : 'border-border bg-gradient-to-br from-white to-slate-50 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <CardContent className="p-3 sm:p-4 h-full flex flex-col relative">
                    {/* Premium glow effect */}
                    {test.isPremium && (
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-orange-100/20 rounded-lg opacity-50"></div>
                    )}
                    
                    {/* Header */}
                    <div className="mb-2 sm:mb-4 flex-1 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="flex items-start sm:items-center space-x-2 flex-1">
                          {test.isPremium && (
                            <div className="flex-shrink-0 p-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                              <span className="text-white text-sm">👑</span>
                            </div>
                          )}
                          <h3 className={`font-bold text-sm line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300 ${
                            test.isPremium ? 'text-orange-900' : 'text-foreground'
                          }`}>
                            {test.name}
                          </h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0 sm:ml-2">
                          <Badge className={`mobile-badge text-xs px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-lg ${
                            test.isPremium 
                              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white animate-pulse border-2 border-yellow-300 hover:scale-105 transition-transform' 
                              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300'
                          }`}>
                            {test.isPremium ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs sm:text-sm">👑</span>
                                <span className="hidden xs:inline">PREMIUM</span>
                                <span className="xs:hidden">PREMIUM</span>
                                <span className="text-xs">✨</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className="text-xs sm:text-sm">⭐</span>
                                <span>FREE</span>
                              </div>
                            )}
                          </Badge>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    {testScore && isCompleted ? (
                      <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Score</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-800">{testScore.score}</div>
                            <div className="text-xs text-green-600">Rank: #{testScore.rank}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Complete to see score & rank</span>
                        </div>
                      </div>
                    )}

                    {/* Test Details */}
                    <div className="mb-2 sm:mb-4 space-y-1 sm:space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration} min</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span>{test.questions.length} questions</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto relative z-10">
                      {isCompleted ? (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs sm:text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 min-h-[44px]"
                            onClick={() => onViewSolutions(test.id)}
                          >
                            <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                            <span>View Solutions</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 min-h-[44px]"
                            onClick={() => onRetryTest(test.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry Test
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className={`w-full text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 min-h-[44px] ${
                            test.isPremium 
                              ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white border-2 border-yellow-300 animate-pulse' 
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          }`}
                          onClick={() => onTestSelect(test.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {test.isPremium ? (
                            <div className="flex items-center space-x-1">
                              <span>🚀 Start Premium Test</span>
                              <span>⭐</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span>Start Practice Test</span>
                              <span>🎯</span>
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </ResponsiveScrollContainer>
        </CardContent>
      </Card>
    </div>
  );
};
