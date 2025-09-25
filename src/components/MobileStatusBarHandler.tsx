import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const MobileStatusBarHandler = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initializeStatusBar = async () => {
        try {
          // Check if StatusBar is available
          if (typeof window !== 'undefined' && (window as any).Capacitor) {
            const { StatusBar } = (window as any).Capacitor.Plugins;
            if (StatusBar) {
              // Set status bar style
              await StatusBar.setStyle({ style: 'DARK' });
              
              // Set status bar background color
              await StatusBar.setBackgroundColor({ color: '#ffffff' });
              
              // Ensure status bar doesn't overlay webview
              await StatusBar.setOverlaysWebView({ overlay: false });
              
              // Show status bar
              await StatusBar.show();
            }
          }
        } catch (error) {
          // Silently fail if status bar plugin is not available
          console.warn('Status bar plugin not available:', error);
        }
      };

      initializeStatusBar();
    }
  }, []);

  return null;
};

export default MobileStatusBarHandler;
