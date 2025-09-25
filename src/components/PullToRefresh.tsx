import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  enablePullToRefresh?: boolean; // New prop to enable/disable
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
  enablePullToRefresh = false // Default to disabled
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const touchStartedAtTop = useRef(false);

  // If pull-to-refresh is disabled, just render children
  if (!enablePullToRefresh) {
    return <>{children}</>;
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // More precise check for being at the top
    const isAtTop = window.scrollY <= 5 && document.documentElement.scrollTop <= 5;
    touchStartedAtTop.current = isAtTop;
    
    if (isAtTop) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isPulling || !touchStartedAtTop.current) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Only prevent default if we're actually pulling down significantly
    if (distance > 20 && window.scrollY <= 5) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);
    touchStartedAtTop.current = false;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enablePullToRefresh) return;

    // Use passive listeners to avoid scroll conflicts
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false }); // Only this one needs to be non-passive
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isPulling, isRefreshing, disabled, threshold, enablePullToRefresh]);

  const refreshIndicatorStyle = {
    transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
    opacity: Math.min(pullDistance / threshold, 1),
  };

  const contentStyle = {
    transform: `translateY(${Math.min(pullDistance * 0.3, threshold * 0.3)}px)`, // Reduced transform
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white/10 backdrop-blur-sm z-50 transition-all duration-200"
        style={refreshIndicatorStyle}
      >
        <div className="flex items-center space-x-2 text-white">
          <RefreshCw 
            className={`w-6 h-6 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
