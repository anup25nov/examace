import React, { useEffect, useState, useRef } from 'react';
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

  // Check if device is mobile
  const checkDeviceType = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768); // md breakpoint
  };

  // Calculate responsive requirements based on wireframe
  const getResponsiveConfig = () => {
    if (isMobile) {
      return {
        cardsPerRow: 1,
        maxVisibleCards: 3,
        shouldEnableScrolling: cardCount > 3,
        containerClass: "space-y-4"
      };
    } else {
      // Desktop: 4 cards per row, 3 rows = 12 cards total
      return {
        cardsPerRow: 4,
        maxVisibleCards: 12,
        shouldEnableScrolling: cardCount > 12,
        containerClass: "grid grid-cols-4 gap-4"
      };
    }
  };

  const config = getResponsiveConfig();
  const shouldEnableScrolling = config.shouldEnableScrolling;

  const checkScrollButton = () => {
    if (scrollRef.current && shouldEnableScrolling) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const hasMoreContent = scrollHeight > clientHeight + 10;
      const isNotAtBottom = scrollTop < scrollHeight - clientHeight - 10;
      setCanScrollDown(hasMoreContent && isNotAtBottom);
    } else {
      setCanScrollDown(false);
    }
  };

  const scrollDown = () => {
    if (scrollRef.current) {
      const scrollAmount = 300; // One card height + gap
      scrollRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  };

  // Check device type on mount and resize
  useEffect(() => {
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Set up scroll listeners
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer && shouldEnableScrolling) {
      // Initial check
      const timeoutId = setTimeout(checkScrollButton, 100);
      
      scrollContainer.addEventListener('scroll', checkScrollButton, { passive: true });
      window.addEventListener('resize', checkScrollButton);
      
      return () => {
        clearTimeout(timeoutId);
        scrollContainer.removeEventListener('scroll', checkScrollButton);
        window.removeEventListener('resize', checkScrollButton);
      };
    }
  }, [shouldEnableScrolling, cardCount, isMobile]);

  // Re-check scroll button when content changes
  useEffect(() => {
    if (shouldEnableScrolling && cardCount > 0) {
      const timeoutId = setTimeout(checkScrollButton, 300);
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
      // Mobile: Show 3 cards vertically (1x3), each ~300px (288px card + 16px gap)
      return '900px'; // 3 * 300px
    } else {
      // Desktop: Show 12 cards in 3x4 grid, each ~300px (288px card + 16px gap)
      return '900px'; // 3 rows * 300px
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Scrollable container */}
      <div 
        ref={scrollRef}
        className={`${config.containerClass} overflow-y-auto responsive-scroll-container`}
        style={{ 
          height: getContainerHeight(),
          scrollBehavior: 'smooth',
          maxHeight: '90vh' // Prevent overflow on small screens
        }}
      >
        {children}
      </div>
      
      {/* Scroll down button */}
      {showScrollButtons && canScrollDown && (
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