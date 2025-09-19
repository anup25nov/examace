import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useComprehensiveStats } from '@/hooks/useComprehensiveStats';
import { testSubmissionService } from '@/lib/testSubmissionService';
import { BarChart3, Trophy, Target, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface StatsVerificationProps {
  examId: string;
}

export const StatsVerification: React.FC<StatsVerificationProps> = ({ examId }) => {
  const { stats, loading, error, refreshStats } = useComprehensiveStats(examId);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate test submissions for verification
  const simulateTestSubmissions = async () => {
    setIsSubmitting(true);
    const results = [];

    try {
      // Generate random test scores between 60-95 for realistic testing
      const testScores = Array.from({ length: 5 }, () => Math.floor(Math.random() * 36) + 60);
      
      for (let i = 0; i < testScores.length; i++) {
        const score = testScores[i];
        const testType = i % 3 === 0 ? 'pyq' : i % 3 === 1 ? 'mock' : 'practice';
        
        const result = await testSubmissionService.submitTestAttempt({
          examId,
          testType: testType as 'pyq' | 'mock' | 'practice',
          testId: `verification_test_${Date.now()}_${i + 1}`,
          score,
          totalQuestions: 100,
          correctAnswers: score,
          timeTaken: 1800 + Math.random() * 1200, // 30-50 minutes
          answers: {}
        });

        results.push({
          testNumber: i + 1,
          testType,
          score,
          success: result.success,
          error: result.error
        });

        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setTestResults(results);
      await refreshStats(); // Refresh stats after submissions
    } catch (error) {
      console.error('Error simulating test submissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearTestData = async () => {
    // This would need to be implemented based on your requirements
    console.log('Clear test data functionality would be implemented here');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading statistics: {error}</p>
          <Button onClick={refreshStats} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>Statistics Verification Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={simulateTestSubmissions} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Simulating Tests...
                </>
              ) : (
                'Simulate 5 Test Submissions'
              )}
            </Button>
            <Button onClick={refreshStats} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
            <Button onClick={clearTestData} variant="outline" className="text-red-600">
              Clear Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTests}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.bestScore}</div>
              <div className="text-sm text-gray-600">Best Score</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.last10Average}</div>
              <div className="text-sm text-gray-600">Last 10 Average</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.averageScore}</div>
              <div className="text-sm text-gray-600">Overall Average</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Test Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">PYQ Tests</Badge>
                <div className="text-lg font-semibold">{stats.testBreakdown.pyq.count}</div>
                <div className="text-sm text-gray-600">
                  Best: {stats.testBreakdown.pyq.bestScore} | 
                  Avg: {stats.testBreakdown.pyq.averageScore}
                </div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Mock Tests</Badge>
                <div className="text-lg font-semibold">{stats.testBreakdown.mock.count}</div>
                <div className="text-sm text-gray-600">
                  Best: {stats.testBreakdown.mock.bestScore} | 
                  Avg: {stats.testBreakdown.mock.averageScore}
                </div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Practice Tests</Badge>
                <div className="text-lg font-semibold">{stats.testBreakdown.practice.count}</div>
                <div className="text-sm text-gray-600">
                  Best: {stats.testBreakdown.practice.bestScore} | 
                  Avg: {stats.testBreakdown.practice.averageScore}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tests */}
      {stats && stats.recentTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests (Last 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{test.testType.toUpperCase()}</Badge>
                    <span className="font-medium">{test.testId}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">{test.score}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(test.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Submission Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">Test {result.testNumber}</span>
                    <Badge variant="outline">{result.testType.toUpperCase()}</Badge>
                    <span className="font-semibold">Score: {result.score}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.success ? 'Success' : result.error}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
