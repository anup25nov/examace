import React from 'react';
import { cn } from '@/lib/utils';
import CachedImage from '@/components/CachedImage';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
  showLogo?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text = 'Loading...',
  showLogo = true
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const logoSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {showLogo ? (
        <div className="relative">
          <CachedImage 
            src="/logos/logo.jpeg"
            alt="S2S Logo" 
            className={cn(
              "rounded-lg object-cover border-2 border-gray-200 animate-pulse",
              logoSizeClasses[size]
            )}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            fallback="/logos/alternate_image.png"
            loading="eager"
          />
          <div 
            className={cn(
              "absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent",
              sizeClasses[size],
              className
            )} 
          />
        </div>
      ) : (
        <div 
          className={cn(
            "animate-spin rounded-full border-2 border-primary border-t-transparent",
            sizeClasses[size],
            className
          )} 
        />
      )}
      {text && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;