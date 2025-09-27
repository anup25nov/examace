// Custom OTP Service for ExamAce
// Handles OTP generation, validation, and SMS delivery

export interface OTPData {
  id: string;
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  messageId?: string;
  provider: 'fast2sms' | 'twilio' | 'custom';
  createdAt: Date;
}

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  rateLimitMinutes: number;
  rateLimitCount: number;
}

export interface SMSProvider {
  name: string;
  sendOTP(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
  cost: number; // Cost per SMS
}

export class CustomOTPService {
  private config: OTPConfig;
  private smsProviders: SMSProvider[];
  private otpStorage: Map<string, OTPData> = new Map();
  private rateLimitStorage: Map<string, { count: number; resetTime: Date }> = new Map();

  constructor(config?: Partial<OTPConfig>) {
    this.config = {
      length: 6,
      expiryMinutes: 5,
      maxAttempts: 3,
      rateLimitMinutes: 5,
      rateLimitCount: 3,
      ...config
    };

    this.smsProviders = this.initializeSMSProviders();
  }

  private initializeSMSProviders(): SMSProvider[] {
    return [
      // Primary: Custom OTP Provider (₹0.10 per SMS)
      {
        name: 'custom',
        sendOTP: this.sendViaCustomProvider.bind(this),
        cost: 0.10
      },
      // Fallback 1: Fast2SMS (₹0.35 per SMS) - COMMENTED OUT FOR NOW
      // {
      //   name: 'fast2sms',
      //   sendOTP: this.sendViaFast2SMS.bind(this),
      //   cost: 0.35
      // },
      // Fallback 2: Twilio (₹2.50 per SMS) - COMMENTED OUT FOR NOW
      // {
      //   name: 'twilio',
      //   sendOTP: this.sendViaTwilio.bind(this),
      //   cost: 2.50
      // }
    ];
  }

  /**
   * Generate a random OTP
   */
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.config.length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  /**
   * Check rate limiting for phone number
   */
  private checkRateLimit(phone: string): boolean {
    const now = new Date();
    const key = `rate_${phone}`;
    const rateData = this.rateLimitStorage.get(key);

    if (!rateData || now > rateData.resetTime) {
      // Reset rate limit
      this.rateLimitStorage.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + this.config.rateLimitMinutes * 60 * 1000)
      });
      return true;
    }

    if (rateData.count >= this.config.rateLimitCount) {
      return false;
    }

    rateData.count++;
    return true;
  }

  /**
   * Send OTP via Fast2SMS
   */
  private async sendViaFast2SMS(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const apiKey = import.meta.env.VITE_FAST2SMS_API_KEY;
      if (!apiKey) {
        return { success: false, error: 'Fast2SMS API key not configured' };
      }

      // Format phone number
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '91' + formattedPhone;
      } else if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }

      const params = new URLSearchParams({
        'authorization': apiKey,
        'route': 'otp',
        'variables_values': otp,
        'numbers': formattedPhone
      });

      const url = `https://www.fast2sms.com/dev/bulkV2?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, error: `Fast2SMS API error: ${response.status} - ${errorData}` };
      }

      const result = await response.json();
      
      if (result.return === true) {
        return { success: true, messageId: result.request_id };
      } else {
        return { success: false, error: result.message || 'Fast2SMS API returned error' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send OTP via Twilio
   */
  private async sendViaTwilio(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        return { success: false, error: 'Twilio not configured' };
      }

      const message = `Your S2S verification code is: ${otp}. This code expires in 5 minutes.`;
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': phone,
          'From': fromNumber,
          'Body': message
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, error: `Twilio API error: ${response.status} - ${errorData}` };
      }

      const result = await response.json();
      return { success: true, messageId: result.sid };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send OTP via Custom Provider
   * 
   * This is your main OTP delivery method. You can implement:
   * 1. Your own SMS gateway
   * 2. WhatsApp Business API
   * 3. Email fallback
   * 4. Push notifications
   * 5. Any other delivery method
   */
  private async sendViaCustomProvider(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Option 1: WhatsApp Business API (Recommended)
      const whatsappResult = await this.sendViaWhatsApp(phone, otp);
      if (whatsappResult.success) return whatsappResult;

      // Option 2: Email fallback (if user has email registered)
      const emailResult = await this.sendViaEmail(phone, otp);
      if (emailResult.success) return emailResult;

      // Option 3: Your own SMS gateway
      const smsResult = await this.sendViaCustomSMS(phone, otp);
      if (smsResult.success) return smsResult;

      // Option 4: Push notification (if user is logged in)
      const pushResult = await this.sendViaPushNotification(phone, otp);
      if (pushResult.success) return pushResult;

      // All custom methods failed
      return { success: false, error: 'All custom delivery methods failed' };

    } catch (error) {
      return { success: false, error: 'Custom provider error: ' + (error instanceof Error ? error.message : 'Unknown error') };
    }
  }

  /**
   * Send OTP via WhatsApp Business API
   */
  private async sendViaWhatsApp(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const whatsappToken = import.meta.env.VITE_WHATSAPP_TOKEN;
      const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
      
      if (!whatsappToken || !phoneNumberId) {
        return { success: false, error: 'WhatsApp not configured' };
      }

      // Format phone number for WhatsApp (remove + and add country code)
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '91' + formattedPhone;
      } else if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }

      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { 
            body: `🔐 *ExamAce Verification*\n\nYour OTP is: *${otp}*\n\nThis code expires in 5 minutes.\n\nDo not share this code with anyone.` 
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, error: `WhatsApp API error: ${response.status} - ${errorData}` };
      }

      const result = await response.json();
      return { success: true, messageId: result.messages[0].id };
    } catch (error) {
      return { success: false, error: 'WhatsApp not implemented' };
    }
  }

  /**
   * Send OTP via Email (fallback method)
   */
  private async sendViaEmail(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require you to have the user's email associated with their phone
      // You could implement this by storing email-phone mappings in your database
      
      // Example implementation:
      // const userEmail = await this.getUserEmailByPhone(phone);
      // if (!userEmail) {
      //   return { success: false, error: 'No email found for this phone number' };
      // }

      // const emailService = new EmailService();
      // const result = await emailService.sendOTP(userEmail, otp);
      // return result;

      return { success: false, error: 'Email fallback not implemented' };
    } catch (error) {
      return { success: false, error: 'Email service not available' };
    }
  }

  /**
   * Send OTP via Custom SMS Gateway (Supabase Edge Function)
   */
  private async sendViaCustomSMS(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const customApiKey = import.meta.env.VITE_CUSTOM_SMS_API_KEY || 'examace-sms-key-2024';
      
      if (!supabaseUrl) {
        return { success: false, error: 'Supabase URL not configured' };
      }

      // Use Supabase Edge Function for SMS
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customApiKey}`,
          'apikey': customApiKey
        },
        body: JSON.stringify({
          phone,
          message: `Your ExamAce OTP is: ${otp}. Valid for 5 minutes.`,
          type: 'otp',
          sender: 'EXAMACE'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        return { success: false, error: `SMS API error: ${response.status} - ${errorData}` };
      }

      const result = await response.json();
      return { success: true, messageId: result.id || result.messageId || `sms-${Date.now()}` };
    } catch (error) {
      return { success: false, error: 'Custom SMS gateway error: ' + (error instanceof Error ? error.message : 'Unknown error') };
    }
  }

  /**
   * Send OTP via Push Notification (for logged-in users)
   */
  private async sendViaPushNotification(phone: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require you to have the user's push notification token
      // You could implement this by storing push tokens in your database
      
      // Example implementation:
      // const pushToken = await this.getUserPushTokenByPhone(phone);
      // if (!pushToken) {
      //   return { success: false, error: 'No push token found for this phone number' };
      // }

      // const pushService = new PushNotificationService();
      // const result = await pushService.sendOTP(pushToken, otp);
      // return result;

      return { success: false, error: 'Push notification not implemented' };
    } catch (error) {
      return { success: false, error: 'Push notification service not available' };
    }
  }

  /**
   * Send OTP with fallback providers
   */
  async sendOTP(phone: string): Promise<{ success: boolean; otp?: string; messageId?: string; error?: string; provider?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(phone)) {
        return { 
          success: false, 
          error: `Rate limit exceeded. Maximum ${this.config.rateLimitCount} requests per ${this.config.rateLimitMinutes} minutes.` 
        };
      }

      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.config.expiryMinutes * 60 * 1000);

      // Try each SMS provider in order of preference (cheapest first)
      for (const provider of this.smsProviders) {
        console.log(`📱 Trying ${provider.name} (₹${provider.cost})...`);
        
        const result = await provider.sendOTP(phone, otp);
        
        if (result.success) {
          // Store OTP data
          const otpData: OTPData = {
            id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phone,
            otp,
            expiresAt,
            attempts: 0,
            messageId: result.messageId,
            provider: provider.name as any,
            createdAt: new Date()
          };

          this.otpStorage.set(phone, otpData);
          
          console.log(`✅ OTP sent via ${provider.name}! Message ID: ${result.messageId}`);
          
          return {
            success: true,
            otp, // Only return OTP in development
            messageId: result.messageId,
            provider: provider.name
          };
        } else {
          console.log(`❌ ${provider.name} failed: ${result.error}`);
        }
      }

      // All providers failed
      return { 
        success: false, 
        error: 'All SMS providers failed. Please try again later.' 
      };

    } catch (error) {
      console.error('❌ OTP sending failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, userOTP: string): Promise<{ success: boolean; error?: string }> {
    try {
      const otpData = this.otpStorage.get(phone);
      
      if (!otpData) {
        return { success: false, error: 'No OTP found for this phone number' };
      }

      // Check if OTP is expired
      if (new Date() > otpData.expiresAt) {
        this.otpStorage.delete(phone);
        return { success: false, error: 'OTP has expired' };
      }

      // Check attempts
      if (otpData.attempts >= this.config.maxAttempts) {
        this.otpStorage.delete(phone);
        return { success: false, error: 'Maximum attempts exceeded' };
      }

      // Increment attempts
      otpData.attempts++;

      // Verify OTP
      if (otpData.otp === userOTP) {
        // Success - clear OTP
        this.otpStorage.delete(phone);
        console.log(`✅ OTP verified successfully for ${phone}`);
        return { success: true };
      } else {
        // Wrong OTP
        if (otpData.attempts >= this.config.maxAttempts) {
          this.otpStorage.delete(phone);
          return { success: false, error: 'Maximum attempts exceeded' };
        }
        
        const remainingAttempts = this.config.maxAttempts - otpData.attempts;
        return { 
          success: false, 
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
        };
      }

    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get OTP status (for debugging)
   */
  getOTPStatus(phone: string): OTPData | null {
    return this.otpStorage.get(phone) || null;
  }

  /**
   * Clear expired OTPs (call this periodically)
   */
  clearExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStorage.delete(phone);
        console.log(`🧹 Cleared expired OTP for ${phone}`);
      }
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeOTPs: number;
    totalProviders: number;
    providerCosts: { name: string; cost: number }[];
  } {
    return {
      activeOTPs: this.otpStorage.size,
      totalProviders: this.smsProviders.length,
      providerCosts: this.smsProviders.map(p => ({ name: p.name, cost: p.cost }))
    };
  }
}

// Export singleton instance
export const otpService = new CustomOTPService();
