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
        previousViewport: viewport,
        // Additional viewport info for debugging
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        bodyHeight: document.body.scrollHeight,
        bodyWidth: document.body.scrollWidth
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
    const contentMaxHeight = isMobile ? '85vh' : '75vh'; // Further reduced to ensure perfect fit
    
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
        padding: isMobile ? '12px' : '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        // Ensure container covers exactly the viewport
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'hidden' as const,
        // Force proper centering with exact viewport dimensions
        minWidth: '100vw',
        minHeight: '100vh',
        // Ensure no transforms or positioning issues
        transform: 'none',
        margin: 0,
        border: 'none',
      },
      content: {
        width: isMobile ? '100%' : 'auto', // Only full width on mobile
        maxWidth: contentMaxWidth,
        maxHeight: contentMaxHeight,
        margin: '0', // Remove margins that could cause overflow
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative' as const,
        // Ensure content stays within viewport but maintains good proportions
        minWidth: isMobile ? '0' : '320px', // Minimum width for desktop
        minHeight: '0',
        // Force proper positioning - ensure it's centered
        transform: 'none',
        top: 'auto',
        left: 'auto',
        right: 'auto',
        bottom: 'auto',
        // Force flex centering
        alignSelf: 'center',
        justifySelf: 'center',
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
        maxHeight: isMobile ? 'calc(85vh - 60px)' : 'calc(75vh - 80px)',
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
      // Additional centering info
      containerDimensions: {
        width: styles.container.width,
        height: styles.container.height,
        minWidth: styles.container.minWidth,
        minHeight: styles.container.minHeight
      },
      contentDimensions: {
        width: styles.content.width,
        maxWidth: styles.content.maxWidth,
        maxHeight: styles.content.maxHeight,
        alignSelf: styles.content.alignSelf,
        justifySelf: styles.content.justifySelf
      },
      timestamp: new Date().toISOString()
    });

    return styles;
  };

  // Add CSS class for perfect centering
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Add a global CSS class for perfect modal centering
      const style = document.createElement('style');
      style.textContent = `
        .modal-perfect-center {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          min-width: 100vw !important;
          min-height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 50 !important;
          transform: none !important;
          margin: 0 !important;
          padding: 12px !important;
          overflow: hidden !important;
          box-sizing: border-box !important;
        }
        
        .modal-content-perfect-center {
          position: relative !important;
          transform: none !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          margin: 0 !important;
          align-self: center !important;
          justify-self: center !important;
          max-height: 75vh !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
        }
        
        @media (max-width: 767px) {
          .modal-perfect-center {
            padding: 8px !important;
          }
          .modal-content-perfect-center {
            max-height: 85vh !important;
          }
        }
        
        /* Additional overrides for any conflicting styles */
        .modal-perfect-center * {
          box-sizing: border-box !important;
        }
        
        /* Force override any existing positioning */
        [class*="modal"] {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 50 !important;
          transform: none !important;
          margin: 0 !important;
          padding: 12px !important;
          overflow: hidden !important;
        }
      `;
      
      if (!document.head.querySelector('#modal-perfect-center-styles')) {
        style.id = 'modal-perfect-center-styles';
        document.head.appendChild(style);
      }
    }
  }, []);

  return {
    viewport,
    getModalStyles,
  };
};
