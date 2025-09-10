// Service to handle referral banner dismissal with configurable cooldown
export interface ReferralBannerConfig {
  cooldownHours: number; // Default 24 hours
  storageKey: string; // Default 'referralBannerDismissed'
}

export class ReferralBannerService {
  private static instance: ReferralBannerService;
  private config: ReferralBannerConfig;

  constructor(config: Partial<ReferralBannerConfig> = {}) {
    this.config = {
      cooldownHours: config.cooldownHours || 24,
      storageKey: config.storageKey || 'referralBannerDismissed'
    };
  }

  static getInstance(config?: Partial<ReferralBannerConfig>): ReferralBannerService {
    if (!ReferralBannerService.instance) {
      ReferralBannerService.instance = new ReferralBannerService(config);
    }
    return ReferralBannerService.instance;
  }

  /**
   * Check if the referral banner should be shown
   * Returns false if banner was dismissed within the cooldown period
   */
  shouldShowBanner(): boolean {
    try {
      const dismissedData = localStorage.getItem(this.config.storageKey);
      if (!dismissedData) {
        return true; // Never dismissed, show banner
      }

      const { timestamp } = JSON.parse(dismissedData);
      const dismissedTime = new Date(timestamp);
      const now = new Date();
      const hoursSinceDismissal = (now.getTime() - dismissedTime.getTime()) / (1000 * 60 * 60);

      return hoursSinceDismissal >= this.config.cooldownHours;
    } catch (error) {
      console.error('Error checking referral banner status:', error);
      return true; // Default to showing banner on error
    }
  }

  /**
   * Dismiss the referral banner and store the timestamp
   */
  dismissBanner(): void {
    try {
      const dismissedData = {
        timestamp: new Date().toISOString(),
        cooldownHours: this.config.cooldownHours
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(dismissedData));
    } catch (error) {
      console.error('Error dismissing referral banner:', error);
    }
  }

  /**
   * Get time remaining until banner can be shown again
   * Returns null if banner can be shown now
   */
  getTimeUntilNextShow(): { hours: number; minutes: number } | null {
    try {
      const dismissedData = localStorage.getItem(this.config.storageKey);
      if (!dismissedData) {
        return null; // Can show now
      }

      const { timestamp } = JSON.parse(dismissedData);
      const dismissedTime = new Date(timestamp);
      const now = new Date();
      const hoursSinceDismissal = (now.getTime() - dismissedTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceDismissal >= this.config.cooldownHours) {
        return null; // Can show now
      }

      const remainingHours = this.config.cooldownHours - hoursSinceDismissal;
      const hours = Math.floor(remainingHours);
      const minutes = Math.floor((remainingHours - hours) * 60);

      return { hours, minutes };
    } catch (error) {
      console.error('Error getting time until next show:', error);
      return null;
    }
  }

  /**
   * Force reset the banner (for testing or admin purposes)
   */
  resetBanner(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
    } catch (error) {
      console.error('Error resetting referral banner:', error);
    }
  }

  /**
   * Update the cooldown configuration
   */
  updateConfig(newConfig: Partial<ReferralBannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance with default config
export const referralBannerService = ReferralBannerService.getInstance();
