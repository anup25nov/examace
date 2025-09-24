// Security Configuration
// This file contains security settings for the application

export const securityConfig = {
  // Enable/disable security features
  enableQuestionSecurity: true,
  enableAuthentication: true,
  enablePremiumAccess: true,
  
  // Security settings
  obfuscationKey: 'examace_secure_key_2024', // In production, use environment variable
  cacheTimeout: 30 * 60 * 1000, // 30 minutes
  maxRetries: 3,
  
  // API endpoints
  secureQuestionsEndpoint: '/api/secure-questions',
  supabaseFunctionEndpoint: 'get-test-questions',
  
  // Security headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  },
  
  // Question access rules
  accessRules: {
    // Free tests - no authentication required
    freeTests: ['practice'],
    
    // Premium tests - authentication and membership required
    premiumTests: ['mock', 'pyq'],
    
    // Admin tests - admin role required
    adminTests: ['admin']
  },
  
  // Rate limiting
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000
  },
  
  // Content protection
  contentProtection: {
    disableRightClick: true,
    disableTextSelection: true,
    disablePrintScreen: true,
    disableDevTools: false, // Set to true in production
    watermarkText: 'Step 2 Sarkari - Confidential'
  }
};

// Development vs Production settings
export const getSecurityConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    ...securityConfig,
    enableQuestionSecurity: isDevelopment ? false : true, // Disable in development for easier debugging
    enableAuthentication: true,
    obfuscationKey: isDevelopment ? 'dev_key' : process.env.OBFUSCATION_KEY || securityConfig.obfuscationKey,
    contentProtection: {
      ...securityConfig.contentProtection,
      disableDevTools: isDevelopment ? false : true
    }
  };
};
