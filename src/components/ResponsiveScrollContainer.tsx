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

  // Check if we should enable scrolling
  // Enable scrolling when any cards appear in the next row
  // Mobile: 1 card per row, scroll when >1 card (any card in row 2)
  // Tablet: 2 cards per row, scroll when >2 cards (any card in row 2)
  // Desktop: 4 cards per row, scroll when >4 cards (any card in row 2)
  const getCardsPerRow = () => {
    if (window.innerWidth < 640) return 1; // sm: 1 card
    if (window.innerWidth < 1024) return 2; // md: 2 cards
    return 4; // lg+: 4 cards
  };
  
  const cardsPerRow = getCardsPerRow();
  // Enable scrolling when more than 1 complete row (any cards in next row)
  const shouldEnableScrolling = cardCount > cardsPerRow;

  const checkScrollButton = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1);
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
        checkScrollButton();
        scrollContainer.addEventListener('scroll', checkScrollButton);
        window.addEventListener('resize', checkScrollButton);
        
        return () => {
          scrollContainer.removeEventListener('scroll', checkScrollButton);
          window.removeEventListener('resize', checkScrollButton);
        };
      }
    }
  }, [shouldEnableScrolling]);

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
    // Mobile: 1 card per row × 5-8 rows, then vertical scroll
    return (
      <div className={`relative ${className}`}>
        {/* Scrollable container with vertical scroll */}
        <div 
          ref={scrollRef}
          className="space-y-4 overflow-y-auto scrollbar-hide" 
          style={{ height: '500px', scrollBehavior: 'smooth' }}
        >
          {children}
        </div>
        
        {/* Down scroll button */}
        {showScrollButtons && canScrollDown && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={scrollDown}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet: 2-4 cards per row × 2 rows, then vertical scroll
  return (
    <div className={`relative ${className}`}>
      {/* Scrollable container with vertical scroll */}
        <div 
          ref={scrollRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto scrollbar-hide" 
          style={{ height: '500px', scrollBehavior: 'smooth' }}
        >
        {children}
      </div>
      
      {/* Down scroll button */}
      {showScrollButtons && canScrollDown && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={scrollDown}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveScrollContainer;