import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Globe, Check } from "lucide-react";

interface LanguageSelectorProps {
  examName: string;
  testName: string;
  languages: string[];
  defaultLanguage: string;
  onLanguageSelect: (language: string) => void;
  testData?: any; // Add test data to show instructions
}

export const LanguageSelector = ({ 
  examName, 
  testName, 
  languages, 
  defaultLanguage, 
  onLanguageSelect,
  testData
}: LanguageSelectorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);

  const handleStart = () => {
    // Save language preference to localStorage
    localStorage.setItem('preferredLanguage', selectedLanguage);
    onLanguageSelect(selectedLanguage);
  };

  const languageLabels: { [key: string]: string } = {
    'english': 'English',
    'hindi': 'हिंदी (Hindi)',
    'bengali': 'বাংলা (Bengali)',
    'tamil': 'தமிழ் (Tamil)',
    'telugu': 'తెలుగు (Telugu)',
    'marathi': 'मराठी (Marathi)',
    'gujarati': 'ગુજરાતી (Gujarati)',
    'kannada': 'ಕನ್ನಡ (Kannada)',
    'malayalam': 'മലയാളം (Malayalam)',
    'punjabi': 'ਪੰਜਾਬੀ (Punjabi)',
    'odia': 'ଓଡ଼ିଆ (Odia)',
    'assamese': 'অসমীয়া (Assamese)'
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">{examName}</CardTitle>
          <p className="text-muted-foreground">{testName}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Select your preferred language for the test
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={selectedLanguage} 
            onValueChange={setSelectedLanguage}
            className="space-y-3"
          >
            {languages.map((language) => (
              <div key={language} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={language} id={language} />
                <Label 
                  htmlFor={language} 
                  className="flex-1 cursor-pointer text-base font-medium"
                >
                  {languageLabels[language] || language}
                </Label>
                {selectedLanguage === language && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </RadioGroup>
          
          {/* Test Instructions for Mock Tests */}
          {testData && testData.examInfo.testType === 'mock' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900 text-sm">Test Instructions</h3>
              <div className="space-y-2 text-xs text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Total Questions:</strong> {testData.examInfo.totalQuestions}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Duration:</strong> {Math.round(testData.questions.reduce((total: number, q: any) => total + q.duration, 0))} minutes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Total Marks:</strong> {testData.questions.reduce((total: number, q: any) => total + q.marks, 0)}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Negative Marking:</strong> {testData.questions[0]?.negativeMarks || 0.25} marks deducted for each wrong answer</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Navigation:</strong> Use Next/Previous buttons or question grid to navigate</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Flagging:</strong> Flag questions for review using the flag icon</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium">•</span>
                  <span><strong>Submission:</strong> Test auto-submits when time ends or click Submit</span>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleStart} 
            className="w-full"
            size="lg"
          >
            Start Test
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            You can change this preference anytime in your profile settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
