import { supabase } from '@/integrations/supabase/client';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  rateLimitWindow: number; // in minutes
  rateLimitMax: number; // max requests per window
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface SecurityAuditLog {
  userId: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private rateLimitCache: Map<string, { count: number; resetTime: number }> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  private constructor() {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      sessionTimeout: 24 * 60, // 24 hours
      rateLimitWindow: 15, // 15 minutes
      rateLimitMax: 100 // 100 requests per 15 minutes
    };
  }

  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Check rate limit for user/IP
   */
  checkRateLimit(identifier: string): RateLimitInfo {
    const now = Date.now();
    const windowMs = this.config.rateLimitWindow * 60 * 1000;
    const cached = this.rateLimitCache.get(identifier);

    if (!cached || now > cached.resetTime) {
      // Reset or create new entry
      this.rateLimitCache.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });

      return {
        allowed: true,
        remaining: this.config.rateLimitMax - 1,
        resetTime: now + windowMs
      };
    }

    if (cached.count >= this.config.rateLimitMax) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: cached.resetTime
      };
    }

    // Increment count
    cached.count++;
    this.rateLimitCache.set(identifier, cached);

    return {
      allowed: true,
      remaining: this.config.rateLimitMax - cached.count,
      resetTime: cached.resetTime
    };
  }

  /**
   * Check if user is locked out due to failed login attempts
   */
  isUserLockedOut(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId);
    if (!attempts) return false;

    const now = Date.now();
    const lockoutMs = this.config.lockoutDuration * 60 * 1000;

    if (now - attempts.lastAttempt < lockoutMs) {
      return attempts.count >= this.config.maxLoginAttempts;
    }

    // Reset if lockout period has passed
    this.loginAttempts.delete(userId);
    return false;
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(userId: string): void {
    const attempts = this.loginAttempts.get(userId) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    this.loginAttempts.set(userId, attempts);
  }

  /**
   * Clear failed login attempts (on successful login)
   */
  clearFailedLogins(userId: string): void {
    this.loginAttempts.delete(userId);
  }

  /**
   * Validate user session
   */
  async validateSession(): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { valid: false, error: error.message };
      }

      if (!session) {
        return { valid: false, error: 'No active session' };
      }

      // Check if session is expired
      const now = Date.now() / 1000;
      if (session.expires_at && session.expires_at < now) {
        return { valid: false, error: 'Session expired' };
      }

      return { valid: true, user: session.user };

    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Check if user has required permissions
   */
  async checkPermissions(
    userId: string,
    resource: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, membership_plan, membership_expiry')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { allowed: false, reason: 'Failed to verify user permissions' };
      }

      // Admin users have all permissions
      if (profile.is_admin) {
        return { allowed: true };
      }

      // Check membership status
      const isMembershipActive = profile.membership_expiry && 
        new Date(profile.membership_expiry) > new Date();

      // Define permission matrix
      const permissions = {
        'test:take': {
          free: ['practice'],
          basic: ['practice', 'pyq'],
          premium: ['practice', 'pyq', 'mock'],
          pro: ['practice', 'pyq', 'mock']
        },
        'payment:create': {
          free: true,
          basic: true,
          premium: true,
          pro: true
        },
        'admin:access': {
          free: false,
          basic: false,
          premium: false,
          pro: false
        }
      };

      const resourcePermissions = permissions[`${resource}:${action}`];
      if (!resourcePermissions) {
        return { allowed: false, reason: 'Unknown resource or action' };
      }

      // Check if user has permission for this resource/action
      if (typeof resourcePermissions === 'boolean') {
        return { allowed: resourcePermissions };
      }

      // For test taking, check if user has active membership
      if (resource === 'test' && action === 'take') {
        if (!isMembershipActive) {
          return { allowed: false, reason: 'No active membership' };
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking permissions:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityAuditLog): Promise<void> {
    try {
      // In a production environment, you might want to send this to a logging service
      console.log('Security Event:', {
        ...event,
        timestamp: new Date().toISOString()
      });

      // Store in database for audit trail (using any to bypass type checking)
      const { error } = await (supabase as any)
        .from('security_audit_log')
        .insert({
          user_id: event.userId,
          action: event.action,
          resource: event.resource,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          success: event.success,
          error_message: event.error,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging security event to database:', error);
      }

    } catch (error) {
      console.error('Error in logSecurityEvent:', error);
    }
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim();
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const crypto = window.crypto || (window as any).msCrypto;
    
    if (crypto && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Hash sensitive data (simple hash for non-cryptographic purposes)
   */
  hashData(data: string): string {
    let hash = 0;
    if (data.length === 0) return hash.toString();
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current security configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}

export const securityService = SecurityService.getInstance();
