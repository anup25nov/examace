import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  console.log('🔍 [ProtectedRoute] State:', { loading, isAuthenticated, pathname: location.pathname });

  // Add delay before redirecting to prevent premature redirects during hard refresh
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    } else {
      setShouldRedirect(false);
    }
  }, [loading, isAuthenticated]);

  // Show loading screen while authentication is being checked
  if (loading) {
    console.log('🔍 [ProtectedRoute] Showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
          <p className="text-xs text-gray-500">ProtectedRoute loading</p>
        </div>
      </div>
    );
  }

  // Only redirect to auth if we're sure the user is not authenticated after delay
  if (!isAuthenticated && shouldRedirect) {
    console.log('🔍 [ProtectedRoute] User not authenticated, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while waiting for redirect decision
  if (!isAuthenticated && !shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 [ProtectedRoute] User authenticated, rendering children');
  return <>{children}</>;
};