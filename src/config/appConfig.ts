// Application Configuration
// This file contains all configurable settings for the Step2Sarkari platform

import { getAllActivePlans } from './pricingConfig';

export interface AppConfig {
  // Platform Settings
  platform: {
    name: string;
    version: string;
    description: string;
    supportEmail: string;
    supportPhone: string;
  };

  // Commission Configuration - CENTRALIZED
  commission: {
    percentage: number;
    minimumWithdrawal: number;
    maximumWithdrawal: number;
    processingFee: number;
    taxDeduction: number;
    firstTimeBonus: number;
    maxDailyWithdrawals: number;
    withdrawalProcessingDays: number;
    referralCodeLength: number;
    referralCodePrefix: string;
  };

  // Database Configuration - CENTRALIZED
  database: {
    membershipPlansTable: string;
    userMembershipsTable: string;
    paymentsTable: string;
    referralCodesTable: string;
    referralCommissionsTable: string;
    referralTransactionsTable: string;
    userProfilesTable: string;
    testCompletionsTable: string;
    individualTestScoresTable: string;
    testAttemptsTable: string;
    examStatsTable: string;
    userStreaksTable: string;
    questionReportsTable: string;
    withdrawalRequestsTable: string;
  };

  // API Configuration - CENTRALIZED
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    bulkApiEnabled: boolean;
    cacheTimeout: number;
  };

  // Security Configuration - CENTRALIZED
  security: {
    enableRightClickBlock: boolean;
    enableDevToolsBlock: boolean;
    enableTextSelectionBlock: boolean;
    enableKeyboardShortcutsBlock: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };

  // Notification Configuration - CENTRALIZED
  notifications: {
    successDuration: number;
    errorDuration: number;
    warningDuration: number;
    infoDuration: number;
    enableSound: boolean;
    enableVibration: boolean;
  };
  
  // Centralized Membership Plans Configuration
  membershipPlans: {
    [key: string]: {
      id: string;
      name: string;
      price: number;
      originalPrice: number;
      mockTests: number;
      duration: number; // days
      features: string[];
      isActive: boolean;
      displayOrder: number;
      popular?: boolean;
    };
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
    name: 'Step2Sarkari',
    version: '1.0.0',
    description: 'Master your competitive exams with Step2Sarkari',
    supportEmail: 'support@step2sarkari.com',
    supportPhone: '+91-9876543210'
  },

  // Centralized commission configuration - SINGLE SOURCE OF TRUTH
  commission: {
    percentage: 12, // 50% commission rate
    minimumWithdrawal: 8, // Minimum withdrawal amount
    maximumWithdrawal: 10000, // Maximum withdrawal amount
    processingFee: 0, // Processing fee percentage
    taxDeduction: 0, // Tax deduction percentage
    // Additional commission settings
    firstTimeBonus: 0, // Bonus for first-time referrals
    maxDailyWithdrawals: 5, // Maximum withdrawals per day
    withdrawalProcessingDays: 3, // Days to process withdrawal
    referralCodeLength: 8, // Length of referral codes
    referralCodePrefix: 'S2S' // Prefix for referral codes
  },

  // Database Configuration - SINGLE SOURCE OF TRUTH
  database: {
    membershipPlansTable: 'membership_plans',
    userMembershipsTable: 'user_memberships',
    paymentsTable: 'payments',
    referralCodesTable: 'referral_codes',
    referralCommissionsTable: 'referral_commissions',
    referralTransactionsTable: 'referral_transactions',
    userProfilesTable: 'user_profiles',
    testCompletionsTable: 'test_completions',
    individualTestScoresTable: 'individual_test_scores',
    testAttemptsTable: 'test_attempts',
    examStatsTable: 'exam_stats',
    userStreaksTable: 'user_streaks',
    questionReportsTable: 'question_reports',
    withdrawalRequestsTable: 'withdrawal_requests'
  },

  // API Configuration - SINGLE SOURCE OF TRUTH
  api: {
    baseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    bulkApiEnabled: true,
    cacheTimeout: 300000 // 5 minutes
  },

  // Security Configuration - SINGLE SOURCE OF TRUTH
  security: {
    enableRightClickBlock: true,
    enableDevToolsBlock: true,
    enableTextSelectionBlock: true,
    enableKeyboardShortcutsBlock: true,
    maxLoginAttempts: 5,
    lockoutDuration: 300000 // 5 minutes
  },

  // Notification Configuration - SINGLE SOURCE OF TRUTH
  notifications: {
    successDuration: 3000, // 3 seconds
    errorDuration: 5000, // 5 seconds
    warningDuration: 4000, // 4 seconds
    infoDuration: 3000, // 3 seconds
    enableSound: false,
    enableVibration: false
  },
  
  // Centralized Membership Plans Configuration - SINGLE SOURCE OF TRUTH
  // Note: All pricing is now managed in src/config/pricingConfig.ts
  // Use getActiveMembershipPlans() from pricingConfig.ts instead
  membershipPlans: {
    // This section is kept for backward compatibility but should not be used
    // All pricing is now centralized in src/config/pricingConfig.ts
    // Use getAllActivePlans() and getPlanPricing() from pricingConfig.ts
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
      const stored = localStorage.getItem('step2sarkari_config');
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
      localStorage.setItem('step2sarkari_config', JSON.stringify(this.config));
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
export const getMembershipPlans = () => {
  const plans = configManager.getSection('membershipPlans');
  return Object.values(plans).sort((a, b) => a.displayOrder - b.displayOrder);
};

export const getMembershipPlan = (planId: string) => {
  const plans = configManager.getSection('membershipPlans');
  return plans[planId];
};

export const getActiveMembershipPlans = () => {
  // Use centralized pricing configuration
  try {
    return getAllActivePlans();
  } catch (error) {
    console.error('Error loading centralized pricing:', error);
    // Fallback to empty array
    return [];
  }
};

// Export referral config helpers
export const getReferralConfig = () => configManager.getSection('commission');

// Export UI config helpers
export const getUIConfig = () => configManager.getSection('ui');

// Export test config helpers
export const getTestConfig = () => configManager.getSection('tests');

// Export database config helpers
export const getDatabaseConfig = () => configManager.getSection('database');

// Export API config helpers
export const getAPIConfig = () => configManager.getSection('api');

// Export security config helpers
export const getSecurityConfig = () => configManager.getSection('security');

// Export notification config helpers
export const getNotificationConfig = () => configManager.getSection('notifications');

// Export payment config helpers
export const getPaymentConfig = () => configManager.getSection('payment');

// Export platform config helpers
export const getPlatformConfig = () => configManager.getSection('platform');

// Specific helper functions for commonly used values
export const getCommissionPercentage = () => configManager.getSection('commission').percentage;
export const getMinimumWithdrawal = () => configManager.getSection('commission').minimumWithdrawal;
export const getMaximumWithdrawal = () => configManager.getSection('commission').maximumWithdrawal;
export const getReferralCodeLength = () => configManager.getSection('commission').referralCodeLength;
export const getReferralCodePrefix = () => configManager.getSection('commission').referralCodePrefix;
export const getWithdrawalProcessingDays = () => configManager.getSection('commission').withdrawalProcessingDays;

// Database table name helpers
export const getTableName = (table: keyof AppConfig['database']) => configManager.getSection('database')[table];

// Security helpers
export const isRightClickBlocked = () => {
  try {
    return configManager.getSection('security')?.enableRightClickBlock || false;
  } catch (error) {
    console.warn('Error getting right click block setting:', error);
    return false;
  }
};

export const isDevToolsBlocked = () => {
  try {
    return configManager.getSection('security')?.enableDevToolsBlock || false;
  } catch (error) {
    console.warn('Error getting dev tools block setting:', error);
    return false;
  }
};

export const isTextSelectionBlocked = () => {
  try {
    return configManager.getSection('security')?.enableTextSelectionBlock || false;
  } catch (error) {
    console.warn('Error getting text selection block setting:', error);
    return false;
  }
};

export const isKeyboardShortcutsBlocked = () => {
  try {
    return configManager.getSection('security')?.enableKeyboardShortcutsBlock || false;
  } catch (error) {
    console.warn('Error getting keyboard shortcuts block setting:', error);
    return false;
  }
};

// Notification duration helpers
export const getSuccessNotificationDuration = () => configManager.getSection('notifications').successDuration;
export const getErrorNotificationDuration = () => configManager.getSection('notifications').errorDuration;
export const getWarningNotificationDuration = () => configManager.getSection('notifications').warningDuration;
export const getInfoNotificationDuration = () => configManager.getSection('notifications').infoDuration;
