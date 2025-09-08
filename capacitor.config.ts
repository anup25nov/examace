import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.examace.app',
  appName: 'ExamAce',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#3b82f6"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
