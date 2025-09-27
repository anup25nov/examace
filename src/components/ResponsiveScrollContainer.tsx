import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface ResponsiveScrollContainerProps {
  children: React.ReactNode;
  cardCount: number;
  className?: string;
  showScrollButtons?: boolean;
}

const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  cardCount,
  className = '',
  showScrollButtons = true
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  
  // Version check to ensure updates are applied
  const VERSION = '2.0.2';
  const TIMESTAMP = Date.now();

  // Debug logging function - memoized to prevent recreating on every render
  const debugLog = useCallback((message: string, data?: any) => {
    // Only log errors and critical info in production
    if (message.includes('Error') || message.includes('Critical')) {
      console.error(`[ResponsiveScrollContainer] ${message}`, data || '');
    }
  }, []);

  // Check if device is mobile
  const checkDeviceType = () => {
    const width = window.innerWidth;
    const isMobileDevice = width < 768;
    console.log(`🔍 Device check: width=${width}, isMobile=${isMobileDevice}`);
    debugLog(`Device check: width=${width}, isMobile=${isMobileDevice}`);
    setIsMobile(isMobileDevice);
  };

  // Calculate responsive requirements based on wireframe
  const getResponsiveConfig = () => {
    console.log(`🔧 Getting responsive config - isMobile: ${isMobile}, cardCount: ${cardCount}`);
    
    if (isMobile) {
      // FORCE CACHE BUST - Mobile 3-card layout
      const config = {
        cardsPerRow: 1,
        maxVisibleCards: 3, // Show 3 cards on mobile - FORCE UPDATED
        shouldEnableScrolling: cardCount > 3,
        containerClass: "space-y-4",
        version: "2.0.2", // Cache busting
        timestamp: Date.now()
      };
      debugLog(`Mobile config (FORCE UPDATED):`, config);
      return config;
    } else {
      // Desktop: 4 cards per row, 4.5 rows = 18 cards total (increased height)
      const config = {
        cardsPerRow: 4,
        maxVisibleCards: 18, // Increased to show 18 cards on desktop
        shouldEnableScrolling: cardCount > 18,
        containerClass: "grid grid-cols-4 gap-4"
      };
      debugLog(`Desktop config:`, config);
      return config;
    }
  };

  const config = getResponsiveConfig();
  const shouldEnableScrolling = config.shouldEnableScrolling;
  
  debugLog(`Final config:`, { 
    isMobile, 
    cardCount, 
    shouldEnableScrolling, 
    config 
  });

  const checkScrollButton = () => {
    if (scrollRef.current && shouldEnableScrolling) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasMoreContent = scrollHeight > clientHeight + 10;
      const isNotAtBottom = scrollTop < scrollHeight - clientHeight - 10;
      const canScroll = hasMoreContent && isNotAtBottom;
      
      console.log(`📊 Scroll check:`, {
        scrollTop,
        scrollHeight,
        clientHeight,
        hasMoreContent,
        isNotAtBottom,
        canScroll
      });
      
      // debugLog(`Scroll check:`, {
      //   scrollTop,
      //   scrollHeight,
      //   clientHeight,
      //   hasMoreContent,
      //   isNotAtBottom,
      //   canScroll
      // });
      
      setCanScrollDown(canScroll);
    } else {
      debugLog(`Scroll disabled:`, { 
        hasRef: !!scrollRef.current, 
        shouldEnableScrolling 
      });
      setCanScrollDown(false);
    }
  };

  // Fallback scroll detection for edge cases
  const forceScrollCheck = () => {
    if (scrollRef.current && shouldEnableScrolling) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      const hasScrollableContent = scrollHeight > clientHeight;
      
      debugLog(`Force scroll check:`, {
        scrollHeight,
        clientHeight,
        hasScrollableContent,
        cardCount
      });
      
      // If we have more cards than maxVisibleCards, we should be able to scroll
      if (hasScrollableContent || cardCount > config.maxVisibleCards) {
        setCanScrollDown(true);
      }
    }
  };

  const scrollDown = () => {
    if (scrollRef.current) {
      const scrollAmount = 300; // One card height + gap
      debugLog(`Scrolling down by ${scrollAmount}px`);
      scrollRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    } else {
      debugLog(`Cannot scroll: no ref`);
    }
  };

  // Check device type on mount and resize
  useEffect(() => {
    console.log('🔄 useEffect: Checking device type on mount - FORCE REFRESH');
    console.log('🔥 CACHE BUSTING: Component mounted with version 2.0.2');
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => {
      console.log('🔄 useEffect: Cleaning up resize listener');
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // Set up scroll listeners
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && shouldEnableScrolling) {
      // Initial check with multiple attempts
      const checkMultipleTimes = () => {
        checkScrollButton();
        setTimeout(checkScrollButton, 100);
        setTimeout(checkScrollButton, 500);
        setTimeout(checkScrollButton, 1000);
      };
      
      const timeoutId = setTimeout(checkMultipleTimes, 100);
      
      scrollContainer.addEventListener('scroll', checkScrollButton, { passive: true });
      window.addEventListener('resize', checkScrollButton);
      
      // Also check when content changes
      const observer = new MutationObserver(() => {
        setTimeout(checkScrollButton, 100);
      });
      observer.observe(scrollContainer, { childList: true, subtree: true });
      
      return () => {
        clearTimeout(timeoutId);
        scrollContainer.removeEventListener('scroll', checkScrollButton);
        window.removeEventListener('resize', checkScrollButton);
        observer.disconnect();
      };
    }
  }, [shouldEnableScrolling, cardCount, isMobile]);

  // Re-check scroll button when content changes
  useEffect(() => {
    if (shouldEnableScrolling && cardCount > 0) {
      const timeoutId = setTimeout(() => {
        checkScrollButton();
        forceScrollCheck(); // Also run fallback check
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [cardCount, shouldEnableScrolling]);

  // If no scrolling needed, show all cards in responsive grid
  if (!shouldEnableScrolling) {
    return (
      <div className={`${config.containerClass} ${className}`}>
        {children}
      </div>
    );
  }

  // Calculate dynamic height based on wireframe layout
  const getContainerHeight = () => {
    if (isMobile) {
      // Mobile: Show 3 cards, each ~300px (288px card + 16px gap)
      const height = '900px'; // 3 * 300px = 900px
      debugLog(`Mobile height: ${height}`);
      return height;
    } else {
      // Desktop: Use viewport height instead of fixed height
      const height = 'calc(100vh - 300px)'; // Account for header, stats, and padding
      debugLog(`Desktop height: ${height}`);
      console.log('✅ Desktop height set to calc(100vh - 300px)');
      return height;
    }
  };

  const containerHeight = getContainerHeight();
  debugLog(`Rendering with:`, {
    shouldEnableScrolling,
    containerHeight,
    canScrollDown,
    showScrollButtons,
    childrenCount: React.Children.count(children)
  });

  return (
    <div className={`relative ${className}`}>
      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        className={`${config.containerClass} overflow-y-auto responsive-scroll-container`}
        style={{ 
          height: containerHeight,
          scrollBehavior: 'smooth',
          maxHeight: '90vh', // Prevent overflow on small screens
          minHeight: '400px' // Ensure minimum height for visibility
        }}
      >
        {children}
      </div>
      
      {/* Scroll down button - show if we have more cards than visible OR if scroll detection says we can scroll */}
      {showScrollButtons && (canScrollDown || cardCount > config.maxVisibleCards) && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <button
            onClick={scrollDown}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border-2 border-white/20"
            title={`Scroll down to see more (${cardCount - config.maxVisibleCards} more cards)`}
          >
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveScrollContainer;