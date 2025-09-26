import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <img 
          src="/logos/logo.jpeg"
          alt="S2S Logo" 
          className="w-16 h-16 mx-auto rounded-lg object-cover border-2 border-gray-200 animate-pulse"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          onError={(e) => {
            e.currentTarget.src = '/logos/alternate_image.png';
          }}
          loading="eager"
        />
        <div className="absolute inset-0 w-16 h-16 mx-auto gradient-primary rounded-full flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-foreground">Loading...</h2>
      <p className="text-muted-foreground">Please wait while we prepare your content</p>
    </div>
  </div>
);

// Lazy load the enhanced exam dashboard
const LazyEnhancedExamDashboard = lazy(() => import('@/pages/EnhancedExamDashboard'));

const EnhancedExamDashboardWrapper: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyEnhancedExamDashboard />
    </Suspense>
  );
};

export { EnhancedExamDashboardWrapper };
