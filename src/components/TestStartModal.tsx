import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Info
} from 'lucide-react';

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
}

export const TestStartModal: React.FC<TestStartModalProps> = ({
  isOpen,
  onClose,
  onStart,
  test,
  testType
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hasReadInstructions, setHasReadInstructions] = useState(false);

  const handleStart = () => {
    if (hasReadInstructions) {
      onStart(selectedLanguage);
      onClose();
    }
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-r ${testInfo.color} rounded-lg text-white`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <span>Test Instructions & Settings</span>
          </DialogTitle>
        </DialogHeader>

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
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.questions}</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.subjects.length}</div>
                    <div className="text-xs text-muted-foreground">Subjects</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{test.difficulty}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
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
                      +1 mark for correct answer, -0.25 marks for incorrect answer. 
                      No negative marking for unattempted questions.
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
              disabled={!hasReadInstructions}
              className={`flex-1 h-12 bg-gradient-to-r ${testInfo.color} hover:opacity-90 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {hasReadInstructions ? 'Start Test' : 'Please read instructions first'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
