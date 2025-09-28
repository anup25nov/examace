import { useEffect, useState } from 'react';

interface ViewportDimensions {
  width: number;
  height: number;
  isMobile: boolean;
}

export const useViewportModal = () => {
  const [viewport, setViewport] = useState<ViewportDimensions>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  });

  useEffect(() => {
    const updateViewport = () => {
      const newViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
      };
      
      console.log('🔄 [useViewportModal] Viewport updated:', {
        ...newViewport,
        timestamp: new Date().toISOString(),
        previousViewport: viewport
      });
      
      setViewport(newViewport);
    };

    // Update on mount
    updateViewport();

    // Add event listeners
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const getModalStyles = (maxWidth: string = 'max-w-md') => {
    const isMobile = viewport.isMobile;
    
    // Calculate safe viewport dimensions with proper margins
    const safeViewportWidth = viewport.width - (isMobile ? 8 : 32); // 4px margin on each side for mobile, 16px for desktop
    const safeViewportHeight = viewport.height - (isMobile ? 8 : 32);
    
    // Calculate content dimensions to ensure they fit within viewport
    const contentMaxWidth = isMobile ? '100%' : maxWidth;
    const contentMaxHeight = isMobile ? '96vh' : '88vh'; // Reduced to ensure it fits
    
    const styles = {
      container: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '4px' : '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        // Ensure container doesn't cause overflow
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'hidden' as const,
      },
      content: {
        width: '100%',
        maxWidth: contentMaxWidth,
        maxHeight: contentMaxHeight,
        margin: '0', // Remove margins that could cause overflow
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative' as const,
        // Ensure content stays within viewport
        minWidth: '0',
        minHeight: '0',
      },
      header: {
        position: 'sticky' as const,
        top: 0,
        zIndex: 10,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '12px' : '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px 16px 0 0',
        // Ensure header doesn't cause overflow
        minHeight: '0',
        flexShrink: 0,
      },
      body: {
        maxHeight: isMobile ? 'calc(96vh - 60px)' : 'calc(88vh - 80px)',
        overflowY: 'auto' as const,
        padding: isMobile ? '12px' : '16px',
        // Ensure body content can scroll properly
        minHeight: '0',
        flex: '1',
      },
    };

    // Log modal positioning details
    console.log('📐 [useViewportModal] Modal styles calculated:', {
      viewport: viewport,
      isMobile,
      maxWidth,
      containerPadding: styles.container.padding,
      contentMaxWidth: styles.content.maxWidth,
      contentMaxHeight: styles.content.maxHeight,
      contentMargin: styles.content.margin,
      bodyMaxHeight: styles.body.maxHeight,
      timestamp: new Date().toISOString()
    });

    return styles;
  };

  return {
    viewport,
    getModalStyles,
  };
};
