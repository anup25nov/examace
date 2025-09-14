// Test function to verify referral code creation
import { supabase } from '@/integrations/supabase/client';

export const testReferralCodeCreation = async (userId: string) => {
  try {
    console.log('Testing referral code creation for user:', userId);
    
    // Check if user profile exists
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('id, phone')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('User profile not found:', userError);
      return { success: false, error: 'User profile not found' };
    }
    
    console.log('User profile found:', userProfile);
    
    // Check if referral code exists
    const { data: referralCode, error: referralError } = await supabase
      .from('referral_codes')
      .select('code, total_referrals, total_earnings')
      .eq('user_id', userId)
      .single();
    
    if (referralError) {
      console.error('Referral code not found:', referralError);
      return { success: false, error: 'Referral code not found' };
    }
    
    console.log('Referral code found:', referralCode);
    
    return { 
      success: true, 
      data: {
        user: userProfile,
        referralCode: referralCode
      }
    };
    
  } catch (error: any) {
    console.error('Error testing referral code:', error);
    return { success: false, error: error.message };
  }
};

// Function to manually create referral code if missing
export const createReferralCodeIfMissing = async (userId: string) => {
  try {
    console.log('Creating referral code for user:', userId);
    
    // Check if referral code already exists
    const { data: existingReferral, error: checkError } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing referral code:', checkError);
      return { success: false, error: checkError.message };
    }
    
    if (existingReferral) {
      console.log('Referral code already exists');
      return { success: true, message: 'Referral code already exists' };
    }
    
    // Create new referral code
    const referralCode = userId.substring(0, 8).toUpperCase();
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id: userId,
        code: referralCode,
        total_referrals: 0,
        total_earnings: 0.00
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating referral code:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Referral code created successfully:', data);
    return { success: true, data: data };
    
  } catch (error: any) {
    console.error('Error creating referral code:', error);
    return { success: false, error: error.message };
  }
};
