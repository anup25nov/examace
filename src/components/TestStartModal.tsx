import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ViewportDialog } from '@/components/ViewportDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Clock, 
  FileText, 
  Users, 
  Trophy,
  Globe,
  CheckCircle,
  AlertCircle,
  Info,
  Crown,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { planLimitsService, PlanLimits } from '@/lib/planLimitsService';
import { UpgradeModal } from './UpgradeModal';
import { dynamicExamService } from '@/lib/dynamicExamService';

interface TestStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (language: string) => void;
  test: {
    name: string;
    duration: number;
    questions: number;
    subjects: string[];
    difficulty: string;
    isPremium: boolean;
    price?: number;
  };
  testType: 'mock' | 'pyq';
  examId?: string;
}

export const TestStartModal: React.FC<TestStartModalProps> = ({
  isOpen,
  onClose,
  onStart,
  test,
  testType,
  examId
}) => {
  const { getUserId } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get marking scheme based on exam type
  const getMarkingScheme = () => {
    if (examId) {
      const examConfig = dynamicExamService.getExamConfig(examId);
      if (examConfig?.examPattern?.markingScheme) {
        const { correct, incorrect, unattempted } = examConfig.examPattern.markingScheme;
        return { correct, incorrect, unattempted };
      }
    }
    // Default marking scheme if no exam config found
    return { correct: 1, incorrect: -0.25, unattempted: 0 };
  };

  const markingScheme = getMarkingScheme();
  const [canTakeTest, setCanTakeTest] = useState(true);

  // Check plan limits when modal opens
  useEffect(() => {
    const checkPlanLimits = async () => {
      const userId = getUserId();
      if (userId) {
        try {
          const { canTake, limits } = await planLimitsService.canUserTakeTest(userId, testType, test);
          setPlanLimits(limits);
          setCanTakeTest(canTake);
        } catch (error) {
          console.error('Error checking plan limits:', error);
          setCanTakeTest(true); // Allow test if check fails
        }
      }
    };

    if (isOpen) {
      // Reset form state when modal opens
      setHasReadInstructions(false);
      setSelectedLanguage('en');
      checkPlanLimits();
    }
  }, [isOpen, getUserId, testType, test]);

  const handleStart = async () => {
    if (!hasReadInstructions) return;

    const userId = getUserId();
    if (!userId) return;

    // Check plan limits before starting
    const { canTake, limits, isRetry } = await planLimitsService.canUserTakeTest(userId, testType, test);
    
    if (!canTake) {
      setPlanLimits(limits);
      setShowUpgradeModal(true);
      return;
    }

    // Record test attempt when user actually starts the test
    await planLimitsService.recordTestAttempt(userId, test.name, 'ssc-cgl', testType, test.questions, isRetry);
    
    // Save language preference to session storage and localStorage
    sessionStorage.setItem('selectedLanguage', selectedLanguage);
    localStorage.setItem('preferredLanguage', selectedLanguage);
    
    onStart(selectedLanguage);
    onClose();
  };

  const getTestTypeInfo = () => {
    if (testType === 'mock') {
      return {
        icon: Trophy,
        color: 'from-emerald-500 to-green-600',
        bgColor: 'from-emerald-50 to-green-50',
        title: 'Mock Test',
        description: 'Full-length practice test simulating real exam conditions'
      };
    } else {
      return {
        icon: FileText,
        color: 'from-orange-500 to-red-600',
        bgColor: 'from-orange-50 to-red-50',
        title: 'Previous Year Question',
        description: 'Actual questions from previous year examinations'
      };
    }
  };

  const testInfo = getTestTypeInfo();
  const IconComponent = testInfo.icon;

  return (
    <>
      <ViewportDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Test Instructions"
        maxWidth="max-w-2xl"
      >

        <div className="space-y-6">
          {/* Test Overview */}
          <Card className={`border-0 shadow-lg bg-gradient-to-br ${testInfo.bgColor}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{test.name}</span>
                {test.isPremium && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse">
                    PREMIUM
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.duration} min</div>
                    {/* <div className="text-xs text-muted-foreground">Duration</div> */}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.questions} Questions</div>
                    {/* <div className="text-xs text-muted-foreground">Questions</div> */}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.subjects.length} Subjects</div>
                    {/* <div className="text-xs text-muted-foreground">Subjects</div> */}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* <Trophy className="w-4 h-4 text-muted-foreground" /> */}
                  {/* <div>
                    <div className="text-sm font-medium">{test.difficulty}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary" />
                <span>Select Language</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en" className="flex items-center space-x-2 cursor-pointer">
                    <span>English</span>
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hi" id="hi" />
                  <Label htmlFor="hi" className="flex items-center space-x-2 cursor-pointer">
                    <span>हिंदी</span>
                    <Badge variant="outline" className="text-xs">Hindi</Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center space-x-2 cursor-pointer">
                    <span>Both Languages</span>
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-primary" />
                <span>Important Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Time Management</div>
                    <div className="text-sm text-muted-foreground">
                      You have {test.duration} minutes to complete {test.questions} questions. 
                      Manage your time wisely.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Navigation</div>
                    <div className="text-sm text-muted-foreground">
                      Use the navigation panel to move between questions. 
                      You can review and change answers before submission.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Marking Scheme</div>
                    <div className="text-sm text-muted-foreground">
                      +{markingScheme.correct} mark{markingScheme.correct !== 1 ? 's' : ''} for correct answer, 
                      {markingScheme.incorrect < 0 ? ` ${markingScheme.incorrect} marks` : ' no negative marking'} for incorrect answer. 
                      {markingScheme.unattempted === 0 ? 'No negative marking' : `${markingScheme.unattempted} marks`} for unattempted questions.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Auto Submission</div>
                    <div className="text-sm text-muted-foreground">
                      Test will be automatically submitted when time expires. 
                      Make sure to save your answers regularly.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent Checkbox */}
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={hasReadInstructions}
                  onCheckedChange={(checked) => setHasReadInstructions(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  I have read and understood all the instructions above. I am ready to start the test and understand that:
                  <ul className="mt-2 ml-4 space-y-1 text-xs text-muted-foreground">
                    <li>• The test will be automatically submitted when time expires</li>
                    <li>• I cannot pause or restart the test once started</li>
                    <li>• My answers will be saved automatically</li>
                    <li>• I can navigate between questions freely</li>
                  </ul>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Membership Requirement Section */}
          {!canTakeTest && planLimits && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Lock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Membership Required</h3>
                    <p className="text-sm text-yellow-700">
                      {planLimits.planType === 'free' 
                        ? 'You need a Pro or Pro+ membership to take premium tests (Mock tests and PYQ).'
                        : `You've used all ${planLimits.maxTests} tests in your ${planLimits.planType} plan. Upgrade to Pro+ for unlimited access.`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowUpgradeModal(true)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    View Plans
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!hasReadInstructions || !canTakeTest}
              className={`flex-1 h-12 bg-gradient-to-r ${testInfo.color} hover:opacity-90 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {!canTakeTest 
                ? 'Membership Required' 
                : !hasReadInstructions 
                  ? 'Please read instructions first' 
                  : 'Start Test'
              }
            </Button>
          </div>
        </div>
      </ViewportDialog>

    {/* Upgrade Modal */}
    {showUpgradeModal && planLimits && (
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={(planId) => {
          setShowUpgradeModal(false);
          // Handle upgrade logic here
          window.location.href = '/profile';
        }}
        limits={planLimits}
        message={planLimits.planType === 'free' 
          ? 'You need a Pro or Pro+ membership to take premium tests (Mock tests and PYQ).'
          : `You've used all ${planLimits.maxTests} tests in your ${planLimits.planType} plan. Upgrade to Pro+ for unlimited access.`
        }
      />
    )}
    </>
  );
};
