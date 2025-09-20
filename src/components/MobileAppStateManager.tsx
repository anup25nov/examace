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
    console.log('Capacitor App plugin not available');
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
      console.log('App state changed:', state);
      
      if (state.isActive) {
        // App became active - refresh user data
        try {
          if (user) {
            await refreshUser();
            console.log('User data refreshed on app resume');
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
      console.log('App paused - saving state');
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
      console.log('App resumed - restoring state');
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
              console.log('User data refreshed after long pause');
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
  }, [user, refreshUser, onAppStateChange]);

  // Handle visibility change for web platforms
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        // Page became visible - refresh user data
        try {
          await refreshUser();
          console.log('User data refreshed on page visibility change');
        } catch (error) {
          console.error('Error refreshing user data on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUser]);

  return null;
};

export default MobileAppStateManager;
