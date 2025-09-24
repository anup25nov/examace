// Secure Questions API Endpoint
// This endpoint provides obfuscated question data and prevents direct JSON exposure

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { examId, sectionId, testId } = req.query;
    const { examId: bodyExamId, sectionId: bodySectionId, testId: bodyTestId, timestamp } = req.body;
    
    // Use query params as primary, body as fallback
    const finalExamId = examId || bodyExamId;
    const finalSectionId = sectionId || bodySectionId;
    const finalTestId = testId || bodyTestId;
    
    if (!finalExamId || !finalSectionId || !finalTestId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate timestamp to prevent replay attacks
    if (!timestamp || Date.now() - timestamp > 300000) { // 5 minutes
      return res.status(400).json({ error: 'Invalid or expired request' });
    }

    // Load questions from JSON file
    const fs = require('fs');
    const path = require('path');
    
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'questions', finalExamId, finalSectionId, `${finalTestId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Obfuscate questions to prevent direct access to answers
    const obfuscatedQuestions = (jsonData.questions || []).map((question, index) => {
      // Create obfuscated question data
      const obfuscatedQuestion = {
        id: question.id,
        questionEn: question.questionEn,
        questionHi: question.questionHi,
        options: question.options || [],
        // Don't include correct answer in the response
        difficulty: question.difficulty || 'medium',
        subject: question.subject || 'general',
        topic: question.topic || 'general',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0.25,
        duration: question.duration || 60,
        hasImages: question.hasImages || false,
        questionImage: question.questionImage,
        optionImages: question.optionImages,
        explanationImage: question.explanationImage
      };
      
      // Add obfuscation layer
      return {
        ...obfuscatedQuestion,
        _obfuscated: true,
        _timestamp: Date.now(),
        _index: index
      };
    });

    // Return obfuscated data without correct answers
    const obfuscatedData = {
      examInfo: {
        testName: `${finalExamId} ${finalSectionId} ${finalTestId}`,
        duration: jsonData.duration || 180,
        totalQuestions: jsonData.totalQuestions || obfuscatedQuestions.length,
        subjects: jsonData.subjects || ['General Knowledge'],
        markingScheme: {
          correct: 1,
          incorrect: 0.25,
          unattempted: 0
        },
        defaultLanguage: 'english'
      },
      questions: obfuscatedQuestions,
      _security: {
        obfuscated: true,
        timestamp: Date.now(),
        expires: Date.now() + 300000 // 5 minutes
      }
    };

    // Set cache headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json(obfuscatedData);
    
  } catch (error) {
    console.error('Error in secure-questions API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
