// Application Configuration
// This file contains all configurable settings for the ExamAce platform

export interface AppConfig {
  // Platform Settings
  platform: {
    name: string;
    version: string;
    description: string;
    supportEmail: string;
    supportPhone: string;
  };

  // Membership Plans
  membership: {
    plans: {
      id: string;
      name: string;
      price: number;
      mockTests: number;
      duration: number;
      features: string[];
      popular?: boolean;
    }[];
  };

  // Referral System
  referral: {
    commissionPercentage: number;
    minimumPayout: number;
    referralCodePrefix: string;
    referralCodeLength: number;
  };

  // Test Configuration
  tests: {
    defaultDuration: number;
    defaultMarks: number;
    maxQuestions: number;
    timeWarningThreshold: number; // minutes before warning
  };

  // UI/UX Settings
  ui: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
    animations: {
      enabled: boolean;
      duration: number;
    };
    mobile: {
      breakpoint: number;
      touchOptimized: boolean;
    };
  };

  // Payment Settings
  payment: {
    currency: string;
    razorpayKey: string;
    testMode: boolean;
  };

  // Feature Flags
  features: {
    referralSystem: boolean;
    membershipSystem: boolean;
    premiumTests: boolean;
    analytics: boolean;
    notifications: boolean;
  };
}

// Default Configuration
export const defaultConfig: AppConfig = {
  platform: {
    name: 'ExamAce',
    version: '1.0.0',
    description: 'Master your competitive exams with ExamAce',
    supportEmail: 'support@examace.com',
    supportPhone: '+91-9876543210'
  },

  membership: {
    plans: [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 30,
        mockTests: 10,
        duration: 30,
        features: [
          '10 Mock Tests',
          'Detailed Solutions',
          'Performance Analytics',
          '30 Days Access'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 49,
        mockTests: 25,
        duration: 60,
        features: [
          '25 Mock Tests',
          'Detailed Solutions',
          'Performance Analytics',
          '60 Days Access',
          'Priority Support'
        ],
        popular: true
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 99,
        mockTests: 50,
        duration: 90,
        features: [
          '50 Mock Tests',
          'Detailed Solutions',
          'Performance Analytics',
          '90 Days Access',
          '24/7 Support',
          'Study Materials'
        ]
      }
    ]
  },

  referral: {
    commissionPercentage: 50,
    minimumPayout: 100,
    referralCodePrefix: 'EXAM',
    referralCodeLength: 8
  },

  tests: {
    defaultDuration: 180, // 3 hours
    defaultMarks: 2,
    maxQuestions: 100,
    timeWarningThreshold: 10 // 10 minutes before warning
  },

  ui: {
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981'
    },
    animations: {
      enabled: true,
      duration: 300
    },
    mobile: {
      breakpoint: 768,
      touchOptimized: true
    }
  },

  payment: {
    currency: 'INR',
    razorpayKey: import.meta.env.VITE_RAZORPAY_KEY || '',
    testMode: import.meta.env.MODE === 'development'
  },

  features: {
    referralSystem: true,
    membershipSystem: true,
    premiumTests: true,
    analytics: true,
    notifications: true
  }
};

// Configuration Manager
class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = { ...defaultConfig };
    this.loadFromStorage();
  }

  // Get configuration
  getConfig(): AppConfig {
    return this.config;
  }

  // Update configuration
  updateConfig(updates: Partial<AppConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveToStorage();
  }

  // Get specific configuration section
  getSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.config[section];
  }

  // Update specific configuration section
  updateSection<K extends keyof AppConfig>(section: K, updates: Partial<AppConfig[K]>): void {
    this.config[section] = { ...this.config[section], ...updates };
    this.saveToStorage();
  }

  // Load configuration from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('examace_config');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.config = { ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      console.error('Error loading config from storage:', error);
    }
  }

  // Save configuration to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('examace_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving config to storage:', error);
    }
  }

  // Reset to default configuration
  resetToDefault(): void {
    this.config = { ...defaultConfig };
    this.saveToStorage();
  }

  // Check if feature is enabled
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Enable/disable feature
  toggleFeature(feature: keyof AppConfig['features'], enabled: boolean): void {
    this.config.features[feature] = enabled;
    this.saveToStorage();
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

// Export configuration getter
export const getConfig = () => configManager.getConfig();

// Export feature flag helpers
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => 
  configManager.isFeatureEnabled(feature);

// Export membership plan helpers
export const getMembershipPlans = () => configManager.getSection('membership').plans;

// Export referral config helpers
export const getReferralConfig = () => configManager.getSection('referral');

// Export UI config helpers
export const getUIConfig = () => configManager.getSection('ui');

// Export test config helpers
export const getTestConfig = () => configManager.getSection('tests');
