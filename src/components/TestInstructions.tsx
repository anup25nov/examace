import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { TestData } from '@/lib/secureDynamicQuestionLoader';
import { dynamicExamService } from '@/lib/dynamicExamService';

interface TestInstructionsProps {
  examId: string;
  testType: string;
  testId: string;
  testData: TestData;
  onStartTest: (selectedLanguage: string) => void;
}

const TestInstructions: React.FC<TestInstructionsProps> = ({
  examId,
  testType,
  testId,
  testData,
  onStartTest
}) => {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState(testData.examInfo.defaultLanguage);

  // Get marking scheme based on exam type
  const getMarkingScheme = () => {
    const examConfig = dynamicExamService.getExamConfig(examId);
    if (examConfig?.examPattern?.markingScheme) {
      const { correct, incorrect, unattempted } = examConfig.examPattern.markingScheme;
      return { correct, incorrect, unattempted };
    }
    // Default marking scheme if no exam config found
    return { correct: 1, incorrect: -0.25, unattempted: 0 };
  };

  const markingScheme = getMarkingScheme();

  const instructions = [
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: "Time Management",
      description: "Each question has a specific time limit. Manage your time wisely to attempt all questions."
    },
    {
      icon: <Target className="w-5 h-5 text-green-600" />,
      title: "Scoring System",
      description: "Correct answers earn positive marks, while incorrect answers may have negative marking."
    },
    {
      icon: <BookOpen className="w-5 h-5 text-purple-600" />,
      title: "Question Navigation",
      description: "You can navigate between questions using the question numbers or navigation buttons."
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-orange-600" />,
      title: "Submission",
      description: "Review your answers before submitting. Once submitted, you cannot change your answers."
    }
  ];

  const handleStartTest = () => {
    // Save language preference
    localStorage.setItem('preferredLanguage', selectedLanguage);
    // Also save in session storage for immediate use
    sessionStorage.setItem('selectedLanguage', selectedLanguage);
    onStartTest(selectedLanguage);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/exam/${examId}`)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src="/logos/alternate_image.png"
                alt="Step2Sarkari Logo" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-foreground uppercase">{examId}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Test Info */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-primary" />
                <span>{testData.examInfo.testName}</span>
                <Badge variant="secondary" className="ml-auto">
                  {testData.examInfo.totalQuestions} Questions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Duration: {testData.examInfo.duration} minutes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Marks: {testData.questions.reduce((total, q) => total + q.marks, 0)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Negative Marking: {testData.questions.some(q => q.negativeMarks > 0) ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Language</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['en', 'hi'].map((language) => (
                  <Button
                    key={language}
                    variant={selectedLanguage === language ? "default" : "outline"}
                    onClick={() => setSelectedLanguage(language)}
                    className="h-12 text-left justify-start"
                  >
                    <span className="capitalize">{language}</span>
                    {selectedLanguage === language && (
                      <CheckCircle className="w-4 h-4 ml-auto" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Marking Scheme */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Marking Scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Correct Answer: +{markingScheme.correct} mark{markingScheme.correct !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-muted-foreground">
                    Incorrect Answer: {markingScheme.incorrect < 0 ? `${markingScheme.incorrect} marks` : 'No negative marking'}
                  </span>
                </div>
              </div>
              
              {/* Additional marking scheme details */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Marking Details:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>• Each question carries {markingScheme.correct} mark{markingScheme.correct !== 1 ? 's' : ''}</p>
                  <p>• Wrong answer will {markingScheme.incorrect < 0 ? `deduct ${Math.abs(markingScheme.incorrect)} mark${Math.abs(markingScheme.incorrect) !== 1 ? 's' : ''}` : 'not deduct any marks'}</p>
                  <p>• Unattempted questions carry {markingScheme.unattempted} mark{markingScheme.unattempted !== 1 ? 's' : ''}</p>
                  <p>• Total marks: {testData.questions.reduce((total, q) => total + (q.marks || markingScheme.correct), 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {instruction.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {instruction.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {instruction.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="mb-8 border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                <span>Important Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-orange-700">
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Ensure you have a stable internet connection throughout the test.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Do not refresh the page or navigate away during the test.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>Your progress will be saved automatically.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>You can review and change your answers before final submission.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate(`/exam/${examId}`)}
              className="px-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={handleStartTest}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              Start Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
