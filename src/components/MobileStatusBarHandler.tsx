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
              // Hide status bar completely
              await StatusBar.hide();
              
              console.log('Status bar hidden successfully');
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
