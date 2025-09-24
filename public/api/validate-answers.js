// Secure Answer Validation API Endpoint
// This endpoint validates answers without exposing correct answers

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { examId, sectionId, testId, userAnswers, questionIds, timestamp } = req.body;
    
    if (!examId || !sectionId || !testId || !userAnswers || !questionIds) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate timestamp to prevent replay attacks
    if (!timestamp || Date.now() - timestamp > 300000) { // 5 minutes
      return res.status(400).json({ error: 'Invalid or expired request' });
    }

    // Load correct answers from JSON file
    const fs = require('fs');
    const path = require('path');
    
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'questions', examId, sectionId, `${testId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const questions = jsonData.questions || [];

    // Validate answers
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let totalMarks = 0;
    let obtainedMarks = 0;

    questions.forEach((question, index) => {
      const questionMarks = question.marks || 1;
      const negativeMarks = question.negativeMarks || 0.25;
      totalMarks += questionMarks;

      if (userAnswers[index] !== undefined) {
        if (userAnswers[index] === question.correct) {
          correctAnswers++;
          obtainedMarks += questionMarks;
        } else {
          incorrectAnswers++;
          obtainedMarks -= negativeMarks;
        }
      }
    });

    const score = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

    // Set cache headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
      correctAnswers,
      incorrectAnswers,
      score: Math.max(0, score), // Ensure score is not negative
      totalMarks,
      obtainedMarks: Math.max(0, obtainedMarks), // Ensure obtained marks is not negative
      _security: {
        validated: true,
        timestamp: Date.now(),
        expires: Date.now() + 300000 // 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error in validate-answers API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
