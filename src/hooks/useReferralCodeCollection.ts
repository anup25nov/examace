import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralCodeCollectionState {
  shouldShowModal: boolean;
  hasAppliedReferral: boolean;
  isLoading: boolean;
}

export const useReferralCodeCollection = () => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<ReferralCodeCollectionState>({
    shouldShowModal: false,
    hasAppliedReferral: false,
    isLoading: true
  });

  useEffect(() => {
    const checkReferralStatus = async () => {
      if (!isAuthenticated || !user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Check if user has already applied a referral code
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('referral_code_applied, referral_code_used, created_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking referral status:', error);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const hasAppliedReferral = (profile as any)?.referral_code_applied || false;
        
        // Show modal if:
        // 1. User hasn't applied a referral code yet
        // 2. User is not a new user (created more than 1 hour ago)
        // 3. We haven't shown the modal in this session
        const isNewUser = (profile as any)?.created_at && 
          (new Date().getTime() - new Date((profile as any).created_at).getTime()) < 60 * 60 * 1000; // 1 hour
        
        const hasShownModal = sessionStorage.getItem('referralModalShown');
        
        const shouldShowModal = !hasAppliedReferral && !isNewUser && !hasShownModal;

        setState({
          shouldShowModal,
          hasAppliedReferral,
          isLoading: false
        });

        // Mark that we've shown the modal for this session
        if (shouldShowModal) {
          sessionStorage.setItem('referralModalShown', 'true');
        }
      } catch (error) {
        console.error('Error in checkReferralStatus:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkReferralStatus();
  }, [isAuthenticated, user]);

  const markReferralApplied = () => {
    setState(prev => ({
      ...prev,
      hasAppliedReferral: true,
      shouldShowModal: false
    }));
  };

  const hideModal = () => {
    setState(prev => ({
      ...prev,
      shouldShowModal: false
    }));
  };

  const resetModal = () => {
    sessionStorage.removeItem('referralModalShown');
    setState(prev => ({
      ...prev,
      shouldShowModal: !prev.hasAppliedReferral
    }));
  };

  return {
    ...state,
    markReferralApplied,
    hideModal,
    resetModal
  };
};
