import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Loader2,
  Flag,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QuestionReportModalProps {
  examId: string;
  testType: string;
  testId: string;
  questionId: string;
  questionText?: string;
  children?: React.ReactNode;
}

const reportTypes = [
  { value: 'wrong_question', label: 'Wrong Question', description: 'The question is incorrect or unclear' },
  { value: 'wrong_answer', label: 'Wrong Answer', description: 'The correct answer is wrong' },
  { value: 'wrong_option', label: 'Wrong Option', description: 'One or more options are incorrect' },
  { value: 'wrong_explanation', label: 'Wrong Explanation', description: 'The explanation is incorrect or unclear' }
];

export const QuestionReportModal: React.FC<QuestionReportModalProps> = ({
  examId,
  testType,
  testId,
  questionId,
  questionText,
  children
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to report questions');
      return;
    }

    if (!selectedReportType) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user has already reported this question (only check for pending reports)
      const { data: existingReports, error: checkError } = await supabase
        .from('question_reports' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('exam_id', examId)
        .eq('test_type', testType)
        .eq('test_id', testId)
        .eq('question_id', questionId)
        .eq('status', 'pending');

      if (checkError) {
        console.error('Error checking existing reports:', checkError);
        setError('Failed to check existing reports. Please try again.');
        return;
      }

      if (existingReports && existingReports.length > 0) {
        setError('You have a pending report for this question. Please wait for admin review before reporting again.');
        setLoading(false);
        return;
      }

      const { error: reportError } = await supabase
        .from('question_reports' as any)
        .insert({
          user_id: user.id,
          exam_id: examId,
          test_type: testType,
          test_id: testId,
          question_id: questionId,
          report_type: selectedReportType,
          description: description.trim() || null
        });

      if (reportError) {
        console.error('Error reporting question:', reportError);
        setError('Failed to submit report. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setSelectedReportType('');
        setDescription('');
      }, 2000);
    } catch (error: any) {
      console.error('Error reporting question:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
      setSuccess(false);
      setSelectedReportType('');
      setDescription('');
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Flag className="w-4 h-4 mr-2" />
            Report Question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Report Question Issue</span>
          </DialogTitle>
          <DialogDescription>
            Help us improve by reporting any issues with this question
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">Report Submitted!</h3>
            <p className="text-gray-600">Thank you for your feedback. We'll review it soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Preview */}
            {questionText && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-600">Question Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-800 line-clamp-3">{questionText}</p>
                </CardContent>
              </Card>
            )}

            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">What's the issue?</Label>
              <div className="grid grid-cols-1 gap-3">
                {reportTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReportType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReportType(type.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedReportType === type.value
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedReportType === type.value && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Additional Details (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Please provide more details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedReportType}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuestionReportModal;