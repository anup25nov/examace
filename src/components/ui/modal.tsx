import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-6xl'
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  className,
  contentClassName
}) => {
  if (!isOpen) return null;

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200",
        className
      )}
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
        paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
        paddingRight: 'max(env(safe-area-inset-right), 1rem)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "relative w-full bg-white rounded-xl shadow-2xl",
          "max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)]",
          "overflow-hidden flex flex-col",
          "animate-in zoom-in-95 slide-in-from-bottom-4 duration-200",
          sizeClasses[size],
          contentClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// Specialized modal components for common use cases
export const PaymentModal: React.FC<Omit<ModalProps, 'size'>> = (props) => (
  <Modal {...props} size="lg" />
);

export const MembershipModal: React.FC<Omit<ModalProps, 'size'>> = (props) => (
  <Modal {...props} size="xl" />
);

export const FullScreenModal: React.FC<Omit<ModalProps, 'size'>> = (props) => (
  <Modal {...props} size="full" />
);

export const SmallModal: React.FC<Omit<ModalProps, 'size'>> = (props) => (
  <Modal {...props} size="sm" />
);
