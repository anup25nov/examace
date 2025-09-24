// Centralized Pricing Configuration
// This is the SINGLE SOURCE OF TRUTH for all pricing in the application

// Centralized pricing constants - SINGLE SOURCE OF TRUTH
// Production pricing - Update these values for real pricing
const PRICING_CONSTANTS = {
  PRO_PLAN_PRICE: process.env.NODE_ENV === 'production' ? 999 : 1, // ₹999 in production, ₹1 for testing
  PRO_PLUS_PLAN_PRICE: process.env.NODE_ENV === 'production' ? 1999 : 2, // ₹1999 in production, ₹2 for testing
  PREMIUM_PLAN_PRICE: process.env.NODE_ENV === 'production' ? 999 : 1, // Premium is alias for Pro
  CURRENCY: 'INR',
};

export interface PlanPricing {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  currency: string;
  description: string;
  features: string[];
  duration: number; // in days
  mockTests: number;
  isActive: boolean;
  displayOrder: number;
  popular?: boolean;
}

// Centralized pricing configuration - SINGLE SOURCE OF TRUTH
export const PRICING_CONFIG: Record<string, PlanPricing> = {
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: PRICING_CONSTANTS.PRO_PLAN_PRICE,
    originalPrice: 199,
    currency: PRICING_CONSTANTS.CURRENCY,
    description: 'Access to 11 mock tests',
    features: [
      '11 Mock Tests',
      '3 Months Access',
      'Detailed Solutions',
      'Performance Analytics'
    ],
    duration: 90, // days
    mockTests: 11,
    isActive: true,
    displayOrder: 2
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro Plus Plan',
    price: PRICING_CONSTANTS.PRO_PLUS_PLAN_PRICE,
    originalPrice: 599,
    currency: PRICING_CONSTANTS.CURRENCY,
    description: 'Complete access to all mocks and features',
    features: [
      'Unlimited Mock Tests',
      '12 Months Access',
      'Detailed Solutions',
      'Performance Analytics',
      'Priority Supports'
    ],
    duration: 365, // days
    mockTests: 9999, // unlimited
    isActive: true,
    displayOrder: 1,
    popular: true
  }
};

// Helper functions to get pricing data
export const getPlanPricing = (planId: string): PlanPricing | null => {
  return PRICING_CONFIG[planId] || null;
};

export const getAllActivePlans = (): PlanPricing[] => {
  return Object.values(PRICING_CONFIG)
    .filter(plan => plan.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

export const getPlanPrice = (planId: string): number => {
  const plan = getPlanPricing(planId);
  return plan ? plan.price : 0;
};

// For Edge Functions - simple price mapping
export const PLAN_PRICES: Record<string, number> = {
  pro: PRICING_CONFIG.pro.price,
  pro_plus: PRICING_CONFIG.pro_plus.price,
  premium: PRICING_CONFIG.pro.price, // alias for pro
};

// Validation helpers
export const isValidPlanId = (planId: string): boolean => {
  return planId in PRICING_CONFIG;
};

export const isActivePlan = (planId: string): boolean => {
  const plan = getPlanPricing(planId);
  return plan ? plan.isActive : false;
};

// Price formatting
export const formatPrice = (price: number, currency: string = 'INR'): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

// Export for easy access
export default PRICING_CONFIG;
