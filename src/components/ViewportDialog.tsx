import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useViewportModal } from '@/hooks/useViewportModal';
import { createModalDebugger } from '@/utils/modalDebugger';

interface ViewportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  className?: string;
}

// Map maxWidth prop to actual Tailwind classes
const maxWidthMap: Record<string, string> = {
  'sm': 'max-w-sm',
  'md': 'max-w-md', 
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl'
};

export const ViewportDialog: React.FC<ViewportDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  className = ''
}) => {
  const { getModalStyles, viewport } = useViewportModal();
  const actualMaxWidth = maxWidthMap[maxWidth] || maxWidth;
  const styles = getModalStyles(actualMaxWidth);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debugDialog = createModalDebugger(`ViewportDialog-${title || 'Untitled'}`);

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
      
      // Log dialog opening
      console.log('🚀 [ViewportDialog] Dialog opened:', {
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
        console.log('🔒 [ViewportDialog] Dialog closed:', {
          title,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [isOpen, onClose, title, maxWidth, viewport]);

  // Log when dialog is about to render
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 [ViewportDialog] Dialog rendering with styles:', {
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
    }
  }, [isOpen, title, styles, viewport]);

  // Debug dialog positioning after render
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        debugDialog(dialogRef.current);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, debugDialog]);

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
      ref={dialogRef}
    >
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog content - perfectly centered within viewport */}
      <div 
        className={`relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 ${className}`}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-2xl flex-shrink-0">
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
        )}
        
        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
