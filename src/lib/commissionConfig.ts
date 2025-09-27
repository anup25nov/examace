// Commission Configuration Service
// This service provides centralized access to commission configuration from both frontend config and database

import { 
  getCommissionPercentage as getConfigCommissionPercentage, 
  getMinimumWithdrawal as getConfigMinimumWithdrawal, 
  getMaximumWithdrawal as getConfigMaximumWithdrawal 
} from '@/config/appConfig';
import { supabase } from '@/integrations/supabase/client';

export interface CommissionConfig {
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
}

class CommissionConfigService {
  private static instance: CommissionConfigService;
  private config: CommissionConfig | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): CommissionConfigService {
    if (!CommissionConfigService.instance) {
      CommissionConfigService.instance = new CommissionConfigService();
    }
    return CommissionConfigService.instance;
  }

  /**
   * Get commission configuration from database (preferred) or fallback to frontend config
   */
  public async getCommissionConfig(): Promise<CommissionConfig> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.config && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.config;
    }

    try {
      // Try to get config from database first
      const { data, error } = await supabase.rpc('get_commission_config' as any);
      
      if (error || !data || data.length === 0) {
        console.warn('Failed to get commission config from database, using frontend config:', error);
        return this.getFrontendConfig();
      }

      const dbConfig = data[0];
      this.config = {
        percentage: parseFloat(dbConfig.commission_percentage) || 50,
        minimumWithdrawal: parseFloat(dbConfig.minimum_withdrawal) || 100,
        maximumWithdrawal: parseFloat(dbConfig.maximum_withdrawal) || 10000,
        processingFee: parseFloat(dbConfig.processing_fee) || 0,
        taxDeduction: parseFloat(dbConfig.tax_deduction) || 0,
        firstTimeBonus: parseFloat(dbConfig.first_time_bonus) || 0,
        maxDailyWithdrawals: parseInt(dbConfig.max_daily_withdrawals) || 5,
        withdrawalProcessingDays: parseInt(dbConfig.withdrawal_processing_days) || 3,
        referralCodeLength: parseInt(dbConfig.referral_code_length) || 8,
        referralCodePrefix: dbConfig.referral_code_prefix || 'S2S'
      };

      this.lastFetch = now;
      return this.config;
    } catch (error) {
      console.error('Error fetching commission config from database:', error);
      return this.getFrontendConfig();
    }
  }

  /**
   * Get commission configuration from frontend config (fallback)
   */
  private getFrontendConfig(): CommissionConfig {
    return {
      percentage: getConfigCommissionPercentage(),
      minimumWithdrawal: getConfigMinimumWithdrawal(),
      maximumWithdrawal: getConfigMaximumWithdrawal(),
      processingFee: 0,
      taxDeduction: 0,
      firstTimeBonus: 0,
      maxDailyWithdrawals: 5,
      withdrawalProcessingDays: 3,
      referralCodeLength: 8,
      referralCodePrefix: 'S2S'
    };
  }

  /**
   * Get commission percentage (0-100)
   */
  public async getCommissionPercentage(): Promise<number> {
    const config = await this.getCommissionConfig();
    return config.percentage;
  }

  /**
   * Get commission rate (0-1)
   */
  public async getCommissionRate(): Promise<number> {
    const config = await this.getCommissionConfig();
    return config.percentage / 100;
  }

  /**
   * Calculate commission amount for a given purchase amount
   */
  public async calculateCommissionAmount(purchaseAmount: number): Promise<number> {
    const rate = await this.getCommissionRate();
    return purchaseAmount * rate;
  }

  /**
   * Get minimum withdrawal amount
   */
  public async getMinimumWithdrawal(): Promise<number> {
    const config = await this.getCommissionConfig();
    return config.minimumWithdrawal;
  }

  /**
   * Get maximum withdrawal amount
   */
  public async getMaximumWithdrawal(): Promise<number> {
    const config = await this.getCommissionConfig();
    return config.maximumWithdrawal;
  }

  /**
   * Check if commission amount meets minimum withdrawal requirement
   */
  public async isCommissionEligibleForWithdrawal(commissionAmount: number): Promise<boolean> {
    const minimum = await this.getMinimumWithdrawal();
    return commissionAmount >= minimum;
  }

  /**
   * Clear cache to force refresh on next request
   */
  public clearCache(): void {
    this.config = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const commissionConfigService = CommissionConfigService.getInstance();

// Export convenience functions
export const getCommissionConfig = () => commissionConfigService.getCommissionConfig();
export const getCommissionPercentage = () => commissionConfigService.getCommissionPercentage();
export const getCommissionRate = () => commissionConfigService.getCommissionRate();
export const calculateCommissionAmount = (amount: number) => commissionConfigService.calculateCommissionAmount(amount);
export const getMinimumWithdrawal = () => commissionConfigService.getMinimumWithdrawal();
export const getMaximumWithdrawal = () => commissionConfigService.getMaximumWithdrawal();
export const isCommissionEligibleForWithdrawal = (amount: number) => commissionConfigService.isCommissionEligibleForWithdrawal(amount);
