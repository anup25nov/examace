// API route for submitting question reports
// This is a simple implementation for Vite - in production, you'd use a proper backend

import { QuestionReportService } from '@/lib/questionReportService';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { examId, examType, testId, questionId, questionNumber, issueType, issueDescription } = req.body;

    // Validate required fields
    if (!examId || !examType || !testId || !questionId || !questionNumber || !issueType || !issueDescription) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Submit the report
    const result = await QuestionReportService.submitReport({
      examId,
      examType,
      testId,
      questionId,
      questionNumber: parseInt(questionNumber),
      issueType,
      issueDescription
    });

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Report submitted successfully',
        reportId: result.reportId 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error || 'Failed to submit report' 
      });
    }

  } catch (error) {
    console.error('Error in report-question API:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
