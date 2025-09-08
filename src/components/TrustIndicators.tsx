import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Users, 
  Star,
  Award,
  Clock,
  Heart
} from 'lucide-react';

interface TrustIndicatorsProps {
  className?: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ className = '' }) => {
  const trustFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Payments",
      description: "256-bit SSL encryption",
      color: "text-green-600"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "10,000+ Students",
      description: "Trusted by thousands",
      color: "text-blue-600"
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Money Back Guarantee",
      description: "7-day refund policy",
      color: "text-purple-600"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "24/7 Support",
      description: "Always here to help",
      color: "text-orange-600"
    }
  ];

  const securityBadges = [
    { name: "SSL Secured", icon: "🔒" },
    { name: "PCI Compliant", icon: "🛡️" },
    { name: "GDPR Ready", icon: "🔐" },
    { name: "ISO 27001", icon: "⭐" }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Trust Features */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md mb-2 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-sm text-gray-800 mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Badges */}
      <div className="flex flex-wrap justify-center gap-2">
        {securityBadges.map((badge, index) => (
          <Badge key={index} variant="secondary" className="bg-white border border-gray-200 text-gray-700">
            <span className="mr-1">{badge.icon}</span>
            {badge.name}
          </Badge>
        ))}
      </div>

      {/* Testimonials */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-sm text-gray-700 mb-2">
              "ExamAce helped me score 95% in SSC CGL. The mock tests are exactly like real exams!"
            </p>
            <p className="text-xs text-gray-600 font-medium">- Priya Sharma, SSC CGL Topper</p>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-lg font-bold text-blue-600">10K+</div>
          <div className="text-xs text-gray-600">Students</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-lg font-bold text-green-600">95%</div>
          <div className="text-xs text-gray-600">Success Rate</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-lg font-bold text-purple-600">4.9★</div>
          <div className="text-xs text-gray-600">Rating</div>
        </div>
      </div>
    </div>
  );
};

// Loading States Component
export const LoadingStates: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Skeleton Loader */}
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Application error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600 mb-4">We're working to fix this issue. Please try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

// Network Status Component
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-sm">You're offline. Some features may not work.</span>
      </div>
    </div>
  );
};
