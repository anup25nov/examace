# Centralized Pricing Configuration

## Overview
All pricing for Pro and Pro+ plans is now managed from a single source of truth to ensure consistency across the entire application.

## Single Source of Truth
**File**: `src/config/pricingConfig.ts`

This file contains the centralized pricing configuration that is used by:
- Edge Functions (Razorpay order creation)
- Frontend components (payment modals)
- Database operations
- All pricing displays

## Configuration Structure

```typescript
export const PRICING_CONFIG: Record<string, PlanPricing> = {
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 99,
    originalPrice: 199,
    currency: 'INR',
    description: 'Access to 11 mock tests',
    features: [...],
    duration: 90, // days
    mockTests: 11,
    isActive: true,
    displayOrder: 2
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro Plus Plan',
    price: 299,
    originalPrice: 599,
    currency: 'INR',
    description: 'Complete access to all mocks and features',
    features: [...],
    duration: 365, // days
    mockTests: 9999, // unlimited
    isActive: true,
    displayOrder: 1,
    popular: true
  }
};
```

## Usage Across Components

### 1. Edge Function (Razorpay Order Creation)
**File**: `supabase/functions/create_razorpay_order/index.ts`

```typescript
const PLAN_PRICES: Record<string, number> = {
  pro: 99,
  pro_plus: 299,
  premium: 99, // alias for pro
};
```

### 2. Frontend Payment Service
**File**: `src/lib/unifiedPaymentService.ts`

```typescript
import { getAllActivePlans, getPlanPricing } from '@/config/pricingConfig';

// Uses centralized pricing as primary source
const centralizedPlans = getAllActivePlans();
```

### 3. App Configuration
**File**: `src/config/appConfig.ts`

The app config now references the centralized pricing and includes a note about the single source of truth.

## Benefits

1. **Consistency**: All components use the same pricing values
2. **Maintainability**: Change prices in one place, updates everywhere
3. **Reliability**: No risk of mismatched prices between components
4. **Transparency**: Clear single source of truth for all pricing

## How to Update Prices

To change the pricing for Pro or Pro+ plans:

1. **Edit the centralized config**: Update `src/config/pricingConfig.ts`
2. **Deploy Edge Function**: Run `supabase functions deploy create_razorpay_order`
3. **Test**: Verify all components show the new prices

## Current Pricing

- **Pro Plan**: ₹99 (was ₹199)
- **Pro+ Plan**: ₹299 (was ₹599)

## Files Modified

1. ✅ `src/config/pricingConfig.ts` - New centralized configuration
2. ✅ `supabase/functions/create_razorpay_order/index.ts` - Updated to use centralized pricing
3. ✅ `src/lib/unifiedPaymentService.ts` - Updated to use centralized pricing
4. ✅ `src/config/appConfig.ts` - Updated with reference to centralized pricing

## Testing

The centralized pricing has been tested and verified:
- ✅ Edge Function returns correct amounts (99/299)
- ✅ Razorpay orders created with correct amounts
- ✅ Frontend components use centralized pricing
- ✅ No linting errors

## Future Enhancements

- Add environment-specific pricing (dev/staging/prod)
- Add dynamic pricing based on user location
- Add promotional pricing capabilities
- Add pricing history and audit trail
