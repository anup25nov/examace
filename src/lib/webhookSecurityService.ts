import crypto from 'crypto';

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
  payload?: any;
}

export interface WebhookConfig {
  razorpayWebhookSecret: string;
  allowedIps?: string[];
  maxTimestampAge: number; // in seconds
}

export class WebhookSecurityService {
  private static instance: WebhookSecurityService;
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  public static getInstance(config?: WebhookConfig): WebhookSecurityService {
    if (!WebhookSecurityService.instance) {
      if (!config) {
        throw new Error('WebhookSecurityService requires configuration on first initialization');
      }
      WebhookSecurityService.instance = new WebhookSecurityService(config);
    }
    return WebhookSecurityService.instance;
  }

  /**
   * Validate Razorpay webhook signature
   */
  validateRazorpayWebhook(
    payload: string,
    signature: string,
    timestamp: string
  ): WebhookValidationResult {
    try {
      // Check timestamp freshness
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      
      if (currentTime - webhookTime > this.config.maxTimestampAge) {
        return {
          isValid: false,
          error: 'Webhook timestamp is too old'
        };
      }

      // Verify signature
      const expectedSignature = this.generateRazorpaySignature(payload, timestamp);
      
      if (!this.secureCompare(signature, expectedSignature)) {
        return {
          isValid: false,
          error: 'Invalid webhook signature'
        };
      }

      // Parse and validate payload
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (error) {
        return {
          isValid: false,
          error: 'Invalid JSON payload'
        };
      }

      // Validate required fields
      if (!parsedPayload.event || !parsedPayload.payload) {
        return {
          isValid: false,
          error: 'Missing required webhook fields'
        };
      }

      return {
        isValid: true,
        payload: parsedPayload
      };

    } catch (error: any) {
      console.error('Webhook validation error:', error);
      return {
        isValid: false,
        error: 'Webhook validation failed'
      };
    }
  }

  /**
   * Validate webhook IP address
   */
  validateWebhookIP(clientIP: string): boolean {
    if (!this.config.allowedIps || this.config.allowedIps.length === 0) {
      return true; // No IP restrictions
    }

    return this.config.allowedIps.includes(clientIP);
  }

  /**
   * Validate webhook headers
   */
  validateWebhookHeaders(headers: Record<string, string>): WebhookValidationResult {
    const requiredHeaders = ['x-razorpay-signature', 'x-razorpay-timestamp'];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        return {
          isValid: false,
          error: `Missing required header: ${header}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Comprehensive webhook validation
   */
  validateWebhook(
    payload: string,
    headers: Record<string, string>,
    clientIP?: string
  ): WebhookValidationResult {
    try {
      // Validate headers
      const headerValidation = this.validateWebhookHeaders(headers);
      if (!headerValidation.isValid) {
        return headerValidation;
      }

      // Validate IP if provided
      if (clientIP && !this.validateWebhookIP(clientIP)) {
        return {
          isValid: false,
          error: 'Webhook IP not allowed'
        };
      }

      // Validate signature and payload
      const signature = headers['x-razorpay-signature'];
      const timestamp = headers['x-razorpay-timestamp'];
      
      return this.validateRazorpayWebhook(payload, signature, timestamp);

    } catch (error: any) {
      console.error('Comprehensive webhook validation error:', error);
      return {
        isValid: false,
        error: 'Webhook validation failed'
      };
    }
  }

  /**
   * Generate Razorpay webhook signature
   */
  private generateRazorpaySignature(payload: string, timestamp: string): string {
    const message = `${timestamp}|${payload}`;
    return crypto
      .createHmac('sha256', this.config.razorpayWebhookSecret)
      .update(message)
      .digest('hex');
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Log webhook validation attempts for security monitoring
   */
  logWebhookValidation(
    isValid: boolean,
    clientIP?: string,
    error?: string,
    eventType?: string
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      isValid,
      clientIP,
      error,
      eventType,
      userAgent: 'webhook-validator'
    };

    // In production, this should be sent to a proper logging service
    console.log('Webhook validation log:', logData);
  }

  /**
   * Rate limiting for webhook endpoints
   */
  private webhookAttempts = new Map<string, { count: number; lastAttempt: number }>();

  checkWebhookRateLimit(clientIP: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `webhook_${clientIP}`;
    
    const attempts = this.webhookAttempts.get(key);
    
    if (!attempts) {
      this.webhookAttempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > windowMs) {
      this.webhookAttempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if under limit
    if (attempts.count < maxAttempts) {
      attempts.count++;
      attempts.lastAttempt = now;
      return true;
    }

    return false;
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimitEntries(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    for (const [key, attempts] of this.webhookAttempts.entries()) {
      if (now - attempts.lastAttempt > windowMs) {
        this.webhookAttempts.delete(key);
      }
    }
  }
}

// Initialize with default config
export const webhookSecurityService = WebhookSecurityService.getInstance({
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  allowedIps: process.env.WEBHOOK_ALLOWED_IPS?.split(',') || [],
  maxTimestampAge: 300 // 5 minutes
});
