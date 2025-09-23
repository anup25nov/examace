import React, { useEffect } from 'react';
import { getSecurityConfig } from '@/config/securityConfig';

interface ContentProtectionProps {
  children: React.ReactNode;
  enableProtection?: boolean;
}

export const ContentProtection: React.FC<ContentProtectionProps> = ({ 
  children, 
  enableProtection = true 
}) => {
  const config = getSecurityConfig();
  const protection = config.contentProtection;

  useEffect(() => {
    if (!enableProtection) return;

    // Disable right-click
    if (protection.disableRightClick) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };
      document.addEventListener('contextmenu', handleContextMenu);
      return () => document.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [enableProtection, protection.disableRightClick]);

  useEffect(() => {
    if (!enableProtection) return;

    // Disable text selection
    if (protection.disableTextSelection) {
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
      };
      document.addEventListener('selectstart', handleSelectStart);
      return () => document.removeEventListener('selectstart', handleSelectStart);
    }
  }, [enableProtection, protection.disableTextSelection]);

  useEffect(() => {
    if (!enableProtection) return;

    // Disable print screen (basic protection)
    if (protection.disablePrintScreen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Disable Print Screen key
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          return false;
        }
        // Disable Alt + Print Screen
        if (e.altKey && e.key === 'PrintScreen') {
          e.preventDefault();
          return false;
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enableProtection, protection.disablePrintScreen]);

  useEffect(() => {
    if (!enableProtection) return;

    // Disable DevTools (basic protection)
    if (protection.disableDevTools) {
      const handleDevTools = () => {
        // Detect if DevTools is open
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          // DevTools might be open
          console.clear();
          console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 20px; font-weight: bold;');
          console.log('%cThis content is protected. Please close Developer Tools.', 'color: red; font-size: 14px;');
        }
      };

      const interval = setInterval(handleDevTools, 500);
      return () => clearInterval(interval);
    }
  }, [enableProtection, protection.disableDevTools]);

  // Add watermark
  useEffect(() => {
    if (!enableProtection || !protection.watermarkText) return;

    const watermark = document.createElement('div');
    watermark.textContent = protection.watermarkText;
    watermark.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 24px;
      color: rgba(0, 0, 0, 0.1);
      pointer-events: none;
      z-index: 9999;
      user-select: none;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(watermark);

    return () => {
      if (document.body.contains(watermark)) {
        document.body.removeChild(watermark);
      }
    };
  }, [enableProtection, protection.watermarkText]);

  return (
    <div 
      style={{
        userSelect: protection.disableTextSelection ? 'none' : 'auto',
        WebkitUserSelect: protection.disableTextSelection ? 'none' : 'auto',
        MozUserSelect: protection.disableTextSelection ? 'none' : 'auto',
        msUserSelect: protection.disableTextSelection ? 'none' : 'auto' as any
      }}
    >
      {children}
    </div>
  );
};
