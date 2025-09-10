// API Route: Activate Membership
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, planId } = req.body;

    // Validate required fields
    if (!userId || !planId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and planId' 
      });
    }

    // Calculate expiry date (default 1 month)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Update user profile
    const { data: userProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        membership_plan: planId,
        membership_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to activate membership',
        details: updateError.message 
      });
    }

    if (!userProfile) {
      return res.status(404).json({ 
        error: 'User profile not found' 
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      userId: userId,
      planId: planId,
      expiryDate: expiryDate.toISOString(),
      message: 'Membership activated successfully'
    });

  } catch (error) {
    console.error('Error activating membership:', error);
    return res.status(500).json({ 
      error: 'Failed to activate membership',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
