import { useEffect, useCallback } from 'react';

interface UseModalOptions {
  preventBodyScroll?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
}

export const useModal = (
  isOpen: boolean,
  onClose: () => void,
  options: UseModalOptions = {}
) => {
  const {
    preventBodyScroll = true,
    closeOnEscape = true,
    closeOnOverlayClick = true
  } = options;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && preventBodyScroll) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Add modal-open class
      document.body.classList.add('modal-open');
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        
        // Remove modal-open class
        document.body.classList.remove('modal-open');
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  return {
    handleOverlayClick,
    modalProps: {
      className: 'modal-container',
      onClick: handleOverlayClick,
    },
    contentProps: {
      className: 'modal-content',
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
    }
  };
};
