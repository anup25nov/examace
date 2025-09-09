// Professional Membership Hook
import { useState, useEffect } from 'react';
import { membershipService, MembershipStatus, MembershipPlan } from '@/lib/membershipService';
import { useAuth } from './useAuth';

export function useMembership() {
  const { user } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load membership status
  const loadMembershipStatus = async () => {
    if (!user?.id) {
      setMembershipStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await membershipService.getUserMembershipStatus(user.id);
      setMembershipStatus(status);
      setError(null);
    } catch (err: any) {
      console.error('Error loading membership status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load available plans
  const loadMembershipPlans = async () => {
    try {
      const plans = await membershipService.getAllMembershipPlans();
      setMembershipPlans(plans);
    } catch (err: any) {
      console.error('Error loading membership plans:', err);
    }
  };

  // Check access to mock tests
  const hasAccessToMockTests = async (requiredTests: number = 1): Promise<boolean> => {
    if (!user?.id) return false;
    return await membershipService.hasAccessToMockTests(user.id, requiredTests);
  };

  // Check access to specific test type
  const canAccessTest = async (testType: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await membershipService.canAccessTest(user.id, testType);
  };

  // Process membership purchase
  const processPurchase = async (
    planId: string,
    amount: number,
    paymentId: string,
    referralCode?: string
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const result = await membershipService.processMembershipPurchase(
      user.id,
      planId,
      amount,
      paymentId,
      referralCode
    );

    if (result.success) {
      // Refresh membership status after successful purchase
      await loadMembershipStatus();
    }

    return result;
  };

  // Refresh membership data
  const refreshMembership = () => {
    loadMembershipStatus();
    loadMembershipPlans();
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadMembershipStatus();
    loadMembershipPlans();
  }, [user?.id]);

  return {
    membershipStatus,
    membershipPlans,
    loading,
    error,
    hasAccessToMockTests,
    canAccessTest,
    processPurchase,
    refreshMembership,
    // Computed values
    isActiveMember: membershipStatus?.has_active_membership || false,
    currentPlan: membershipStatus?.current_plan || 'free',
    daysRemaining: membershipStatus?.days_remaining || 0,
    testsAvailable: membershipStatus?.tests_available || 0,
  };
}