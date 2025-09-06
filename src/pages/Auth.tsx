import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SupabaseAuthFlow from '@/components/auth/SupabaseAuthFlow';
import { isUserAuthenticated } from '@/lib/supabaseAuth';

const Auth = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = isUserAuthenticated();
      console.log('Auth check result:', isAuth);
      console.log('localStorage state:', {
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        userId: localStorage.getItem('userId'),
        userEmail: localStorage.getItem('userEmail')
      });
      console.log('Environment:', {
        isDev: import.meta.env.DEV,
        hostname: window.location.hostname
      });
      
      if (isAuth) {
        console.log('User is authenticated, redirecting to dashboard');
        navigate('/', { replace: true });
      } else {
        console.log('User is not authenticated, showing auth form');
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleAuthSuccess = () => {
    console.log('Auth success callback triggered');
    console.log('Current auth state:', {
      isAuthenticated: localStorage.getItem('isAuthenticated'),
      userId: localStorage.getItem('userId'),
      userEmail: localStorage.getItem('userEmail')
    });
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SupabaseAuthFlow onAuthSuccess={handleAuthSuccess} />
    </div>
  );
};

export default Auth;