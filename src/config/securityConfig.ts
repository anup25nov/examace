// Security Configuration
// This file contains security settings for the application

export const securityConfig = {
  // Enable/disable security features
  enableQuestionSecurity: true,
  enableAuthentication: true,
  enablePremiumAccess: true,
  
  // Security settings
  obfuscationKey: import.meta.env.VITE_OBFUSCATION_KEY || 'examace_default_key_for_development_only',
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
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.supabase.co;"
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
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Generate obfuscation key if missing
  const getObfuscationKey = () => {
    if (import.meta.env.VITE_OBFUSCATION_KEY) {
      return import.meta.env.VITE_OBFUSCATION_KEY;
    }
    
    if (isDevelopment) {
      console.warn('⚠️ VITE_OBFUSCATION_KEY not set, using development key');
      return 'examace_dev_key_development_only_not_for_production';
    }
    
    // For production, generate a secure key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'examace_prod_key_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.warn('⚠️ VITE_OBFUSCATION_KEY not set in production, generated temporary key');
    return result;
  };
  
  return {
    ...securityConfig,
    enableQuestionSecurity: isDevelopment ? false : true, // Disable in development for easier debugging
    enableAuthentication: true,
    obfuscationKey: getObfuscationKey(),
    contentProtection: {
      ...securityConfig.contentProtection,
      disableDevTools: isDevelopment ? false : true
    },
    // Production-specific security enhancements
    rateLimiting: {
      ...securityConfig.rateLimiting,
      maxRequestsPerMinute: isProduction ? 30 : 60, // Stricter limits in production
      maxRequestsPerHour: isProduction ? 500 : 1000,
      maxRequestsPerDay: isProduction ? 5000 : 10000
    }
  };
};
