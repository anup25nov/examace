import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface MobileKeyboardHandlerProps {
  children: React.ReactNode;
}

export const MobileKeyboardHandler: React.FC<MobileKeyboardHandlerProps> = ({ children }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleKeyboardWillShow = (info: any) => {
        console.log('Keyboard will show:', info);
        setKeyboardHeight(info.keyboardHeight);
        setIsKeyboardVisible(true);
        
        // Add class to body for CSS adjustments
        document.body.classList.add('keyboard-visible');
      };

      const handleKeyboardWillHide = () => {
        console.log('Keyboard will hide');
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        
        // Remove class from body
        document.body.classList.remove('keyboard-visible');
      };

      const handleKeyboardDidShow = (info: any) => {
        console.log('Keyboard did show:', info);
        setKeyboardHeight(info.keyboardHeight);
        setIsKeyboardVisible(true);
      };

      const handleKeyboardDidHide = () => {
        console.log('Keyboard did hide');
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      };

      // Add keyboard event listeners
      window.addEventListener('keyboardWillShow', handleKeyboardWillShow);
      window.addEventListener('keyboardWillHide', handleKeyboardWillHide);
      window.addEventListener('keyboardDidShow', handleKeyboardDidShow);
      window.addEventListener('keyboardDidHide', handleKeyboardDidHide);

      return () => {
        window.removeEventListener('keyboardWillShow', handleKeyboardWillShow);
        window.removeEventListener('keyboardWillHide', handleKeyboardWillHide);
        window.removeEventListener('keyboardDidShow', handleKeyboardDidShow);
        window.removeEventListener('keyboardDidHide', handleKeyboardDidHide);
        
        // Clean up body class
        document.body.classList.remove('keyboard-visible');
      };
    } else {
      // For web, use visual viewport API if available
      if ('visualViewport' in window) {
        const handleViewportChange = () => {
          const viewport = window.visualViewport;
          if (viewport) {
            const heightDifference = window.innerHeight - viewport.height;
            if (heightDifference > 150) { // Keyboard is likely open
              setKeyboardHeight(heightDifference);
              setIsKeyboardVisible(true);
              document.body.classList.add('keyboard-visible');
            } else {
              setKeyboardHeight(0);
              setIsKeyboardVisible(false);
              document.body.classList.remove('keyboard-visible');
            }
          }
        };

        window.visualViewport?.addEventListener('resize', handleViewportChange);
        
        return () => {
          window.visualViewport?.removeEventListener('resize', handleViewportChange);
          document.body.classList.remove('keyboard-visible');
        };
      }
    }
  }, []);

  return (
    <div 
      className={`mobile-keyboard-handler ${isKeyboardVisible ? 'keyboard-open' : ''}`}
      style={{
        paddingBottom: isKeyboardVisible ? `${Math.min(keyboardHeight * 0.1, 60)}px` : '0px',
        transition: 'padding-bottom 0.3s ease-in-out'
      }}
    >
      {children}
    </div>
  );
};

export default MobileKeyboardHandler;
