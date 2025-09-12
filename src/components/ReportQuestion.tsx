import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Flag, Send, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QuestionReportService } from '@/lib/questionReportService';

interface ReportQuestionProps {
  examId: string;
  examType: string;
  testId: string;
  questionId: string;
  questionNumber: number;
  onReportSubmitted?: () => void;
}

interface ReportData {
  issueType: string;
  issueDescription: string;
}

const ISSUE_TYPES = [
  { value: 'question_text', label: 'Mistake in Question Text', description: 'The question text is unclear, incorrect, or has errors' },
  { value: 'options', label: 'Mistake in Options', description: 'One or more answer options are incorrect or unclear' },
  { value: 'explanation', label: 'Mistake in Explanation', description: 'The explanation or solution is incorrect or unclear' },
  { value: 'answer', label: 'Wrong Correct Answer', description: 'The marked correct answer is incorrect' },
  { value: 'image', label: 'Issue with Image', description: 'Question or explanation image is missing, broken, or incorrect' },
  { value: 'other', label: 'Other Issue', description: 'Any other problem with this question' }
];

export const ReportQuestion: React.FC<ReportQuestionProps> = ({
  examId,
  examType,
  testId,
  questionId,
  questionNumber,
  onReportSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    issueType: '',
    issueDescription: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!reportData.issueType || !reportData.issueDescription.trim()) {
      setErrorMessage('Please select an issue type and provide a description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await QuestionReportService.submitReport({
        examId,
        examType,
        testId,
        questionId,
        questionNumber,
        issueType: reportData.issueType,
        issueDescription: reportData.issueDescription.trim()
      });

      if (result.success) {
        setSubmitStatus('success');
        setReportData({ issueType: '', issueDescription: '' });
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus('idle');
          onReportSubmitted?.();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to submit report');
      }

    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitStatus === 'success') return; // Don't close if success message is showing
    
    setIsOpen(false);
    setReportData({ issueType: '', issueDescription: '' });
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const selectedIssueType = ISSUE_TYPES.find(type => type.value === reportData.issueType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
        >
          <Flag className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span>Report Question Issue</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p><strong>Question:</strong> #{questionNumber}</p>
            <p><strong>Exam:</strong> {examId.toUpperCase()} - {examType.toUpperCase()}</p>
            <p><strong>Test:</strong> {testId}</p>
          </div>

          {/* Issue Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="issue-type">What's the issue?</Label>
            <Select
              value={reportData.issueType}
              onValueChange={(value) => setReportData(prev => ({ ...prev, issueType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the type of issue" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issue-description">
              Describe the issue in detail
              {selectedIssueType && (
                <span className="text-xs text-muted-foreground block">
                  {selectedIssueType.description}
                </span>
              )}
            </Label>
            <Textarea
              id="issue-description"
              placeholder="Please provide specific details about the issue you found..."
              value={reportData.issueDescription}
              onChange={(e) => setReportData(prev => ({ ...prev, issueDescription: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {submitStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Thank you! Your report has been submitted successfully. We'll review it and take appropriate action.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || submitStatus === 'success'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success' || !reportData.issueType || !reportData.issueDescription.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportQuestion;
