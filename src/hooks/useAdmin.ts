import { useState, useEffect } from 'react';
import { adminService } from '@/lib/adminService';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = async () => {
    if (!isAuthenticated || !user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const adminStatus = await adminService.isCurrentUserAdmin();
      setIsAdmin(adminStatus);
    } catch (err: any) {
      console.error('Error checking admin status:', err);
      setError(err.message);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [isAuthenticated, user?.id]);

  return {
    isAdmin,
    loading,
    error,
    refreshAdminStatus: checkAdminStatus
  };
}
