import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupabaseAuthFlow } from '@/components/auth/SupabaseAuthFlow';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Auth = () => {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

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

  return <SupabaseAuthFlow />;
};

export default Auth;