import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Play, 
  RotateCcw, 
  BookOpen,
  Crown,
  Lock,
  Star
} from 'lucide-react';
import { MockTestAccessControl } from './MockTestAccessControl';

interface TestCardProps {
  testId: string;
  testName: string;
  testType: 'mock' | 'pyq' | 'practice';
  topicId?: string;
  isCompleted: boolean;
  testScore?: number;
  testRank?: number;
  totalParticipants?: number;
  isPaid?: boolean;
  requiredPlan?: string;
  onStartTest: () => void;
  onRetryTest: () => void;
  onViewSolutions: () => void;
  onUpgradeClick: () => void;
  testInfo?: {
    questions: number;
    marks: number;
    duration: number;
  };
}

export const TestCard: React.FC<TestCardProps> = ({
  testId,
  testName,
  testType,
  topicId,
  isCompleted,
  testScore,
  testRank,
  totalParticipants,
  isPaid = false,
  requiredPlan = 'basic',
  onStartTest,
  onRetryTest,
  onViewSolutions,
  onUpgradeClick,
  testInfo
}) => {
  const getTestTypeIcon = () => {
    switch (testType) {
      case 'mock':
        return <Star className="w-4 h-4" />;
      case 'pyq':
        return <BookOpen className="w-4 h-4" />;
      case 'practice':
        return <Play className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getTestTypeColor = () => {
    switch (testType) {
      case 'mock':
        return 'bg-gradient-to-r from-blue-500 to-purple-600';
      case 'pyq':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'practice':
        return 'bg-gradient-to-r from-orange-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getTestTypeLabel = () => {
    switch (testType) {
      case 'mock':
        return 'MOCK';
      case 'pyq':
        return 'PYQ';
      case 'practice':
        return 'PRACTICE';
      default:
        return 'TEST';
    }
  };

  const renderTestContent = () => (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] h-48 ${
      isCompleted ? 'border-green-200 bg-green-50/50 shadow-md' : 'border-border hover:border-primary/20'
    } ${isPaid ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
      <CardContent className="p-4 sm:p-5 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 flex-1">
              {testName}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
              {/* Test Type Badge */}
              <Badge className={`text-white text-xs px-2 py-1 ${getTestTypeColor()}`}>
                {getTestTypeIcon()}
                <span className="ml-1">{getTestTypeLabel()}</span>
              </Badge>
              
              {/* Paid/Free Badge */}
              {isPaid ? (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full font-bold shadow-md">
                  <Crown className="w-3 h-3 mr-1" />
                  PAID
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full font-bold shadow-md animate-pulse border-2 border-green-300 shadow-lg">
                  FREE
                </Badge>
              )}
              
              {/* Completion Status */}
              {isCompleted && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium hidden sm:inline">Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Test Info - Only show if not completed */}
        {!isCompleted && testInfo && (
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>{testInfo.questions} Questions</span>
              <span>{testInfo.marks} Marks</span>
              <span>{testInfo.duration} Minutes</span>
            </div>
          </div>
        )}
        
        {/* Score and Rank Display - Only for Mock and PYQ */}
        {(testType === 'mock' || testType === 'pyq') && isCompleted && (
          <div className="mb-4 min-h-[80px] flex items-center justify-center">
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Score */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-3 text-center shadow-md">
                <div className="text-lg sm:text-xl font-bold">{testScore || 0}</div>
                <div className="text-xs opacity-90">Score</div>
              </div>
              
              {/* Rank */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-3 text-center shadow-md">
                <div className="text-lg sm:text-xl font-bold">#{testRank || 0}</div>
                <div className="text-xs opacity-90">
                  of {totalParticipants || 0} participants
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="mt-auto">
          {isCompleted ? (
            <div className="flex space-x-2">
              <Button
                onClick={onViewSolutions}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                📖 View Solutions
              </Button>
              <Button
                onClick={onRetryTest}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                🔄 Retry
              </Button>
            </div>
          ) : (
            <Button
              onClick={onStartTest}
              className={`w-full text-sm font-medium ${
                isPaid 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              } text-white shadow-md`}
            >
              {isPaid ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Start Premium Test
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Test
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // If it's a paid test, wrap with access control
  if (isPaid) {
    return (
      <MockTestAccessControl
        testId={testId}
        testName={testName}
        requiredPlan={requiredPlan}
        onAccessGranted={onStartTest}
        onUpgradeClick={onUpgradeClick}
      >
        {renderTestContent()}
      </MockTestAccessControl>
    );
  }

  return renderTestContent();
};
