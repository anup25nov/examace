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
  threshold = 30,
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
  
  // Debug logging
  console.log('SwipeToGoBack: Current path:', location.pathname, 'Can go back:', canGoBack, 'History length:', window.history.length);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isGoingBack) {
      console.log('SwipeToGoBack: Touch start blocked', { disabled, isGoingBack });
      return;
    }
    
    // Only start swipe from the left edge of the screen (first 50px for better precision)
    const touch = e.touches[0];
    console.log('SwipeToGoBack: Touch start', { clientX: touch.clientX, clientY: touch.clientY });
    
    if (touch.clientX > 50) {
      console.log('SwipeToGoBack: Touch too far from left edge');
      return;
    }
    
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    setIsSwipeActive(true);
    console.log('SwipeToGoBack: Swipe started');
    onSwipeStart?.();
  }, [disabled, isGoingBack, onSwipeStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isSwipeActive || isGoingBack) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    
    console.log('SwipeToGoBack: Touch move', { deltaX, deltaY, isHorizontal: Math.abs(deltaX) > Math.abs(deltaY) });
    
    // Only allow horizontal swipes (more horizontal than vertical movement)
    // And only allow right swipes (going back)
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      e.preventDefault();
      e.stopPropagation();
      currentX.current = touch.clientX;
      setSwipeDistance(Math.min(deltaX, threshold * 2));
      console.log('SwipeToGoBack: Swipe distance updated', Math.min(deltaX, threshold * 2));
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // If it's more vertical than horizontal, cancel the swipe
      console.log('SwipeToGoBack: Swipe cancelled - too vertical');
      setIsSwipeActive(false);
      setSwipeDistance(0);
    }
  }, [disabled, isSwipeActive, isGoingBack, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isSwipeActive || isGoingBack) return;

    console.log('SwipeToGoBack: Touch end', { swipeDistance, threshold, canGoBack });
    
    setIsSwipeActive(false);
    onSwipeEnd?.();
    
    if (swipeDistance >= threshold) {
      console.log('SwipeToGoBack: Navigating back');
      setIsGoingBack(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        try {
          // Check if we can still go back and prevent app closing
          if (window.history.length > 1 && canGoBack) {
            // Use replace instead of push to maintain state
            navigate(-1);
            console.log('SwipeToGoBack: Navigated back successfully');
          } else {
            // Fallback: go to home page instead of closing app
            console.log('SwipeToGoBack: No history to go back, navigating to home');
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback: go to home page instead of closing app
          navigate('/', { replace: true });
        }
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
