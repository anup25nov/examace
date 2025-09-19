/**
 * Security utilities for protecting sensitive data
 */

/**
 * Sanitize sensitive data for logging
 */
export const sanitizeForLogging = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password',
    'token',
    'key',
    'secret',
    'api_key',
    'auth_token',
    'payment_id',
    'order_id',
    'razorpay_payment_id',
    'razorpay_order_id',
    'razorpay_signature',
    'otp',
    'phone',
    'email',
    'upi_id',
    'account_number',
    'card_number',
    'cvv'
  ];

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Safe console.log that sanitizes sensitive data
 */
export const safeLog = (message: string, data?: any) => {
  // Only log in development mode and when explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.VITE_DEBUG_LOGGING === 'true') {
    if (data) {
      console.log(message, sanitizeForLogging(data));
    } else {
      console.log(message);
    }
  }
};

/**
 * Mask sensitive strings (like phone numbers, emails)
 */
export const maskSensitiveString = (str: string, type: 'phone' | 'email' | 'generic' = 'generic'): string => {
  if (!str) return str;

  switch (type) {
    case 'phone':
      // Show first 2 and last 2 digits: +91XXXXXX44
      if (str.length > 4) {
        return str.slice(0, 3) + 'X'.repeat(str.length - 5) + str.slice(-2);
      }
      return 'X'.repeat(str.length);
    
    case 'email':
      // Show first char and domain: a***@example.com
      const [local, domain] = str.split('@');
      if (local && domain) {
        return local[0] + '*'.repeat(Math.max(0, local.length - 1)) + '@' + domain;
      }
      return str;
    
    case 'generic':
    default:
      // Show first and last char: a***z
      if (str.length > 2) {
        return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
      }
      return '*'.repeat(str.length);
  }
};

/**
 * Environment check utilities
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         import.meta.env.DEV ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};
