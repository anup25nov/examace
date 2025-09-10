// SMS Service for Production OTP
// This file handles SMS sending for OTP verification
// Browser-compatible version using Twilio REST API

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Twilio SMS Service (Browser Compatible)
export class TwilioSMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    // Twilio credentials from environment variables
    this.accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('⚠️ Twilio credentials not found in environment variables');
      console.warn('Please set the following environment variables:');
      console.warn('- VITE_TWILIO_ACCOUNT_SID');
      console.warn('- VITE_TWILIO_AUTH_TOKEN');
      console.warn('- VITE_TWILIO_PHONE_NUMBER');
    } else {
      console.log('✅ Twilio service initialized (browser-compatible)');
    }
  }

  async sendOTP(phone: string, otp: string): Promise<SMSResponse> {
    try {
      // Check if credentials are available
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        console.warn('⚠️ Twilio credentials not configured. SMS will not be sent.');
        return { 
          success: false, 
          error: 'SMS service not configured. Please set Twilio credentials in environment variables:\n- VITE_TWILIO_ACCOUNT_SID\n- VITE_TWILIO_AUTH_TOKEN\n- VITE_TWILIO_PHONE_NUMBER' 
        };
      }

      // Check for placeholder values
      if (this.accountSid.includes('your_twilio_account_sid_here') || 
          this.authToken.includes('your_twilio_auth_token_here') ||
          this.fromNumber.includes('your_twilio_phone_number_here')) {
        console.warn('⚠️ Twilio credentials contain placeholder values. Please set real credentials.');
        return { 
          success: false, 
          error: 'Twilio credentials contain placeholder values. Please set real credentials in environment variables.' 
        };
      }

      // Format phone number (ensure it starts with +)
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      // Create message
      const message = `Your S2S verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`;
      
      console.log(`📱 Sending SMS to ${formattedPhone}...`);
      
      // Create basic auth header
      const credentials = btoa(`${this.accountSid}:${this.authToken}`);
      
      // Send SMS via Twilio REST API
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'From': this.fromNumber,
          'To': formattedPhone,
          'Body': message
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      console.log(`✅ SMS sent successfully! Message SID: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// AWS SNS Service (Alternative)
export class AWSSNSService {
  async sendOTP(phone: string, otp: string): Promise<SMSResponse> {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const message = `Your S2S verification code is: ${otp}. This code expires in 5 minutes.`;
      
      // In production, you would call AWS SNS here:
      // const result = await sns.publish({
      //   Message: message,
      //   PhoneNumber: formattedPhone
      // }).promise();
      
      console.log(`📱 AWS SNS would be sent to ${formattedPhone}: ${message}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `aws_${Date.now()}`
      };
    } catch (error) {
      console.error('AWS SNS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// TextLocal Service (India-specific)
export class TextLocalService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TEXTLOCAL_API_KEY || '';
  }

  async sendOTP(phone: string, otp: string): Promise<SMSResponse> {
    try {
      const formattedPhone = phone.startsWith('+') ? phone.slice(1) : phone;
      const message = `Your S2S verification code is: ${otp}. This code expires in 5 minutes.`;
      
      // In production, you would call TextLocal API here:
      // const response = await fetch('https://api.textlocal.in/send/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     apikey: this.apiKey,
      //     numbers: formattedPhone,
      //     message: message,
      //     sender: 'S2S'
      //   })
      // });
      
      console.log(`📱 TextLocal SMS would be sent to ${formattedPhone}: ${message}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: `textlocal_${Date.now()}`
      };
    } catch (error) {
      console.error('TextLocal SMS sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Factory function to get SMS service
export const getSMSService = (): TwilioSMSService | AWSSNSService | TextLocalService => {
  // Always use Twilio for now since we have credentials
  return new TwilioSMSService();
};

// Main SMS service instance
export const smsService = getSMSService();
