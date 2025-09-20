import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

interface MobileBackButtonHandlerProps {
  onBackPress?: () => boolean; // Return true to prevent default back behavior
}

export const MobileBackButtonHandler: React.FC<MobileBackButtonHandlerProps> = ({ 
  onBackPress 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      // Check if we're in a mobile app environment
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // If there's a custom handler, use it
        if (onBackPress && onBackPress()) {
          return; // Prevent default back behavior
        }

        // Handle different routes
        const currentPath = location.pathname;
        
        // If we're on the home page, minimize the app instead of closing
        if (currentPath === '/' || currentPath === '/home') {
          try {
            await App.minimizeApp();
          } catch (error) {
            console.log('Could not minimize app:', error);
          }
          return;
        }

        // If we're in a test interface, show confirmation before going back
        if (currentPath.includes('/test/')) {
          const shouldGoBack = window.confirm(
            'Are you sure you want to exit the test? Your progress will be lost.'
          );
          if (!shouldGoBack) {
            return;
          }
        }

        // For other pages, navigate back in the app
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          // If no history, go to home
          navigate('/');
        }
      }
    };

    // Register the back button listener only if App is available
    if (App) {
      App.addListener('backButton', handleBackButton);

      // Cleanup
      return () => {
        App.removeAllListeners();
      };
    }
  }, [navigate, location.pathname, onBackPress]);

  return null;
};

export default MobileBackButtonHandler;
