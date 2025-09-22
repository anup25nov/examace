import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { optimizedApiService } from '@/lib/optimizedApiService';

interface DashboardData {
  profile: any;
  membership: any;
  referralStats: any;
  loading: boolean;
  error: string | null;
}

interface DashboardDataContextType extends DashboardData {
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
}

export const DashboardDataProvider: React.FC<DashboardDataProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData>({
    profile: null,
    membership: null,
    referralStats: null,
    loading: true,
    error: null
  });

  const loadData = async () => {
    if (!isAuthenticated || !user) {
      setData({
        profile: null,
        membership: null,
        referralStats: null,
        loading: false,
        error: null
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      // Single API call to get all dashboard data
      const result = await optimizedApiService.getUserProfileData(user.id);
      
      setData({
        profile: result.profile,
        membership: result.membership,
        referralStats: result.referralStats,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }));
    }
  };

  const refreshData = async () => {
    if (user) {
      // Clear cache and reload
      optimizedApiService.clearProfileCache(user.id);
      await loadData();
    }
  };

  const clearCache = () => {
    if (user) {
      optimizedApiService.clearProfileCache(user.id);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isAuthenticated]);

  return (
    <DashboardDataContext.Provider value={{
      ...data,
      refreshData,
      clearCache
    }}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
};
