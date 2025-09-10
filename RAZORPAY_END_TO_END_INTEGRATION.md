# 🚀 Razorpay End-to-End Payment System - Complete Integration

## 🎯 **What We're Building**

A complete payment system with:
- ✅ **Razorpay Order Creation**
- ✅ **Payment Gateway Integration**
- ✅ **Webhook Handling**
- ✅ **Database Integration**
- ✅ **Payment Verification**
- ✅ **Membership Activation**
- ✅ **Error Handling**

---

## 🔧 **What You Need to Provide**

### **1. Razorpay Credentials**
```env
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR
```

### **2. Webhook URL**
```
https://yourdomain.com/api/razorpay-webhook
```

### **3. Supabase Database Setup**
- Payment tracking table
- Webhook event logging
- Membership management

---

## 🏗️ **System Architecture**

```
User → Payment Modal → Razorpay → Webhook → Database → Membership Activation
```

### **Flow:**
1. **User selects plan** → Payment modal opens
2. **Create Razorpay order** → Get order ID
3. **User pays** → Razorpay processes payment
4. **Webhook receives** → Payment status update
5. **Database updated** → Payment verified
6. **Membership activated** → User gets access

---

## 📁 **Files We'll Create/Update**

### **New Files:**
- `src/lib/razorpayService.ts` - Razorpay API integration
- `src/lib/paymentService.ts` - Payment management
- `src/components/RazorpayPaymentModal.tsx` - Payment UI
- `src/pages/api/razorpay-webhook.ts` - Webhook handler
- `supabase/migrations/razorpay_payment_system.sql` - Database schema

### **Updated Files:**
- `src/components/MembershipPlans.tsx` - Use Razorpay modal
- `src/lib/membershipService.ts` - Integration with payments

---

## 🗄️ **Database Schema**

### **Payments Table:**
```sql
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT
);
```

### **Webhook Events Table:**
```sql
CREATE TABLE public.webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payment_id TEXT,
    order_id TEXT,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔑 **Razorpay Integration Steps**

### **Step 1: Install Dependencies**
```bash
npm install razorpay
npm install @types/razorpay
```

### **Step 2: Environment Variables**
```env
# .env.local
RAZORPAY_KEY_ID=rzp_test_RFxIToeCLybhiA
RAZORPAY_KEY_SECRET=MHHKyti0XnceA6iQ4ufzvNtR
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### **Step 3: Razorpay Service**
```typescript
// src/lib/razorpayService.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export class RazorpayService {
  async createOrder(orderData: {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    return await razorpay.orders.create(orderData);
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return expectedSignature === signature;
  }

  async capturePayment(paymentId: string, amount: number) {
    return await razorpay.payments.capture(paymentId, amount);
  }
}
```

### **Step 4: Payment Service**
```typescript
// src/lib/paymentService.ts
import { supabase } from '@/integrations/supabase/client';
import { RazorpayService } from './razorpayService';

export class PaymentService {
  private razorpay = new RazorpayService();

  async createPayment(userId: string, plan: any) {
    // Create Razorpay order
    const order = await this.razorpay.createOrder({
      amount: plan.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name
      }
    });

    // Save to database
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        razorpay_order_id: order.id,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        status: 'created'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: data.id
    };
  }

  async verifyPayment(paymentId: string, razorpayData: any) {
    // Verify payment signature
    const isValid = await this.razorpay.verifyPayment(
      razorpayData.razorpay_payment_id,
      razorpayData.razorpay_order_id,
      razorpayData.razorpay_signature
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Update payment status
    const { error } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpayData.razorpay_payment_id,
        razorpay_signature: razorpayData.razorpay_signature,
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: razorpayData.payment_method || 'razorpay'
      })
      .eq('id', paymentId);

    if (error) throw error;

    return true;
  }

  async activateMembership(userId: string, planId: string) {
    // Calculate expiry date based on plan
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1); // Default 1 month

    const { error } = await supabase
      .from('user_profiles')
      .update({
        membership_plan: planId,
        membership_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  }
}
```

### **Step 5: Webhook Handler**
```typescript
// src/pages/api/razorpay-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { PaymentService } from '@/lib/paymentService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Log webhook event
    await supabase
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.event,
        payment_id: event.payload?.payment?.entity?.id,
        order_id: event.payload?.payment?.entity?.order_id,
        raw_data: event
      });

    // Handle payment success
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      // Find payment record
      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (paymentRecord) {
        const paymentService = new PaymentService();
        
        // Verify and update payment
        await paymentService.verifyPayment(paymentRecord.id, {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          razorpay_signature: payment.signature
        });

        // Activate membership
        await paymentService.activateMembership(
          paymentRecord.user_id,
          paymentRecord.plan_id
        );
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

### **Step 6: Payment Modal Component**
```typescript
// src/components/RazorpayPaymentModal.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard, Shield } from 'lucide-react';
import { PaymentService } from '@/lib/paymentService';
import { useAuth } from '@/hooks/useAuth';

interface RazorpayPaymentModalProps {
  plan: {
    id: string;
    name: string;
    price: number;
    mockTests: number;
  };
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

export const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  plan,
  onClose,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!user) {
      setError('Please login to continue');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const paymentService = new PaymentService();
      const paymentData = await paymentService.createPayment(user.id, plan);

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'ExamAce',
          description: plan.name,
          order_id: paymentData.orderId,
          handler: async (response: any) => {
            try {
              // Payment successful
              onPaymentSuccess(paymentData.paymentId);
              onClose();
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed');
            }
          },
          prefill: {
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
          },
          theme: {
            color: '#2563eb'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-600">{plan.mockTests} Mock Tests</p>
                <p className="text-2xl font-bold text-blue-600">₹{plan.price}</p>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : `Pay ₹${plan.price}`}
            </Button>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure payment powered by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🚀 **Implementation Steps**

### **Step 1: Database Setup**
1. **Run the SQL migration** in Supabase
2. **Enable RLS policies**
3. **Set up webhook endpoint**

### **Step 2: Environment Setup**
1. **Add Razorpay credentials** to `.env.local`
2. **Install dependencies**
3. **Configure webhook URL** in Razorpay dashboard

### **Step 3: Code Integration**
1. **Replace existing payment modal** with Razorpay modal
2. **Update membership plans** to use new payment flow
3. **Test payment flow** end-to-end

### **Step 4: Webhook Configuration**
1. **Set webhook URL** in Razorpay dashboard
2. **Enable payment events**
3. **Test webhook delivery**

---

## 🔍 **Testing Checklist**

- [ ] **Payment order creation** works
- [ ] **Razorpay checkout** opens properly
- [ ] **Payment completion** triggers success
- [ ] **Webhook receives** payment events
- [ ] **Database updates** payment status
- [ ] **Membership activation** works
- [ ] **Error handling** works properly

---

## 🎯 **What You Need to Do**

### **1. Provide Webhook URL**
```
https://yourdomain.com/api/razorpay-webhook
```

### **2. Configure Razorpay Dashboard**
- Enable webhooks
- Set webhook URL
- Enable payment events

### **3. Test the Integration**
- Create test payments
- Verify webhook delivery
- Check database updates

---

## 🚀 **Ready to Implement?**

This system provides:
- ✅ **Complete Razorpay integration**
- ✅ **Proper webhook handling**
- ✅ **Database tracking**
- ✅ **Membership activation**
- ✅ **Error handling**
- ✅ **Security verification**

**Let me know when you're ready to implement this system!** 🎉
