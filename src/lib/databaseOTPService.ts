// Clean OTP Service for ExamAce - Infobip WhatsApp Only
// Stores OTPs in Supabase database with proper expiry handling

export interface OTPResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  provider?: string;
  data?: any;
}

export interface OTPConfig {
  otpLength: number;
  otpExpiryMinutes: number;
  maxAttempts: number;
  rateLimitWindowMs: number;
}

export interface ServiceStatus {
  otpLength: number;
  otpExpiryMinutes: number;
  maxAttempts: number;
  rateLimitWindowMs: number;
  providerCosts: { name: string; cost: number }[];
}

export interface OTPStats {
  activeOTPs: number;
  totalProviders: number;
  providerCosts: { name: string; cost: number }[];
}

export interface DatabaseOTP {
  id: string;
  otp_code: string;
  provider: string;
  message_id?: string;
  expires_at: string;
  attempts: number;
  max_attempts: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  phone: string;
}

export class DatabaseOTPService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private config: OTPConfig;

  constructor(config?: Partial<OTPConfig>) {
    this.config = {
      otpLength: 6,
      otpExpiryMinutes: 5,
      maxAttempts: 3,
      rateLimitWindowMs: 60 * 1000, // 1 minute
      ...config
    };

    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://talvssmwnsfotoutjlhd.supabase.co';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbHZzc213bnNmb3RvdXRqbGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MjQ2NjMsImV4cCI6MjA3MjMwMDY2M30.kViEumcw7qxZeITgtZf91D-UVFY5PaFyXganLyh2Tok';
  }

  /**
   * Generate a random OTP
   */
  private generateOTP(): string {
    const min = Math.pow(10, this.config.otpLength - 1);
    const max = Math.pow(10, this.config.otpLength) - 1;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
  }

  /**
   * Check if phone number is rate limited
   */
  private async isRateLimited(phone: string): Promise<boolean> {
    const rateLimitKey = `rate_limit_${phone}`;
    const lastSent = localStorage.getItem(rateLimitKey);
    const now = Date.now();
    
    if (lastSent && (now - parseInt(lastSent)) < this.config.rateLimitWindowMs) {
      return true;
    }
    
    return false;
  }

  /**
   * Expire existing OTPs for a phone number
   */
  private async expireExistingOTPs(phone: string): Promise<void> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/otps?phone=eq.${phone}&is_verified=eq.false`, {
        method: 'PATCH',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        const responseText = await response.text();
        if (responseText.trim()) {
          try {
            const result = JSON.parse(responseText);
            // OTPs expired successfully
          } catch (parseError) {
            // OTPs expired successfully (non-JSON response)
          }
        } else {
          // No existing OTPs to expire
        }
      } else {
        console.error(`⚠️ Could not expire existing OTPs for phone: ${phone} (${response.status})`);
      }
    } catch (error) {
      console.error(`❌ Error expiring existing OTPs for phone ${phone}:`, error);
    }
  }

  /**
   * Store OTP in database
   */
  private async storeOTP(phone: string, otp: string, provider: string, messageId?: string): Promise<string> {
    // First, expire all existing OTPs for this phone number
    await this.expireExistingOTPs(phone);
    
    const expiresAt = new Date(Date.now() + this.config.otpExpiryMinutes * 60 * 1000);
    
    const otpData = {
      phone,
      otp_code: otp,
      provider,
      message_id: messageId,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      max_attempts: this.config.maxAttempts,
      is_verified: false
    };

    const response = await fetch(`${this.supabaseUrl}/rest/v1/otps`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(otpData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to store OTP: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
      // OTP stored successfully
    return result[0].id;
  }

  /**
   * Send OTP via Infobip WhatsApp
   */
  async sendOTP(phone: string): Promise<OTPResult> {
    const startTime = Date.now();
    try {
      // Check rate limiting
      if (await this.isRateLimited(phone)) {
        console.error(`❌ Rate limit exceeded for phone: ${phone}`);
        return { success: false, error: 'Rate limit exceeded. Please wait before requesting another OTP.' };
      }
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        },
        body: JSON.stringify({
          phone,
          type: 'otp',
          sender: 'EXAMACE'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Send SMS failed:', response.status, errorData);
        return { success: false, error: 'Failed to send OTP' };
      }

      const result = await response.json();
      if (result.success) {
        const totalDuration = Date.now() - startTime;
        // OTP sent successfully
        
        // Update rate limit
        const rateLimitKey = `rate_limit_${phone}`;
        localStorage.setItem(rateLimitKey, Date.now().toString());
        
        return {
          success: true,
          message: `OTP sent via WhatsApp`,
          messageId: result.messageId,
          provider: 'whatsapp',
          data: result.data
        };
      } else {
        console.error(`❌ Send SMS failed:`, result.error);
        return { 
          success: false, 
          error: result.error || 'Failed to send OTP' 
        };
      }
      
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`💥 Critical error in sendOTP after ${totalDuration}ms:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get OTP statistics
   */
  async getStats(): Promise<OTPStats> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/otps?is_verified=eq.false&expires_at=gt.${new Date().toISOString()}&select=id`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          activeOTPs: data.length,
          totalProviders: 1,
          providerCosts: [{ name: 'whatsapp', cost: 0.05 }]
        };
      }
    } catch (error) {
      console.error('Error getting stats:', error);
    }

    return {
      activeOTPs: 0,
      totalProviders: 1,
      providerCosts: [{ name: 'whatsapp', cost: 0.05 }]
    };
  }

  /**
   * Get service status
   */
  getServiceStatus(): ServiceStatus {
    return {
      otpLength: this.config.otpLength,
      otpExpiryMinutes: this.config.otpExpiryMinutes,
      maxAttempts: this.config.maxAttempts,
      rateLimitWindowMs: this.config.rateLimitWindowMs,
      providerCosts: [{ name: 'whatsapp', cost: 0.05 }]
    };
  }
}

// Export singleton instance
export const databaseOTPService = new DatabaseOTPService();