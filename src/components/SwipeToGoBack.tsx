import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface SwipeToGoBackProps {
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const SwipeToGoBack: React.FC<SwipeToGoBackProps> = ({
  children,
  threshold = 80,
  disabled = false,
  onSwipeStart,
  onSwipeEnd
}) => {
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we can go back
  const canGoBack = location.pathname !== '/' && location.pathname !== '/home' && window.history.length > 1;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isGoingBack || !canGoBack) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    setIsSwipeActive(true);
    onSwipeStart?.();
  }, [disabled, isGoingBack, canGoBack, onSwipeStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isSwipeActive || isGoingBack || !canGoBack) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    // Only allow horizontal swipes (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      e.preventDefault();
      e.stopPropagation();
      currentX.current = touch.clientX;
      setSwipeDistance(Math.min(deltaX, threshold * 2));
    }
  }, [disabled, isSwipeActive, isGoingBack, canGoBack, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isSwipeActive || isGoingBack || !canGoBack) return;

    setIsSwipeActive(false);
    onSwipeEnd?.();
    
    if (swipeDistance >= threshold) {
      setIsGoingBack(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        navigate(-1);
        setIsGoingBack(false);
        setSwipeDistance(0);
      }, 200);
    } else {
      setSwipeDistance(0);
    }
  }, [disabled, isSwipeActive, isGoingBack, canGoBack, swipeDistance, threshold, navigate, onSwipeEnd]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add touch event listeners with proper options
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const swipeIndicatorStyle = {
    transform: `translateX(${Math.min(swipeDistance - threshold, 0)}px)`,
    opacity: Math.min(swipeDistance / threshold, 1),
  };

  const contentStyle = {
    transform: `translateX(${Math.min(swipeDistance * 0.2, threshold * 0.2)}px)`,
    transition: isGoingBack ? 'transform 0.2s ease-out' : 'none',
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden h-full">
      {/* Swipe Indicator */}
      {(isSwipeActive || isGoingBack) && swipeDistance > 20 && (
        <div
          className="fixed top-1/2 left-0 transform -translate-y-1/2 z-50 flex items-center justify-center bg-blue-600/90 backdrop-blur-sm rounded-r-lg shadow-lg"
          style={swipeIndicatorStyle}
        >
          <div className="flex items-center space-x-2 text-white p-3">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-medium">
              {isGoingBack ? 'Going back...' : 'Swipe to go back'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={contentStyle} className="h-full">
        {children}
      </div>
    </div>
  );
};

export default SwipeToGoBack;
