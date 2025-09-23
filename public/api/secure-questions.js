// This is a fallback API for development when Supabase functions are not available
// In production, this should be replaced with proper server-side authentication

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Simple authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  // In production, verify JWT token here
  next();
};

// Obfuscation key (should be from environment in production)
const OBFUSCATION_KEY = 'examace_secure_key_2024';

// Simple obfuscation function
function obfuscateData(data) {
  const jsonString = JSON.stringify(data);
  const encoded = Buffer.from(jsonString).toString('base64');
  let obfuscated = '';
  for (let i = 0; i < encoded.length; i++) {
    obfuscated += String.fromCharCode(encoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length));
  }
  return Buffer.from(obfuscated).toString('base64');
}

// Load and obfuscate questions
app.post('/api/secure-questions/:examId/:sectionId/:testId', authenticate, (req, res) => {
  try {
    const { examId, sectionId, testId } = req.params;
    const { timestamp, nonce } = req.body;

    // Validate request
    if (!timestamp || !nonce) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Check if request is not too old (5 minutes)
    if (Date.now() - timestamp > 300000) {
      return res.status(400).json({ error: 'Request expired' });
    }

    // Load questions from JSON file
    const filePath = path.join(__dirname, '..', 'src', 'data', 'questions', examId, sectionId, `${testId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const questionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Obfuscate the data
    const obfuscatedData = obfuscateData(questionData);
    
    // Return obfuscated data
    res.send(obfuscatedData);

  } catch (error) {
    console.error('Error loading secure questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Secure questions API running on port ${PORT}`);
});

module.exports = app;
