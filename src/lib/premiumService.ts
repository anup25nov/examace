// Service to handle premium content and payment flow
export interface PremiumTest {
  id: string;
  name: string;
  duration: number;
  questions: number;
  subjects: string[];
  difficulty: string;
  description: string;
  isPremium: boolean;
  price: number;
  benefits?: string[];
  date?: string;
  shift?: string;
}

export interface UserMembership {
  isPremium: boolean;
  purchasedTests: string[];
  expiryDate?: Date;
  planType?: 'monthly' | 'yearly' | 'lifetime';
}

export class PremiumService {
  private static instance: PremiumService;
  private userMembership: UserMembership | null = null;

  constructor() {
    this.loadUserMembership();
  }

  static getInstance(): PremiumService {
    if (!PremiumService.instance) {
      PremiumService.instance = new PremiumService();
    }
    return PremiumService.instance;
  }

  /**
   * Load user membership from localStorage
   */
  private loadUserMembership(): void {
    try {
      const membershipData = localStorage.getItem('userMembership');
      if (membershipData) {
        this.userMembership = JSON.parse(membershipData);
      }
    } catch (error) {
      console.error('Error loading user membership:', error);
      this.userMembership = null;
    }
  }

  /**
   * Save user membership to localStorage
   */
  private saveUserMembership(): void {
    try {
      localStorage.setItem('userMembership', JSON.stringify(this.userMembership));
    } catch (error) {
      console.error('Error saving user membership:', error);
    }
  }

  /**
   * Check if user has access to a premium test
   */
  hasAccess(testId: string): boolean {
    if (!this.userMembership) {
      return false;
    }

    // Check if user has premium membership
    if (this.userMembership.isPremium) {
      return true;
    }

    // Check if user has purchased this specific test
    return this.userMembership.purchasedTests.includes(testId);
  }

  /**
   * Check if test is premium
   */
  isPremiumTest(test: PremiumTest): boolean {
    return test.isPremium;
  }

  /**
   * Purchase a premium test
   */
  async purchaseTest(testId: string, test: PremiumTest): Promise<boolean> {
    try {
      // Simulate payment processing
      const paymentSuccess = await this.processPayment(test.price);
      
      if (paymentSuccess) {
        if (!this.userMembership) {
          this.userMembership = {
            isPremium: false,
            purchasedTests: []
          };
        }
        
        this.userMembership.purchasedTests.push(testId);
        this.saveUserMembership();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error purchasing test:', error);
      return false;
    }
  }

  /**
   * Simulate payment processing
   */
  private async processPayment(amount: number): Promise<boolean> {
    // Simulate payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, always return true
        // In real implementation, integrate with payment gateway
        resolve(true);
      }, 2000);
    });
  }

  /**
   * Upgrade to premium membership
   */
  async upgradeToPremium(planType: 'monthly' | 'yearly' | 'lifetime'): Promise<boolean> {
    try {
      const prices = {
        monthly: 299,
        yearly: 2999,
        lifetime: 9999
      };

      const paymentSuccess = await this.processPayment(prices[planType]);
      
      if (paymentSuccess) {
        this.userMembership = {
          isPremium: true,
          purchasedTests: this.userMembership?.purchasedTests || [],
          expiryDate: planType === 'lifetime' ? undefined : new Date(Date.now() + (planType === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
          planType
        };
        this.saveUserMembership();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return false;
    }
  }

  /**
   * Get user membership info
   */
  getUserMembership(): UserMembership | null {
    return this.userMembership;
  }

  /**
   * Check if membership is expired
   */
  isMembershipExpired(): boolean {
    if (!this.userMembership || !this.userMembership.expiryDate) {
      return false;
    }
    
    return new Date() > this.userMembership.expiryDate;
  }

  /**
   * Reset membership (for testing)
   */
  resetMembership(): void {
    this.userMembership = null;
    localStorage.removeItem('userMembership');
  }
}

// Export singleton instance
export const premiumService = PremiumService.getInstance();
