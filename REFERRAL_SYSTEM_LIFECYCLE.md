# 🔄 Referral System Status Lifecycle

## 📊 **Status Definitions & Lifecycle**

### **1. `referral_transactions` Table Status Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CREATED       │───▶│   UPDATED       │───▶│   FINAL         │
│                 │    │                 │    │                 │
│ status: pending │    │ status: completed│   │ status: completed│
│ commission_status: pending│ │ commission_status: pending│ │ commission_status: completed│
│ membership_purchased: false│ │ membership_purchased: true│ │ membership_purchased: true│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Step 1: User signs up with referral code**
- `status: "pending"` - Referral relationship created
- `commission_status: "pending"` - No commission yet
- `membership_purchased: false` - No membership yet

**Step 2: User purchases membership**
- `status: "completed"` - Referral is active
- `commission_status: "pending"` - Commission created but not processed
- `membership_purchased: true` - Membership confirmed

**Step 3: Commission processed**
- `status: "completed"` - Referral remains completed
- `commission_status: "completed"` - Commission ready for withdrawal
- `membership_purchased: true` - Membership confirmed

### **2. `referral_commissions` Table Status Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CREATED       │───▶│   READY         │───▶│   WITHDRAWN     │
│                 │    │                 │    │                 │
│ status: pending │    │ status: completed│   │ status: withdrawn│
│ (commission created)│ │ (ready for withdrawal)│ │ (paid out)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Step 1: Commission Created**
- `status: "pending"` - Commission record created
- Commission amount calculated and stored

**Step 2: Commission Ready**
- `status: "completed"` - Commission approved and ready for withdrawal
- User can request withdrawal

**Step 3: Commission Paid**
- `status: "withdrawn"` - Commission paid out to user
- Final state

## 💰 **Earnings Calculation Logic**

### **`total_earnings`**
- **Includes**: All commissions (pending + completed + withdrawn)
- **Formula**: `SUM(commission_amount) WHERE status IN ('pending', 'completed', 'withdrawn')`

### **`pending_earnings`**
- **Includes**: Pending + completed commissions (ready for withdrawal)
- **Formula**: `SUM(commission_amount) WHERE status IN ('pending', 'completed')`

### **`paid_earnings`**
- **Includes**: Only withdrawn commissions
- **Formula**: `SUM(commission_amount) WHERE status = 'withdrawn'`

## 🔧 **Current Issue & Fix**

### **Problem:**
Your commission shows `status: "pending"` but `get_user_referral_earnings` was only counting `status = 'paid'` commissions.

### **Solution:**
Updated the function to include:
- `total_earnings`: All commissions (pending + completed + withdrawn)
- `pending_earnings`: Pending + completed commissions
- `paid_earnings`: Only withdrawn commissions

## 📋 **Status Transition Triggers**

| From Status | To Status | Trigger |
|-------------|-----------|---------|
| `pending` | `completed` | User purchases membership |
| `completed` | `withdrawn` | User requests withdrawal |
| `pending` | `withdrawn` | Direct withdrawal (if allowed) |

## 🎯 **Expected Results After Fix**

With your current data:
- **Commission**: `status: "pending"`, `commission_amount: "0.30"`
- **Expected `total_earnings`**: `0.30` ✅
- **Expected `pending_earnings`**: `0.30` ✅
- **Expected `paid_earnings`**: `0.00` ✅

## 🚀 **Next Steps**

1. **Run the fix**: Execute `fix_earnings_calculation.sql`
2. **Test the endpoint**: Call `get_user_referral_earnings` again
3. **Verify results**: Should now show `total_earnings: 0.30`
