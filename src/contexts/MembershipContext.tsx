import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MembershipContextType {
  membership: any | null;
  hasAccess: (testId: string, isPremium: boolean) => boolean;
  refreshMembership: () => Promise<void>;
  loading: boolean;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
};

interface MembershipProviderProps {
  children: ReactNode;
}

export const MembershipProvider: React.FC<MembershipProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshMembership = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: membershipData, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching membership:', error);
      }
      
      setMembership(membershipData);
    } catch (error) {
      console.error('Error refreshing membership:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (testId: string, isPremium: boolean): boolean => {
    if (!isPremium) return true; // Free tests are always accessible
    return !!membership; // Premium tests require membership
  };

  useEffect(() => {
    if (user) {
      refreshMembership();
    } else {
      setMembership(null);
    }
  }, [user]);

  const value: MembershipContextType = {
    membership,
    hasAccess,
    refreshMembership,
    loading
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
};
