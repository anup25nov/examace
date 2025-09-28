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

export const ViewportDialog: React.FC<ViewportDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  className = ''
}) => {
  const { getModalStyles, viewport } = useViewportModal();
  const styles = getModalStyles(maxWidth);
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
    <div style={styles.container} ref={dialogRef}>
      {/* Backdrop click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog content - perfectly centered within viewport */}
      <div style={styles.content} className={className}>
        {/* Header */}
        {title && (
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
        )}
        
        {/* Content */}
        <div style={title ? styles.body : { ...styles.body, padding: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
