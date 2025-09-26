import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Always enable scrolling for better UX
  // This ensures both PYQ and Mock sections have consistent scrolling behavior
  const shouldEnableScrolling = true;

  const checkScrollButton = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // More precise scroll detection
      const hasMoreContent = scrollHeight > clientHeight + 10; // 10px tolerance
      const isNotAtBottom = scrollTop < scrollHeight - clientHeight - 10;
      const shouldShowButton = hasMoreContent && isNotAtBottom;
      setCanScrollDown(shouldShowButton);
    }
  };

  const scrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Set up scroll listeners when scrolling is enabled
  useEffect(() => {
    if (shouldEnableScrolling) {
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        // Initial check with a small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
          checkScrollButton();
        }, 100);
        
        scrollContainer.addEventListener('scroll', checkScrollButton);
        window.addEventListener('resize', checkScrollButton);
        
        return () => {
          clearTimeout(timeoutId);
          scrollContainer.removeEventListener('scroll', checkScrollButton);
          window.removeEventListener('resize', checkScrollButton);
        };
      }
    }
  }, [shouldEnableScrolling, cardCount]); // Add cardCount dependency

  // Additional effect to check scroll button when content changes
  useEffect(() => {
    if (shouldEnableScrolling && cardCount > 0) {
      const timeoutId = setTimeout(() => {
        checkScrollButton();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cardCount, shouldEnableScrolling]);

  if (!shouldEnableScrolling) {
    // Regular grid layout when scrolling is not needed
    // Responsive: 1 card on mobile, 2 on tablet, 4 on desktop
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    // Mobile: 1 card per row, show 4-5 cards (4.5 cards visible)
    const cardHeight = 288; // h-72 = 18rem = 288px
    const gap = 16; // gap-4 = 1rem = 16px
    const visibleCards = 4.5;
    const containerHeight = (cardHeight + gap) * visibleCards;
    
    return (
      <div className={`relative ${className}`}>
        {/* Scrollable container with vertical scroll */}
        <div 
          ref={scrollRef}
          className="space-y-4 overflow-y-auto scrollbar-hide" 
          style={{ height: `${containerHeight}px`, scrollBehavior: 'smooth' }}
        >
          {children}
        </div>
        
        {/* Down scroll button */}
        {showScrollButtons && canScrollDown && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={scrollDown}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              title="Scroll down"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet: Show 4-5 cards (2 rows with 2-4 cards per row)
  const cardHeight = 288; // h-72 = 18rem = 288px
  const gap = 16; // gap-4 = 1rem = 16px
  const rows = 2;
  const containerHeight = (cardHeight + gap) * rows;
  
  return (
    <div className={`relative ${className}`}>
      {/* Scrollable container with vertical scroll */}
      <div 
        ref={scrollRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto scrollbar-hide" 
        style={{ height: `${containerHeight}px`, scrollBehavior: 'smooth' }}
      >
        {children}
      </div>
      
      {/* Down scroll button */}
      {showScrollButtons && canScrollDown && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={scrollDown}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            title="Scroll down"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveScrollContainer;