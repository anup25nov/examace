import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveScrollContainerProps {
  children: React.ReactNode;
  cardCount: number;
  className?: string;
  showScrollButtons?: boolean;
}

export const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  cardCount,
  className = '',
  showScrollButtons = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we should enable scrolling
  const shouldEnableScrolling = isMobile ? cardCount > 7 : cardCount > 3;

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.scrollWidth / cardCount;
      scrollRef.current.scrollBy({
        left: -cardWidth * 2, // Scroll by 2 cards
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.scrollWidth / cardCount;
      scrollRef.current.scrollBy({
        left: cardWidth * 2, // Scroll by 2 cards
        behavior: 'smooth'
      });
    }
  };

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    checkScrollPosition();
    scrollElement.addEventListener('scroll', checkScrollPosition);
    
    return () => {
      scrollElement.removeEventListener('scroll', checkScrollPosition);
    };
  }, [cardCount]);

  if (!shouldEnableScrolling) {
    // Regular grid layout when scrolling is not needed
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    // Mobile: Vertical scrolling
    return (
      <div className={`space-y-4 max-h-96 overflow-y-auto ${className}`}>
        {children}
      </div>
    );
  }

  // Desktop: Horizontal scrolling
  return (
    <div className={`relative ${className}`}>
      {/* Scroll buttons */}
      {showScrollButtons && (
        <>
          <Button
            variant="outline"
            size="sm"
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg ${
              !canScrollLeft ? 'opacity-0 pointer-events-none' : ''
            }`}
            onClick={scrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg ${
              !canScrollRight ? 'opacity-0 pointer-events-none' : ''
            }`}
            onClick={scrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ResponsiveScrollContainer;
