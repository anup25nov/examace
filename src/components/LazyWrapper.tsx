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

// Lazy load components
export const LazyExamDashboard = lazy(() => import('@/pages/ExamDashboard'));
export const LazyProfessionalExamDashboard = lazy(() => import('@/pages/ProfessionalExamDashboard'));
export const LazyReferralPage = lazy(() => import('@/pages/ReferralPage'));
export const LazyTestInterface = lazy(() => import('@/pages/TestInterface'));
export const LazyResultAnalysis = lazy(() => import('@/pages/ResultAnalysis'));
export const LazyAuth = lazy(() => import('@/pages/Auth'));
export const LazySolutionsViewer = lazy(() => import('@/pages/SolutionsViewer'));

// Wrapper components with Suspense
export const ExamDashboardWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyExamDashboard />
  </Suspense>
);

export const TestInterfaceWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyTestInterface />
  </Suspense>
);

export const ResultAnalysisWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyResultAnalysis />
  </Suspense>
);

export const AuthWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyAuth />
  </Suspense>
);

export const SolutionsViewerWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazySolutionsViewer />
  </Suspense>
);

export const ProfessionalExamDashboardWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyProfessionalExamDashboard />
  </Suspense>
);

export const ReferralPageWrapper = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <LazyReferralPage />
  </Suspense>
);
