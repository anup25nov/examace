# Referral System Integration Guide

## Quick Start

### 1. Apply Database Migration
Run the SQL script `apply_commission_system.sql` in your Supabase SQL Editor.

### 2. Test the System
Run the SQL script `test_commission_system.sql` in your Supabase SQL Editor to verify everything works.

### 3. Add ReferralDashboard to Your App

#### Option A: Add as a New Page
```tsx
// In your router or main app component
import { ReferralDashboard } from '@/components/ReferralDashboard';

// Add route
<Route path="/referrals" element={<ReferralDashboard />} />
```

#### Option B: Add as a Modal
```tsx
// In your main component
import { ReferralDashboard } from '@/components/ReferralDashboard';
import { useState } from 'react';

function App() {
  const [showReferralDashboard, setShowReferralDashboard] = useState(false);

  return (
    <div>
      {/* Your existing app content */}
      
      {/* Add a button to open referral dashboard */}
      <Button onClick={() => setShowReferralDashboard(true)}>
        View Referrals
      </Button>

      {/* Referral Dashboard Modal */}
      {showReferralDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Referral Dashboard</h2>
                <Button 
                  onClick={() => setShowReferralDashboard(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
              <ReferralDashboard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Option C: Add to Navigation Menu
```tsx
// In your navigation component
import { ReferralDashboard } from '@/components/ReferralDashboard';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Tests', href: '/tests' },
  { name: 'Referrals', component: ReferralDashboard }, // Add this
  { name: 'Profile', href: '/profile' },
];
```

### 4. Test the Complete Flow

1. **Create two test users** (U1 and U2)
2. **U1 gets referral code** automatically on signup
3. **U2 signs up using U1's referral code** during registration
4. **U2 purchases membership** (₹2 pro plan)
5. **Check U1's dashboard** - should show ₹1 commission
6. **Test withdrawal** - U1 can request payout

## Features Available

### For Users:
- ✅ View referral statistics
- ✅ Copy and share referral codes
- ✅ See commission history
- ✅ Request withdrawals
- ✅ Real-time earnings tracking

### For Admins:
- ✅ Monitor referral network
- ✅ Process withdrawal requests
- ✅ Track commission payments

## Database Functions

The system provides these functions:

```sql
-- Get user's referral statistics
SELECT * FROM get_user_referral_stats('user-uuid');

-- Get commission history
SELECT * FROM get_user_commission_history('user-uuid');

-- Request withdrawal
SELECT * FROM request_commission_withdrawal('user-uuid', 10.00, 'bank_transfer');

-- Process commission (called automatically)
SELECT * FROM process_referral_commission('user-uuid', 'payment-id', 'pro', 2.00);
```

## Testing

### Manual Test:
1. Sign up as U1
2. Get referral code from dashboard
3. Sign up as U2 using U1's code
4. U2 purchases membership
5. Check U1's dashboard for commission

### Automated Test:
Run the SQL test script to verify the complete flow.

## Troubleshooting

### Common Issues:

1. **"Function not found" errors**
   - Make sure you ran the `apply_commission_system.sql` script
   - Check that all functions are created in the database

2. **"No referral found" errors**
   - Ensure referral code was applied during signup
   - Check that referral_transactions table has the relationship

3. **"Insufficient balance" errors**
   - User needs to have pending commissions
   - Check referral_commissions table for user's earnings

### Debug Steps:

1. Check if functions exist:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%referral%' OR routine_name LIKE '%commission%';
```

2. Check referral relationships:
```sql
SELECT * FROM referral_transactions WHERE referrer_id = 'user-uuid';
```

3. Check commissions:
```sql
SELECT * FROM referral_commissions WHERE referrer_id = 'user-uuid';
```

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database functions are created
3. Test with the provided SQL scripts
4. Check the implementation guide

The system is now ready for production use!
