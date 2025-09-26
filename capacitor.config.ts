import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.step2sarkari.app',
  appName: 'Step2Sarkari',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
      spinnerColor: "#3b82f6",
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
      androidOverlaysWebView: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: 'https://examace-smoky.vercel.app'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
