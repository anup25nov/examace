import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, Play, RotateCcw, BookOpen } from 'lucide-react';
import { ResponsiveScrollContainer } from '@/components/ResponsiveScrollContainer';

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
    <div className="space-y-4">
      {/* Mock Test Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Mock Tests</h3>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {stats.completed}/{stats.total} Completed
          </Badge>
        </div>
      </div>

      {/* Mock Test Cards Container */}
      <Card className="gradient-card border-0 shadow-lg">
        <CardContent className="p-4">
          {/* Test Cards Grid with Scroller */}
          <ResponsiveScrollContainer cardCount={mockTests.length}>
            {mockTests.map((test) => {
              const isCompleted = completedTests.has(`mock-${test.id}`);
              const testScore = testScores.get(`mock-${test.id}`);

              return (
                <Card 
                  key={test.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                    isCompleted ? 'border-green-200 bg-green-50/50 shadow-md' : 'border-border hover:border-primary/20'
                  }`}
                >
                  <CardContent className="p-4 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 flex-1">
                          {test.name}
                        </h3>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <span className="text-xs bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full font-bold shadow-md animate-pulse border-2 border-green-300 shadow-lg">
                            FREE
                          </span>
                          {isCompleted && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="mb-4 min-h-[80px] flex items-center justify-center">
                      {testScore && isCompleted ? (
                        <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-blue-600">{testScore.score}</div>
                              <div className="text-sm text-blue-500 font-medium">Score</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-purple-600">#{testScore.rank}</div>
                              <div className="text-sm text-purple-500 font-medium">Rank</div>
                            </div>
                          </div>
                          {testScore.totalParticipants > 0 && (
                            <div className="text-center mt-3">
                              <span className="text-sm text-muted-foreground">
                                out of {testScore.totalParticipants} participants
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <div className="text-sm">Complete test to see</div>
                            <div className="text-xs">your score & rank</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-3 mt-auto">
                      {isCompleted ? (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-10 text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            onClick={() => onViewSolutions(test.id)}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            View Solutions
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 h-10 text-sm bg-primary hover:bg-primary/90 transition-colors"
                            onClick={() => onRetryTest(test.id)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full h-10 text-sm bg-primary hover:bg-primary/90 transition-colors"
                          onClick={() => onTestSelect(test.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Test
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
