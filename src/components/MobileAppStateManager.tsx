import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Declare Capacitor types for TypeScript
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
    };
  }
}

// Import App from @capacitor/app only if available
let App: any = null;
if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
  try {
    App = require('@capacitor/app').App;
  } catch (error) {
  }
}

interface MobileAppStateManagerProps {
  onAppStateChange?: (isActive: boolean) => void;
}

export const MobileAppStateManager: React.FC<MobileAppStateManagerProps> = ({ 
  onAppStateChange 
}) => {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Only run on mobile platforms
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
      return;
    }

    const handleAppStateChange = async (state: { isActive: boolean }) => {
      
      if (state.isActive) {
        // App became active - refresh user data
        try {
          if (user) {
            await refreshUser();
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
      
      // Call custom handler if provided
      if (onAppStateChange) {
        onAppStateChange(state.isActive);
      }
    };

    const handleAppPause = async () => {
      // Save any pending data to localStorage
      try {
        const userData = {
          userId: user?.id,
          lastActive: Date.now(),
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('app_state', JSON.stringify(userData));
      } catch (error) {
        console.error('Error saving app state:', error);
      }
    };

    const handleAppResume = async () => {
      // Restore app state and refresh data
      try {
        const savedState = localStorage.getItem('app_state');
        if (savedState) {
          const state = JSON.parse(savedState);
          const timeSinceLastActive = Date.now() - state.lastActive;
          
          // If user was away for more than 5 minutes, refresh data
          if (timeSinceLastActive > 5 * 60 * 1000) {
            if (user) {
              await refreshUser();
            }
          }
        }
      } catch (error) {
        console.error('Error restoring app state:', error);
      }
    };

    // Register app state listeners only if App is available
    if (App) {
      App.addListener('appStateChange', handleAppStateChange);
      App.addListener('pause', handleAppPause);
      App.addListener('resume', handleAppResume);

      // Cleanup
      return () => {
        App.removeAllListeners();
      };
    }
  }, [user, onAppStateChange]);

  // Handle visibility change for web platforms with debouncing
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastRefreshTime = 0;
    const REFRESH_DEBOUNCE_MS = 2000; // 2 seconds debounce

    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        const now = Date.now();
        
        // Debounce: only refresh if enough time has passed since last refresh
        if (now - lastRefreshTime < REFRESH_DEBOUNCE_MS) {
          return;
        }

        // Clear any pending refresh
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }

        // Add a small delay to prevent conflicts with navigation
        refreshTimeout = setTimeout(async () => {
          try {
            await refreshUser();
            lastRefreshTime = Date.now();
          } catch (error) {
            console.error('Error refreshing user data on visibility change:', error);
          }
        }, 500); // 500ms delay to allow navigation to complete
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [user]);

  return null;
};

export default MobileAppStateManager;
