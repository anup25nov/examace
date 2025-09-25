import React, { useState, useEffect, useRef } from 'react';
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
  threshold = 100,
  disabled = false,
  onSwipeStart,
  onSwipeEnd
}) => {
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isGoingBack) return;
    
    // Only trigger if we're not on the home page
    if (location.pathname === '/' || location.pathname === '/home') return;
    
    startX.current = e.touches[0].clientX;
    setIsSwipeActive(true);
    onSwipeStart?.();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !isSwipeActive || isGoingBack) return;

    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;
    
    // Only allow right swipe (going back)
    if (distance > 0) {
      e.preventDefault();
      setSwipeDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || !isSwipeActive || isGoingBack) return;

    setIsSwipeActive(false);
    onSwipeEnd?.();
    
    if (swipeDistance >= threshold) {
      setIsGoingBack(true);
      
      // Add a small delay for visual feedback
      setTimeout(() => {
        navigate(-1);
        setIsGoingBack(false);
        setSwipeDistance(0);
      }, 150);
    } else {
      setSwipeDistance(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [swipeDistance, isSwipeActive, isGoingBack, disabled, threshold, location.pathname]);

  const swipeIndicatorStyle = {
    transform: `translateX(${Math.min(swipeDistance - threshold, 0)}px)`,
    opacity: Math.min(swipeDistance / threshold, 1),
  };

  const contentStyle = {
    transform: `translateX(${Math.min(swipeDistance * 0.3, threshold * 0.3)}px)`,
    transition: isGoingBack ? 'transform 0.15s ease-out' : 'none',
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Swipe Indicator */}
      {(isSwipeActive || isGoingBack) && swipeDistance > 0 && (
        <div
          className="absolute top-1/2 left-0 transform -translate-y-1/2 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-r-lg"
          style={swipeIndicatorStyle}
        >
          <div className="flex items-center space-x-2 text-white p-2">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-medium">
              {isGoingBack ? 'Going back...' : 'Swipe to go back'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default SwipeToGoBack;
