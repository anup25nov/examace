import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
  direction: 'horizontal' | 'vertical' | null;
}

interface UseMobileGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  swipeThreshold?: number;
  pullThreshold?: number;
  disabled?: boolean;
}

export const useMobileGestures = (options: UseMobileGesturesOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    swipeThreshold = 100,
    pullThreshold = 80,
    disabled = false
  } = options;

  const [gestureState, setGestureState] = useState<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isActive: false,
    direction: null
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const touch = e.touches[0];
    setGestureState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isActive: true,
      direction: null
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !gestureState.isActive || isRefreshing) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureState.startX;
    const deltaY = touch.clientY - gestureState.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine gesture direction
    let direction = gestureState.direction;
    if (!direction && (absDeltaX > 10 || absDeltaY > 10)) {
      direction = absDeltaX > absDeltaY ? 'horizontal' : 'vertical';
    }

    // Prevent default for horizontal swipes and pull-to-refresh
    if (direction === 'horizontal' || (direction === 'vertical' && deltaY > 0 && window.scrollY === 0)) {
      e.preventDefault();
    }

    setGestureState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction
    }));
  };

  const handleTouchEnd = async () => {
    if (disabled || !gestureState.isActive || isRefreshing) return;

    const deltaX = gestureState.currentX - gestureState.startX;
    const deltaY = gestureState.currentY - gestureState.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Handle horizontal swipes
    if (gestureState.direction === 'horizontal') {
      if (absDeltaX > swipeThreshold) {
        if (deltaX > 0) {
          // Swipe right - go back
          if (location.pathname !== '/' && location.pathname !== '/home') {
            navigate(-1);
          }
          onSwipeRight?.();
        } else {
          // Swipe left
          onSwipeLeft?.();
        }
      }
    }

    // Handle vertical swipes
    if (gestureState.direction === 'vertical') {
      if (absDeltaY > swipeThreshold) {
        if (deltaY > 0) {
          // Swipe down
          onSwipeDown?.();
        } else {
          // Swipe up
          onSwipeUp?.();
        }
      }
    }

    // Handle pull-to-refresh
    if (gestureState.direction === 'vertical' && deltaY > pullThreshold && window.scrollY === 0) {
      if (onPullToRefresh) {
        setIsRefreshing(true);
        try {
          await onPullToRefresh();
        } catch (error) {
          console.error('Pull to refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }

    // Reset gesture state
    setGestureState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isActive: false,
      direction: null
    });
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
  }, [gestureState, disabled, isRefreshing, location.pathname, navigate]);

  return {
    containerRef,
    gestureState,
    isRefreshing,
    isSwipeActive: gestureState.isActive && gestureState.direction === 'horizontal',
    isPullActive: gestureState.isActive && gestureState.direction === 'vertical' && gestureState.currentY > gestureState.startY
  };
};

export default useMobileGestures;
