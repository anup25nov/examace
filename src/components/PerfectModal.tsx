import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PerfectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  className?: string;
}

export const PerfectModal: React.FC<PerfectModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-4xl',
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.height = 'unset';
    };
  }, [isOpen, onClose]);

  // Debug positioning
  useEffect(() => {
    if (isOpen && modalRef.current && contentRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const modal = modalRef.current;
        const content = contentRef.current;
        
        if (!modal || !content) return;
        
        console.log('🔍 [PerfectModal] Debug positioning:', {
          modal: {
            boundingRect: modal.getBoundingClientRect(),
            computedStyle: {
              position: window.getComputedStyle(modal).position,
              display: window.getComputedStyle(modal).display,
              alignItems: window.getComputedStyle(modal).alignItems,
              justifyContent: window.getComputedStyle(modal).justifyContent,
              width: window.getComputedStyle(modal).width,
              height: window.getComputedStyle(modal).height,
              top: window.getComputedStyle(modal).top,
              left: window.getComputedStyle(modal).left,
              right: window.getComputedStyle(modal).right,
              bottom: window.getComputedStyle(modal).bottom,
              transform: window.getComputedStyle(modal).transform,
              margin: window.getComputedStyle(modal).margin,
              padding: window.getComputedStyle(modal).padding
            }
          },
          content: {
            boundingRect: content.getBoundingClientRect(),
            computedStyle: {
              position: window.getComputedStyle(content).position,
              width: window.getComputedStyle(content).width,
              height: window.getComputedStyle(content).height,
              maxHeight: window.getComputedStyle(content).maxHeight,
              overflow: window.getComputedStyle(content).overflow,
              transform: window.getComputedStyle(content).transform,
              margin: window.getComputedStyle(content).margin,
              padding: window.getComputedStyle(content).padding
            }
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        });

        // Check if modal is properly centered
        const modalRect = modal.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        const isModalCentered = Math.abs(modalRect.top) < 10 && Math.abs(modalRect.left) < 10;
        const isContentCentered = Math.abs(contentRect.top - (viewportHeight - contentRect.height) / 2) < 50;
        const isContentInViewport = contentRect.top >= 0 && contentRect.bottom <= viewportHeight;
        
        console.log('🎯 [PerfectModal] Centering check:', {
          isModalCentered,
          isContentCentered,
          isContentInViewport,
          modalTop: modalRect.top,
          modalLeft: modalRect.left,
          contentTop: contentRect.top,
          contentBottom: contentRect.bottom,
          viewportHeight,
          expectedContentTop: (viewportHeight - contentRect.height) / 2,
          actualContentTop: contentRect.top,
          difference: Math.abs(contentRect.top - (viewportHeight - contentRect.height) / 2)
        });

        // If not properly centered, try to force it
        if (!isContentInViewport || !isContentCentered) {
          console.log('⚠️ [PerfectModal] Modal not properly centered, attempting to fix...');
          
          // Force the modal to be centered by updating styles
          modal.style.display = 'flex';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.right = '0';
          modal.style.bottom = '0';
          modal.style.width = '100vw';
          modal.style.height = '100vh';
          modal.style.zIndex = '50';
          modal.style.margin = '0';
          modal.style.padding = '16px';
          modal.style.boxSizing = 'border-box';
          
          content.style.maxHeight = '70vh';
          content.style.overflowY = 'auto';
          content.style.position = 'relative';
          content.style.transform = 'none';
          content.style.margin = '0';
          content.style.boxSizing = 'border-box';
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
        boxSizing: 'border-box',
        margin: 0,
        border: 'none',
        outline: 'none',
        transform: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Backdrop click to close */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={contentRef}
        className={`relative w-full ${maxWidth} max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 ${className}`}
      >

        {/* Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
