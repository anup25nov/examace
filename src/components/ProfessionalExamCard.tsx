import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  BookOpen, 
  CheckCircle, 
  Star,
  Crown,
  Clock,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { MockTestAccessControl } from './MockTestAccessControl';

interface ProfessionalExamCardProps {
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

export const ProfessionalExamCard: React.FC<ProfessionalExamCardProps> = ({
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
  const getTestTypeConfig = () => {
    switch (testType) {
      case 'mock':
        return {
          icon: <Star className="w-5 h-5" />,
          label: 'MOCK TEST',
          gradient: 'from-blue-500 via-purple-500 to-indigo-600',
          bgGradient: 'from-blue-50 to-purple-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconBg: 'bg-blue-100'
        };
      case 'pyq':
        return {
          icon: <BookOpen className="w-5 h-5" />,
          label: 'PYQ',
          gradient: 'from-green-500 via-emerald-500 to-teal-600',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconBg: 'bg-green-100'
        };
      case 'practice':
        return {
          icon: <Target className="w-5 h-5" />,
          label: 'PRACTICE',
          gradient: 'from-orange-500 via-red-500 to-pink-600',
          bgGradient: 'from-orange-50 to-red-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          iconBg: 'bg-orange-100'
        };
      default:
        return {
          icon: <Play className="w-5 h-5" />,
          label: 'TEST',
          gradient: 'from-gray-500 to-gray-600',
          bgGradient: 'from-gray-50 to-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const config = getTestTypeConfig();

  const renderTestContent = () => (
    <Card className={`
      group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] 
      bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border-2
      ${isCompleted ? 'ring-2 ring-green-300 shadow-lg' : 'hover:ring-2 hover:ring-blue-300'}
      ${isPaid ? 'ring-2 ring-yellow-300 shadow-xl' : ''}
    `}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>

      {/* Header Section */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`p-2 rounded-lg ${config.iconBg} shadow-sm`}>
                {config.icon}
              </div>
              <Badge className={`bg-gradient-to-r ${config.gradient} text-white font-bold px-3 py-1 shadow-md`}>
                {config.label}
              </Badge>
              {isPaid && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-3 py-1 shadow-md animate-pulse">
                  <Crown className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {testName}
            </h3>

            {/* Test Info */}
            {!isCompleted && testInfo && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{testInfo.questions} Questions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{testInfo.marks} Marks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{testInfo.duration} Min</span>
                </div>
              </div>
            )}

          </div>

          {/* Completion Status */}
          {isCompleted && (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600">Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Score and Rank Display - Only for Mock and PYQ */}
      {(testType === 'mock' || testType === 'pyq') && isCompleted && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <div className="text-2xl font-bold">{testScore || 0}</div>
              <div className="text-xs opacity-90">out of {testInfo?.marks || 100}</div>
            </div>
            
            {/* Rank Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Rank</span>
              </div>
              <div className="text-2xl font-bold">#{testRank || 0}</div>
              <div className="text-xs opacity-90">of {totalParticipants || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        {isCompleted ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onViewSolutions}
              variant="outline"
              className="group/btn border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <BookOpen className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
              <span className="font-medium">View Solutions</span>
            </Button>
            <Button
              onClick={onRetryTest}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className="font-medium">Retry Test</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStartTest}
            className={`
              w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 
              transform hover:scale-105 active:scale-95
              ${isPaid 
                ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600' 
                : `bg-gradient-to-r ${config.gradient} hover:shadow-2xl`
              } text-white
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              {isPaid ? (
                <>
                  <Crown className="w-5 h-5 animate-pulse" />
                  <span>Start Premium Test</span>
                  <Zap className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Test</span>
                  <Zap className="w-4 h-4" />
                </>
              )}
            </div>
          </Button>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
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
