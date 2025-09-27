import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'mobile' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if app is already installed
    checkIfInstalled();
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
      setShowPrompt(true);
      
      // Determine platform
      if (event.platforms.includes('android')) {
        setInstallPlatform('mobile');
      } else if (event.platforms.includes('web')) {
        setInstallPlatform('desktop');
      } else {
        setInstallPlatform('unknown');
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for installability after a delay
    const timer = setTimeout(() => {
      if (!isInstalled && !isInstallable) {
        // Show manual install instructions
        setShowPrompt(true);
        setInstallPlatform(detectPlatform());
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, [isInstalled, isInstallable]);

  const checkIfInstalled = () => {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
  };

  const detectPlatform = (): 'mobile' | 'desktop' | 'unknown' => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/windows|macintosh|linux/i.test(userAgent)) {
      return 'desktop';
    }
    return 'unknown';
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Use the deferred prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installation accepted');
      } else {
        console.log('❌ PWA installation dismissed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Show manual installation instructions
      setShowPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onClose?.();
  };

  const getInstallInstructions = () => {
    if (installPlatform === 'mobile') {
      return {
        title: 'Install ExamAce on Mobile',
        steps: [
          'Tap the "Add to Home Screen" option in your browser menu',
          'Or tap the share button and select "Add to Home Screen"',
          'The app will be installed and accessible from your home screen'
        ],
        icon: <Smartphone className="h-8 w-8 text-blue-600" />
      };
    } else if (installPlatform === 'desktop') {
      return {
        title: 'Install ExamAce on Desktop',
        steps: [
          'Click the install icon in your browser address bar',
          'Or go to browser menu > Install ExamAce',
          'The app will be installed and accessible from your desktop'
        ],
        icon: <Monitor className="h-8 w-8 text-blue-600" />
      };
    } else {
      return {
        title: 'Install ExamAce App',
        steps: [
          'Look for the install icon in your browser',
          'Or check your browser menu for "Install App" option',
          'The app will be installed for offline access'
        ],
        icon: <Download className="h-8 w-8 text-blue-600" />
      };
    }
  };

  if (isInstalled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            App Installed!
          </h3>
          <p className="text-gray-600">
            ExamAce is now installed and ready to use offline.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!showPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {instructions.icon}
              {instructions.title}
            </CardTitle>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Online Status */}
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>

          {/* Install Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Benefits of Installing:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Access offline study materials</li>
              <li>• Faster loading and better performance</li>
              <li>• Push notifications for new content</li>
              <li>• App-like experience on your device</li>
            </ul>
          </div>

          {/* Installation Steps */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">How to Install:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-medium text-blue-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {deferredPrompt ? (
              <Button
                onClick={handleInstallClick}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            ) : (
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1"
              >
                Got It
              </Button>
            )}
            <Button
              onClick={handleDismiss}
              variant="ghost"
            >
              Maybe Later
            </Button>
          </div>

          {/* Platform-specific hints */}
          {installPlatform === 'mobile' && (
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Look for the "Add to Home Screen" option in your browser menu (⋮) or share button
            </div>
          )}
          
          {installPlatform === 'desktop' && (
            <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
              💡 Look for the install icon (⬇️) in your browser address bar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
