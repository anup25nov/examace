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
              // Set status bar style to LIGHT for better visibility
              await StatusBar.setStyle({ style: 'LIGHT' });
              
              // Set status bar background color to white
              await StatusBar.setBackgroundColor({ color: '#ffffff' });
              
              // CRITICAL: Ensure status bar doesn't overlay webview
              await StatusBar.setOverlaysWebView({ overlay: false });
              
              // Show status bar
              await StatusBar.show();
              
              console.log('Status bar configured successfully');
            }
          }
        } catch (error) {
          // Silently fail if status bar plugin is not available
          console.warn('Status bar plugin not available:', error);
        }
      };

      // Add a small delay to ensure Capacitor is fully loaded
      setTimeout(initializeStatusBar, 100);
    }
  }, []);

  return null;
};

export default MobileStatusBarHandler;
