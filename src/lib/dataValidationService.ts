import { errorHandlingService } from './errorHandlingService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'uuid' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => { valid: boolean; message?: string };
}

export class DataValidationService {
  private static instance: DataValidationService;

  public static getInstance(): DataValidationService {
    if (!DataValidationService.instance) {
      DataValidationService.instance = new DataValidationService();
    }
    return DataValidationService.instance;
  }

  /**
   * Validate data against rules
   */
  validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      const result = this.validateField(value, rule);
      
      if (!result.valid) {
        errors.push(result.message || `Invalid ${rule.field}`);
      }
      
      if (result.warning) {
        warnings.push(result.warning);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate test submission data
   */
  validateTestSubmission(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'examId', required: true, type: 'string', minLength: 1 },
      { field: 'testType', required: true, type: 'string', custom: (value) => 
        ['mock', 'pyq', 'practice'].includes(value) 
          ? { valid: true } 
          : { valid: false, message: 'Test type must be mock, pyq, or practice' }
      },
      { field: 'testId', required: true, type: 'string', minLength: 1 },
      { field: 'score', required: true, type: 'number', min: 0, max: 100 },
      { field: 'totalQuestions', required: true, type: 'number', min: 1 },
      { field: 'correctAnswers', required: true, type: 'number', min: 0 },
      { field: 'timeTaken', required: true, type: 'number', min: 0 },
      { field: 'answers', required: true, type: 'object' }
    ];

    return this.validate(data, rules);
  }

  /**
   * Validate payment data
   */
  validatePaymentData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'userId', required: true, type: 'uuid' },
      { field: 'planId', required: true, type: 'string', custom: (value) =>
        ['pro', 'pro_plus'].includes(value)
          ? { valid: true }
          : { valid: false, message: 'Plan ID must be pro or pro_plus' }
      },
      { field: 'amount', required: true, type: 'number', min: 0 },
      { field: 'currency', required: true, type: 'string', custom: (value) =>
        value === 'INR'
          ? { valid: true }
          : { valid: false, message: 'Currency must be INR' }
      }
    ];

    return this.validate(data, rules);
  }

  /**
   * Validate user profile data
   */
  validateUserProfile(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'phone', required: true, type: 'phone' },
      { field: 'email', type: 'email' },
      { field: 'membership_plan', type: 'string', custom: (value) =>
        !value || ['free', 'pro', 'pro_plus'].includes(value)
          ? { valid: true }
          : { valid: false, message: 'Invalid membership plan' }
      }
    ];

    return this.validate(data, rules);
  }

  /**
   * Validate referral data
   */
  validateReferralData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'referralCode', required: true, type: 'string', minLength: 6, maxLength: 20 },
      { field: 'userId', required: true, type: 'uuid' }
    ];

    return this.validate(data, rules);
  }

  /**
   * Validate test state data
   */
  validateTestState(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'examId', required: true, type: 'string' },
      { field: 'sectionId', required: true, type: 'string' },
      { field: 'testType', required: true, type: 'string' },
      { field: 'testId', required: true, type: 'string' },
      { field: 'currentQuestion', required: true, type: 'number', min: 0 },
      { field: 'answers', required: true, type: 'object' },
      { field: 'timeLeft', required: true, type: 'number', min: 0 },
      { field: 'startTime', required: true, type: 'number', min: 0 },
      { field: 'flagged', required: true, type: 'array' },
      { field: 'selectedLanguage', required: true, type: 'string' },
      { field: 'isCompleted', required: true, type: 'boolean' }
    ];

    return this.validate(data, rules);
  }

  /**
   * Validate individual field
   */
  private validateField(value: any, rule: ValidationRule): { valid: boolean; message?: string; warning?: string } {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      return { valid: false, message: `${rule.field} is required` };
    }

    // Skip validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return { valid: true };
    }

    // Check type
    if (rule.type && !this.checkType(value, rule.type)) {
      return { valid: false, message: `${rule.field} must be of type ${rule.type}` };
    }

    // Check string length
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return { valid: false, message: `${rule.field} must be at least ${rule.minLength} characters` };
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { valid: false, message: `${rule.field} must be no more than ${rule.maxLength} characters` };
      }
    }

    // Check number range
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return { valid: false, message: `${rule.field} must be at least ${rule.min}` };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { valid: false, message: `${rule.field} must be no more than ${rule.max}` };
      }
    }

    // Check pattern
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return { valid: false, message: `${rule.field} format is invalid` };
    }

    // Check custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (!result.valid) {
        return { valid: false, message: result.message };
      }
    }

    return { valid: true };
  }

  /**
   * Check if value matches expected type
   */
  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'email':
        return typeof value === 'string' && this.isValidEmail(value);
      case 'phone':
        return typeof value === 'string' && this.isValidPhone(value);
      case 'uuid':
        return typeof value === 'string' && this.isValidUUID(value);
      default:
        return true;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Indian)
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Validate and sanitize data
   */
  validateAndSanitize(data: any, rules: ValidationRule[]): { data: any; result: ValidationResult } {
    const sanitizedData = this.sanitizeInput(data);
    const result = this.validate(sanitizedData, rules);
    
    return {
      data: sanitizedData,
      result
    };
  }

  /**
   * Create validation rules for API endpoints
   */
  createApiValidationRules(endpoint: string): ValidationRule[] {
    const rulesMap: Record<string, ValidationRule[]> = {
      'test-submission': [
        { field: 'examId', required: true, type: 'string' },
        { field: 'testType', required: true, type: 'string' },
        { field: 'testId', required: true, type: 'string' },
        { field: 'score', required: true, type: 'number', min: 0, max: 100 },
        { field: 'totalQuestions', required: true, type: 'number', min: 1 },
        { field: 'correctAnswers', required: true, type: 'number', min: 0 },
        { field: 'timeTaken', required: true, type: 'number', min: 0 }
      ],
      'payment-create': [
        { field: 'userId', required: true, type: 'uuid' },
        { field: 'planId', required: true, type: 'string' },
        { field: 'amount', required: true, type: 'number', min: 0 }
      ],
      'user-profile': [
        { field: 'phone', required: true, type: 'phone' },
        { field: 'email', type: 'email' }
      ],
      'referral-apply': [
        { field: 'referralCode', required: true, type: 'string', minLength: 6, maxLength: 20 },
        { field: 'userId', required: true, type: 'uuid' }
      ]
    };

    return rulesMap[endpoint] || [];
  }

  /**
   * Validate API request
   */
  validateApiRequest(endpoint: string, data: any): ValidationResult {
    const rules = this.createApiValidationRules(endpoint);
    return this.validate(data, rules);
  }
}

export const dataValidationService = DataValidationService.getInstance();
