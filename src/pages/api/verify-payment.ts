// API Route: Verify Payment
import { supabase } from '@/integrations/supabase/client';
import { razorpayService } from '@/lib/razorpayService';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      paymentId, 
      razorpayPaymentId, 
      razorpayOrderId, 
      razorpaySignature 
    } = req.body;

    // Validate required fields
    if (!paymentId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ 
        error: 'Missing required fields for payment verification' 
      });
    }

    // Verify payment signature
    const isSignatureValid = await razorpayService.verifyPayment(
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({ 
        error: 'Invalid payment signature' 
      });
    }

    // Update payment record in database
    const { data: paymentRecord, error: updateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update payment record',
        details: updateError.message 
      });
    }

    if (!paymentRecord) {
      return res.status(404).json({ 
        error: 'Payment record not found' 
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: paymentRecord.payment_id,
      userId: paymentRecord.user_id,
      planId: paymentRecord.plan_id,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
