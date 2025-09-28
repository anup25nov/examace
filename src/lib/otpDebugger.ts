/**
 * OTP Debugging Utility for ExamAce
 * Provides debugging tools for OTP verification issues
 */

import { databaseOTPService } from './databaseOTPService';
import { generateUserID, isValidUUID } from './uuidUtils';

export interface OTPDebugInfo {
  phone: string;
  otp: string;
  timestamp: string;
  queryUrl: string;
  environment: {
    supabaseUrl: string;
    hasAnonKey: boolean;
    nodeEnv: string;
  };
  database: {
    activeOTPs: number;
    stats: any;
  };
}

export interface OTPTestResult {
  success: boolean;
  debugInfo: OTPDebugInfo;
  error?: string;
  queryResult?: any;
}

export class OTPDebugger {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://talvssmwnsfotoutjlhd.supabase.co';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }

  /**
   * Generate debug information for OTP verification
   */
  async generateDebugInfo(phone: string, otp: string): Promise<OTPDebugInfo> {
    const timestamp = new Date().toISOString();
    const queryUrl = `${this.supabaseUrl}/rest/v1/otps?phone=eq.${phone}&otp_code=eq.${otp}&is_verified=eq.false&expires_at=gt.${timestamp}`;
    
    const stats = await databaseOTPService.getStats();

    return {
      phone,
      otp: otp.substring(0, 2) + '****', // Mask OTP for security
      timestamp,
      queryUrl: queryUrl.replace(this.supabaseKey, '***masked***'),
      environment: {
        supabaseUrl: this.supabaseUrl,
        hasAnonKey: !!this.supabaseKey,
        nodeEnv: import.meta.env.NODE_ENV || 'development'
      },
      database: {
        activeOTPs: stats.activeOTPs,
        stats
      }
    };
  }

  /**
   * Test OTP verification with detailed debugging
   */
  async testOTPVerification(phone: string, otp: string): Promise<OTPTestResult> {
    try {
      const debugInfo = await this.generateDebugInfo(phone, otp);
      
      console.log('🔍 OTP Debug Information:', debugInfo);

      // Test the actual verification
      const result = await databaseOTPService.verifyOTP(phone, otp);
      
      return {
        success: result.success,
        debugInfo,
        error: result.error,
        queryResult: result
      };
    } catch (error) {
      console.error('💥 OTP Debug Test Failed:', error);
      return {
        success: false,
        debugInfo: await this.generateDebugInfo(phone, otp),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if an OTP exists in the database without verifying it
   */
  async checkOTPExists(phone: string, otp: string): Promise<any> {
    try {
      const currentTime = new Date().toISOString();
      const queryUrl = `${this.supabaseUrl}/rest/v1/otps?phone=eq.${phone}&otp_code=eq.${otp}&select=*`;
      
      console.log('🔍 Checking OTP Existence:', {
        phone,
        queryUrl: queryUrl.replace(this.supabaseKey, '***masked***'),
        currentTime
      });

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('📊 OTP Check Results:', {
        found: data.length,
        records: data.map((record: any) => ({
          id: record.id,
          phone: record.phone,
          otp_code: record.otp_code.substring(0, 2) + '****',
          expires_at: record.expires_at,
          is_verified: record.is_verified,
          attempts: record.attempts,
          max_attempts: record.max_attempts,
          created_at: record.created_at,
          isExpired: new Date(record.expires_at) < new Date()
        }))
      });

      return {
        success: true,
        found: data.length > 0,
        records: data,
        summary: {
          total: data.length,
          verified: data.filter((r: any) => r.is_verified).length,
          expired: data.filter((r: any) => new Date(r.expires_at) < new Date()).length,
          active: data.filter((r: any) => !r.is_verified && new Date(r.expires_at) > new Date()).length
        }
      };
    } catch (error) {
      console.error('❌ OTP Check Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all OTPs for a phone number
   */
  async getAllOTPsForPhone(phone: string): Promise<any> {
    try {
      const queryUrl = `${this.supabaseUrl}/rest/v1/otps?phone=eq.${phone}&select=*&order=created_at.desc`;
      
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        phone,
        count: data.length,
        otps: data.map((record: any) => ({
          id: record.id,
          otp_code: record.otp_code.substring(0, 2) + '****',
          expires_at: record.expires_at,
          is_verified: record.is_verified,
          attempts: record.attempts,
          max_attempts: record.max_attempts,
          created_at: record.created_at,
          isExpired: new Date(record.expires_at) < new Date(),
          isActive: !record.is_verified && new Date(record.expires_at) > new Date()
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get OTPs for phone:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate and test UUID generation
   */
  testUUIDGeneration(): any {
    try {
      const uuid1 = generateUserID();
      const uuid2 = generateUserID();
      
      const results = {
        success: true,
        testResults: {
          uuid1: {
            value: uuid1,
            isValid: isValidUUID(uuid1),
            length: uuid1.length
          },
          uuid2: {
            value: uuid2,
            isValid: isValidUUID(uuid2),
            length: uuid2.length
          },
          areDifferent: uuid1 !== uuid2,
          format: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        }
      };
      
      console.log('🧪 UUID Generation Test Results:', results);
      return results;
    } catch (error) {
      console.error('❌ UUID Generation Test Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clean up expired OTPs (for testing purposes)
   */
  async cleanupExpiredOTPs(): Promise<any> {
    try {
      const currentTime = new Date().toISOString();
      const queryUrl = `${this.supabaseUrl}/rest/v1/otps?expires_at=lt.${currentTime}&select=id`;
      
      // First, get expired OTPs
      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const expiredOTPs = await response.json();
      
      console.log(`🧹 Found ${expiredOTPs.length} expired OTPs to clean up`);

      return {
        success: true,
        expiredCount: expiredOTPs.length,
        message: 'Expired OTPs identified (cleanup would require service role key)'
      };
    } catch (error) {
      console.error('❌ Failed to cleanup expired OTPs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const otpDebugger = new OTPDebugger();

// Console debugging functions for easy access
if (typeof window !== 'undefined') {
  (window as any).otpDebugger = otpDebugger;
  (window as any).testOTP = (phone: string, otp: string) => otpDebugger.testOTPVerification(phone, otp);
  (window as any).checkOTP = (phone: string, otp: string) => otpDebugger.checkOTPExists(phone, otp);
  (window as any).getAllOTPs = (phone: string) => otpDebugger.getAllOTPsForPhone(phone);
  (window as any).cleanupOTPs = () => otpDebugger.cleanupExpiredOTPs();
  (window as any).testUUID = () => otpDebugger.testUUIDGeneration();
}
