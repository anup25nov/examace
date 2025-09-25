import React, { useEffect, useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  // Check if we should enable scrolling
  // Mobile: 1 card per row, scroll when >7 rows (>7 cards)
  // Desktop: 4 cards per row, scroll when >3 rows (>12 cards)
  const shouldEnableScrolling = isMobile ? cardCount > 7 : cardCount > 12;

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!shouldEnableScrolling) {
    // Regular grid layout when scrolling is not needed
    // Mobile: 1 card per row, Desktop: 4 cards per row
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    // Mobile: 1 card per row, vertical scrolling when >7 cards
    return (
      <div className={`space-y-4 max-h-96 overflow-y-auto ${className}`}>
        {children}
      </div>
    );
  }

  // Desktop: 4 cards per row, vertical scrolling when >12 cards
  return (
    <div className={`space-y-4 max-h-96 overflow-y-auto ${className}`}>
      <div className="grid grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveScrollContainer;
