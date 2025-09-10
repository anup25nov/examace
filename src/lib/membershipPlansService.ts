import { supabase } from '@/integrations/supabase/client';

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_months: number;
  features: string[];
  display_order: number;
  duration_display?: string;
  monthly_equivalent?: number;
}

export interface PlanFeature {
  feature_name: string;
  feature_description: string;
  is_included: boolean;
  display_order: number;
}

export interface MembershipPlansResponse {
  success: boolean;
  plans?: MembershipPlan[];
  error?: string;
}

export interface PlanFeaturesResponse {
  success: boolean;
  features?: PlanFeature[];
  error?: string;
}

class MembershipPlansService {
  private static instance: MembershipPlansService;
  private plansCache: MembershipPlan[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MembershipPlansService {
    if (!MembershipPlansService.instance) {
      MembershipPlansService.instance = new MembershipPlansService();
    }
    return MembershipPlansService.instance;
  }

  /**
   * Get all active membership plans
   */
  async getMembershipPlans(useCache: boolean = true): Promise<MembershipPlansResponse> {
    try {
      // Check cache first
      if (useCache && this.plansCache && Date.now() < this.cacheExpiry) {
        return { success: true, plans: this.plansCache };
      }

      // Try to get plans from database function first
      try {
        const { data, error } = await supabase.rpc('get_membership_plans' as any);

        if (error) {
          console.warn('Database function not found, trying direct table query:', error);
          throw error; // Fall through to fallback
        }

        const plans = data as MembershipPlan[];
        
        // Update cache
        this.plansCache = plans;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;

        return { success: true, plans };
      } catch (rpcError) {
        // Fallback: Query table directly if function doesn't exist
        console.log('Falling back to direct table query...');
        
        const { data, error } = await supabase
          .from('membership_plans' as any)
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) {
          console.error('Error fetching membership plans from table:', error);
          return { success: false, error: error.message };
        }

        const plans = data as unknown as MembershipPlan[];
        
        // Update cache
        this.plansCache = plans;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;

        return { success: true, plans };
      }
    } catch (error) {
      console.error('Error in getMembershipPlans:', error);
      return { success: false, error: 'Failed to fetch membership plans' };
    }
  }

  /**
   * Get a specific membership plan by ID
   */
  async getMembershipPlan(planId: string): Promise<{ success: boolean; plan?: MembershipPlan; error?: string }> {
    try {
      // Try database function first
      try {
        const { data, error } = await supabase.rpc('get_membership_plan' as any, {
          plan_id: planId
        });

        if (error) {
          console.warn('Database function not found, trying direct table query:', error);
          throw error; // Fall through to fallback
        }

        if (!data || data.length === 0) {
          return { success: false, error: 'Plan not found' };
        }

        return { success: true, plan: data[0] as MembershipPlan };
      } catch (rpcError) {
        // Fallback: Query table directly
        const { data, error } = await supabase
          .from('membership_plans' as any)
          .select('*')
          .eq('id', planId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching membership plan from table:', error);
          return { success: false, error: error.message };
        }

        return { success: true, plan: data as unknown as MembershipPlan };
      }
    } catch (error) {
      console.error('Error in getMembershipPlan:', error);
      return { success: false, error: 'Failed to fetch membership plan' };
    }
  }

  /**
   * Get detailed features for a specific plan
   */
  async getPlanFeatures(planId: string): Promise<PlanFeaturesResponse> {
    try {
      const { data, error } = await supabase.rpc('get_plan_features' as any, {
        plan_id: planId
      });

      if (error) {
        console.error('Error fetching plan features:', error);
        return { success: false, error: error.message };
      }

      return { success: true, features: data as PlanFeature[] };
    } catch (error) {
      console.error('Error in getPlanFeatures:', error);
      return { success: false, error: 'Failed to fetch plan features' };
    }
  }

  /**
   * Get plans using the view (includes calculated fields)
   */
  async getMembershipPlansWithCalculations(): Promise<MembershipPlansResponse> {
    try {
      const { data, error } = await supabase
        .from('membership_plans_view' as any)
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error fetching membership plans view:', error);
        return { success: false, error: error.message };
      }

      return { success: true, plans: data as unknown as MembershipPlan[] };
    } catch (error) {
      console.error('Error in getMembershipPlansWithCalculations:', error);
      return { success: false, error: 'Failed to fetch membership plans' };
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number, currency: string = 'INR'): string {
    if (price === 0) return 'Free';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Get duration display text
   */
  getDurationDisplay(durationMonths: number): string {
    switch (durationMonths) {
      case 0: return 'Free';
      case 1: return 'Monthly';
      case 12: return 'Yearly';
      case 999: return 'Lifetime';
      default: return `${durationMonths} months`;
    }
  }

  /**
   * Calculate savings for yearly plan compared to monthly
   */
  calculateSavings(monthlyPrice: number, yearlyPrice: number): { amount: number; percentage: number } {
    const monthlyYearlyCost = monthlyPrice * 12;
    const savings = monthlyYearlyCost - yearlyPrice;
    const percentage = Math.round((savings / monthlyYearlyCost) * 100);
    
    return { amount: savings, percentage };
  }

  /**
   * Get the most popular plan (usually yearly)
   */
  getMostPopularPlan(plans: MembershipPlan[]): MembershipPlan | null {
    return plans.find(plan => plan.id === 'yearly') || null;
  }

  /**
   * Get the best value plan
   */
  getBestValuePlan(plans: MembershipPlan[]): MembershipPlan | null {
    const paidPlans = plans.filter(plan => plan.price > 0);
    if (paidPlans.length === 0) return null;

    // Find plan with lowest monthly equivalent
    return paidPlans.reduce((best, current) => {
      const currentMonthly = current.monthly_equivalent || (current.price / current.duration_months);
      const bestMonthly = best.monthly_equivalent || (best.price / best.duration_months);
      return currentMonthly < bestMonthly ? current : best;
    });
  }

  /**
   * Clear cache (useful for admin updates)
   */
  clearCache(): void {
    this.plansCache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Get plan comparison data
   */
  getPlanComparison(plans: MembershipPlan[]): {
    free: MembershipPlan | null;
    monthly: MembershipPlan | null;
    yearly: MembershipPlan | null;
    lifetime: MembershipPlan | null;
  } {
    return {
      free: plans.find(plan => plan.id === 'free') || null,
      monthly: plans.find(plan => plan.id === 'monthly') || null,
      yearly: plans.find(plan => plan.id === 'yearly') || null,
      lifetime: plans.find(plan => plan.id === 'lifetime') || null
    };
  }
}

export const membershipPlansService = MembershipPlansService.getInstance();
