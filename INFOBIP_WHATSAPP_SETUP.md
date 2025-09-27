# Infobip WhatsApp OTP Integration Guide

## 🎯 Overview

This guide covers the complete Infobip WhatsApp integration for OTP delivery in your ExamAce application. WhatsApp OTP delivery is faster, more reliable, and provides better user experience than SMS.

## ✅ What's Implemented

### 1. **Infobip WhatsApp Integration**
- **Primary Service**: Infobip WhatsApp Business API
- **Template-based**: Uses approved WhatsApp message templates
- **Cost**: Typically lower than SMS
- **Coverage**: Global WhatsApp users
- **Delivery**: Instant delivery with read receipts

### 2. **Message Template System**
- **Template Name**: `otp_verification`
- **Language**: English (en)
- **Format**: `Your ExamAce verification code is: {{1}}. Valid for 5 minutes. Do not share this code with anyone.`

## 🔧 Configuration

### Environment Variables

Set these environment variables in your Supabase Edge Function (or use the defaults):

```bash
# Infobip API Configuration (Defaults provided)
INFOBIP_API_KEY=ff0df7b938db8b85a25ac5c5b6898adc-09dc2555-ca96-49f1-b030-73b930d1491d
INFOBIP_BASE_URL=https://519v8d.api.infobip.com

# WhatsApp Business Configuration (Defaults provided)
WHATSAPP_BUSINESS_NUMBER=447860088970
WHATSAPP_TEMPLATE_NAME=test_whatsapp_template_en
```

**Note**: The system is already configured with your Infobip credentials as defaults, so it will work immediately without setting environment variables.

### 1. **Infobip Account Setup (Your End)**

#### **Step 1: Create Infobip Account**
1. Go to https://portal.infobip.com/
2. Sign up for a new account
3. Complete account verification

#### **Step 2: Get API Credentials**
1. Login to Infobip Console
2. Go to **Account Settings** → **API Keys**
3. Create a new API key with WhatsApp permissions
4. Copy the API key (format: `your-api-key-here`)

#### **Step 3: Enable WhatsApp Business API**
1. In Infobip Console, go to **Channels** → **WhatsApp**
2. Enable WhatsApp Business API
3. Complete the setup process
4. Get your WhatsApp Business Number

### 2. **WhatsApp Business Account Setup**

#### **Step 1: WhatsApp Business Account**
1. Create a WhatsApp Business Account
2. Verify your business with WhatsApp
3. Complete the business verification process

#### **Step 2: Message Template Creation**
1. In Infobip Console, go to **WhatsApp** → **Message Templates**
2. Create a new template with these details:

**Template Details:**
- **Name**: `test_whatsapp_template_en`
- **Category**: `AUTHENTICATION`
- **Language**: `English (en)`
- **Template Content**:
  ```
  Your ExamAce verification code is: {{1}}. Valid for 5 minutes. Do not share this code with anyone.
  ```

**Template Components:**
- **Header**: None
- **Body**: `Your ExamAce verification code is: {{1}}. Valid for 5 minutes. Do not share this code with anyone.`
- **Footer**: None
- **Buttons**: None

#### **Step 3: Template Approval**
1. Submit the template for WhatsApp approval
2. Wait for approval (usually 24-48 hours)
3. Once approved, the template will be available for use

### 3. **Phone Number Format**

The system automatically formats phone numbers:
- **Input**: `9876543210` or `09876543210`
- **Output**: `919876543210` (with country code)
- **WhatsApp Format**: `919876543210`

## 🚀 API Integration

### **Infobip WhatsApp API Endpoint**
```
POST https://519v8d.api.infobip.com/whatsapp/1/message/template
```

### **Request Headers**
```
Authorization: App ff0df7b938db8b85a25ac5c5b6898adc-09dc2555-ca96-49f1-b030-73b930d1491d
Content-Type: application/json
Accept: application/json
```

### **Request Payload**
```json
{
  "messages": [
    {
      "from": "447860088970",
      "to": "919876543210",
      "messageId": "otp-1234567890-abc123",
      "content": {
        "templateName": "test_whatsapp_template_en",
        "templateData": {
          "body": {
            "placeholders": ["123456"]
          }
        },
        "language": "en"
      }
    }
  ]
}
```

### **Response Format**
```json
{
  "messages": [
    {
      "messageId": "unique-message-id",
      "status": {
        "groupName": "PENDING",
        "id": 1,
        "name": "PENDING_ACCEPTED",
        "description": "Message accepted for delivery"
      }
    }
  ]
}
```

## 🧪 Testing

### **Development Testing**
1. **Without Infobip**: The system uses a fallback method
2. **With Infobip**: Configure environment variables to test real delivery

### **Production Testing**
1. Use a test phone number with WhatsApp
2. Send OTP and verify delivery
3. Check Infobip console for delivery status

## 📊 Monitoring

### **Infobip Console**
- **Delivery Reports**: Check message delivery status
- **Analytics**: View delivery rates and performance
- **Error Logs**: Monitor any delivery failures

### **Application Logs**
- `📱 Sending WhatsApp OTP via Infobip to {phone}`
- `✅ WhatsApp OTP sent successfully via Infobip`
- `❌ Infobip WhatsApp API error: {status} - {error}`

## 🔒 Security Features

- ✅ **OTP Security**: OTPs are never logged in console
- ✅ **Rate Limiting**: Max 3 OTPs per phone per 5-minute window
- ✅ **Template-based**: Only approved message templates
- ✅ **Encrypted Delivery**: WhatsApp's end-to-end encryption
- ✅ **No Spam**: WhatsApp's built-in spam protection

## 💰 Cost Optimization

- **WhatsApp**: Typically cheaper than SMS
- **Template Reuse**: One-time template approval
- **Global Reach**: Single API for worldwide delivery
- **High Delivery Rate**: Better delivery than SMS

## 🚨 Troubleshooting

### **Common Issues**

1. **Template Not Approved**
   - Check template status in Infobip console
   - Ensure template follows WhatsApp guidelines

2. **API Key Issues**
   - Verify API key has WhatsApp permissions
   - Check API key format

3. **Phone Number Format**
   - Ensure phone numbers include country code
   - Check if WhatsApp number is valid

4. **Delivery Failures**
   - Check Infobip console for error details
   - Verify WhatsApp Business Account status

## 📞 Support

- **Infobip Support**: https://support.infobip.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp/
- **Application Logs**: Check Supabase Edge Function logs

## 🎉 Benefits of WhatsApp OTP

1. **Better User Experience**: Users prefer WhatsApp over SMS
2. **Higher Delivery Rate**: WhatsApp has better delivery rates
3. **Instant Delivery**: Faster than SMS
4. **Read Receipts**: Know when OTP is delivered
5. **Cost Effective**: Lower cost than SMS
6. **Global Reach**: Works worldwide
7. **Rich Media**: Can include images/buttons if needed
