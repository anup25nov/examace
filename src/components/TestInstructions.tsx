import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Target, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { TestData } from '@/lib/dynamicQuestionLoader';

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
                    Duration: {Math.round(testData.questions.reduce((total, q) => total + q.duration, 0))} minutes
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
                    Negative Marking: Yes
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
