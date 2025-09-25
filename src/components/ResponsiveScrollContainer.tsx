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
  // Mobile: 1 card per row, scroll when >5 rows (>5 cards)
  // Desktop: 4 cards per row, scroll when >3 rows (>12 cards)
  const shouldEnableScrolling = isMobile ? cardCount > 5 : cardCount > 12;

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
    // Mobile: 1 card per row (≤5 cards), Desktop: 4 cards per row (≤12 cards)
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    // Mobile: 1 card per row, show 5 cards at a time, vertical scrolling when >5 cards
    // Each card is approximately 4rem (64px) + 1rem (16px) gap = 80px per card
    // 5 cards = 400px total height
    return (
      <div className={`space-y-4 overflow-y-auto ${className}`} style={{ maxHeight: '400px' }}>
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
