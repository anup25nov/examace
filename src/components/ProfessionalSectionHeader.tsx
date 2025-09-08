import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  Star, 
  BookOpen, 
  Target,
  TrendingUp,
  Users,
  Award,
  Zap,
  Crown
} from 'lucide-react';

interface ProfessionalSectionHeaderProps {
  sectionId: string;
  sectionName: string;
  isOpen: boolean;
  isDisabled: boolean;
  testCount: number;
  completedCount: number;
  onToggle: () => void;
  onUpgradeClick?: () => void;
  isPaid?: boolean;
  requiredPlan?: string;
}

export const ProfessionalSectionHeader: React.FC<ProfessionalSectionHeaderProps> = ({
  sectionId,
  sectionName,
  isOpen,
  isDisabled,
  testCount,
  completedCount,
  onToggle,
  onUpgradeClick,
  isPaid = false,
  requiredPlan = 'basic'
}) => {
  const getSectionConfig = () => {
    switch (sectionId) {
      case 'mock':
        return {
          icon: <Star className="w-6 h-6" />,
          gradient: 'from-blue-500 via-purple-500 to-indigo-600',
          bgGradient: 'from-blue-50 via-purple-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconBg: 'bg-blue-100',
          description: 'Simulate real exam conditions with comprehensive mock tests',
          features: ['Real exam pattern', 'Detailed analytics', 'Performance tracking']
        };
      case 'pyq':
        return {
          icon: <BookOpen className="w-6 h-6" />,
          gradient: 'from-green-500 via-emerald-500 to-teal-600',
          bgGradient: 'from-green-50 via-emerald-50 to-teal-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconBg: 'bg-green-100',
          description: 'Practice with actual previous year questions from real exams',
          features: ['Authentic questions', 'Year-wise analysis', 'Trend patterns']
        };
      case 'practice':
        return {
          icon: <Target className="w-6 h-6" />,
          gradient: 'from-orange-500 via-red-500 to-pink-600',
          bgGradient: 'from-orange-50 via-red-50 to-pink-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-700',
          iconBg: 'bg-orange-100',
          description: 'Master specific topics with targeted practice sets',
          features: ['Topic-wise practice', 'Concept reinforcement', 'Skill building']
        };
      default:
        return {
          icon: <Target className="w-6 h-6" />,
          gradient: 'from-gray-500 to-gray-600',
          bgGradient: 'from-gray-50 to-gray-100',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          description: 'Practice and improve your skills',
          features: ['Practice tests', 'Skill building', 'Progress tracking']
        };
    }
  };

  const config = getSectionConfig();
  const completionPercentage = testCount > 0 ? Math.round((completedCount / testCount) * 100) : 0;

  return (
    <Card className={`
      group relative overflow-hidden transition-all duration-500 hover:shadow-xl
      bg-gradient-to-r ${config.bgGradient} ${config.borderColor} border-2
      ${isDisabled ? 'opacity-60' : 'hover:scale-[1.01]'}
      ${isOpen ? 'shadow-lg' : 'hover:shadow-md'}
    `}>
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>

      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Section Icon */}
            <div className={`
              p-3 rounded-xl ${config.iconBg} shadow-lg
              group-hover:scale-110 transition-transform duration-300
            `}>
              {config.icon}
            </div>

            {/* Section Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {sectionName}
                </h2>
                <Badge className={`bg-gradient-to-r ${config.gradient} text-white font-bold px-3 py-1 shadow-md`}>
                  {testCount} Tests
                </Badge>
                {isPaid && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-3 py-1 shadow-md animate-pulse">
                    <Crown className="w-3 h-3 mr-1" />
                    PREMIUM
                  </Badge>
                )}
                {isDisabled && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Coming Soon
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3 max-w-md">
                {config.description}
              </p>

              {/* Progress Bar */}
              {!isDisabled && testCount > 0 && (
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-1000 ease-out`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                    {completedCount}/{testCount} completed
                  </span>
                </div>
              )}

              {/* Features */}
              {!isDisabled && (
                <div className="flex items-center space-x-4 mt-3">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-1 text-xs text-gray-500">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {isPaid && !isDisabled && (
              <Button
                onClick={onUpgradeClick}
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}

            <Button
              onClick={onToggle}
              disabled={isDisabled}
              variant="ghost"
              size="sm"
              className={`
                p-2 rounded-lg transition-all duration-300
                ${isDisabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                }
                ${isOpen ? 'rotate-180' : ''}
              `}
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {!isDisabled && testCount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Total Tests</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{testCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>Completed</span>
                </div>
                <div className="text-lg font-bold text-green-600">{completedCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Progress</span>
                </div>
                <div className="text-lg font-bold text-blue-600">{completionPercentage}%</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
    </Card>
  );
};
