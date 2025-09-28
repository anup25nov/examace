import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useViewportModal } from '@/hooks/useViewportModal';
import { createModalDebugger } from '@/utils/modalDebugger';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  showCloseButton?: boolean;
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm', // 384px
  md: 'max-w-md', // 448px
  lg: 'max-w-lg', // 512px
  xl: 'max-w-xl', // 576px
  '2xl': 'max-w-2xl', // 672px
  '4xl': 'max-w-4xl' // 896px
};

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  className = ''
}) => {
  const { getModalStyles, viewport } = useViewportModal();
  const styles = getModalStyles(maxWidthClasses[maxWidth]);
  const modalRef = useRef<HTMLDivElement>(null);
  const debugModal = createModalDebugger(`ModalWrapper-${title}`);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      // Log modal opening
      console.log('🚀 [ModalWrapper] Modal opened:', {
        title,
        maxWidth,
        viewport,
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
      
      if (isOpen) {
        console.log('🔒 [ModalWrapper] Modal closed:', {
          title,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [isOpen, onClose, title, maxWidth, viewport]);

  // Log when modal is about to render
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 [ModalWrapper] Modal rendering with styles:', {
        title,
        styles: {
          container: styles.container,
          content: styles.content,
          header: styles.header,
          body: styles.body
        },
        viewport,
        timestamp: new Date().toISOString()
      });
      
      // Additional debugging for Choose Plan modal
      if (title === 'Choose Membership Plan') {
        console.log('🎯 [ModalWrapper] Choose Plan modal specific debug:', {
          containerStyle: styles.container,
          contentStyle: styles.content,
          headerStyle: styles.header,
          bodyStyle: styles.body,
          isMobile: viewport.isMobile,
          viewportDimensions: { width: viewport.width, height: viewport.height }
        });
      }
    }
  }, [isOpen, title, styles, viewport]);

  // Debug modal positioning after render
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        debugModal(modalRef.current);
        
        // Also add to global modal registry for debugging
        if (typeof window !== 'undefined') {
          if (!(window as any).activeModals) {
            (window as any).activeModals = new Map();
          }
          (window as any).activeModals.set(title, modalRef.current);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (!isOpen && typeof window !== 'undefined' && (window as any).activeModals) {
      // Remove from global registry when modal closes
      (window as any).activeModals.delete(title);
    }
  }, [isOpen, debugModal, title]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        ...styles.container,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        minWidth: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        transform: 'none',
        margin: 0,
        padding: viewport.isMobile ? '8px' : '12px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }} 
      className="modal-perfect-center" 
      ref={modalRef}
    >
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content - perfectly centered within viewport */}
      <div 
        style={{
          ...styles.content,
          position: 'relative',
          transform: 'none',
          top: 'auto',
          left: 'auto',
          right: 'auto',
          bottom: 'auto',
          margin: 0,
          alignSelf: 'center',
          justifySelf: 'center',
          maxHeight: viewport.isMobile ? '85vh' : '75vh',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }} 
        className={`modal-content-perfect-center ${className}`}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 className="text-lg sm:text-xl font-bold truncate pr-2">{title}</h2>
          {showCloseButton && (
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Content */}
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
};
