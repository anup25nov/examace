import React, { useState, useEffect } from 'react';
import { cacheService } from '@/lib/cacheService';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: 'eager' | 'lazy';
  [key: string]: any;
}

const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  fallback = '/logos/alternate_image.png',
  onError,
  loading = 'eager',
  ...props
}) => {
  const [cachedSrc, setCachedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadCachedImage = async () => {
      if (!src) return;

      try {
        setIsLoading(true);
        setHasError(false);

        // Try to get cached image
        const cachedUrl = await cacheService.cacheImage(src);
        setCachedSrc(cachedUrl);
      } catch (error) {
        console.error('Failed to load cached image:', error);
        setCachedSrc(src); // Fallback to original URL
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedImage();
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('Image failed to load:', src);
    setHasError(true);
    setCachedSrc(fallback);
    onError?.(e);
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={cachedSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={style}
        onError={handleError}
        loading={loading}
        {...props}
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          Image unavailable
        </div>
      )}
    </div>
  );
};

export default CachedImage;
