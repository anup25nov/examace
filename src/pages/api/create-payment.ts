// API Route: Create Payment Order
import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from '@/lib/razorpayService';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, plan } = req.body;

    // Validate required fields
    if (!userId || !plan) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and plan' 
      });
    }

    // Validate plan structure
    if (!plan.id || !plan.name || !plan.price) {
      return res.status(400).json({ 
        error: 'Invalid plan structure' 
      });
    }

    // Create Razorpay order
    const orderData = {
      amount: plan.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name
      }
    };

    const razorpayOrder = await razorpayService.createOrder(orderData);

    // Create payment record in database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert({
        payment_id: orderData.receipt,
        user_id: userId,
        razorpay_order_id: razorpayOrder.id,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        payment_method: 'razorpay',
        status: 'created'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: dbError.message 
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: paymentRecord.payment_id,
      orderId: razorpayOrder.id,
      amount: plan.price,
      currency: 'INR',
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
