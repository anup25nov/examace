#!/bin/bash

# Run Referral System Fix
echo "🔧 Running Referral System Database Fix..."

# Database connection details
DB_URL="postgresql://postgres:HnX1m5t4aPt9jlTa@db.talvssmwnsfotoutjlhd.supabase.co:5432/postgres"

# Step 1: Run the schema fix
echo "📝 Step 1: Adding missing columns to referral_transactions..."
psql "$DB_URL" -f fix_referral_system_simple.sql

if [ $? -ne 0 ]; then
    echo "❌ Error running schema fix"
    exit 1
fi

# Step 2: Create RPC functions
echo "📝 Step 2: Creating RPC functions..."
psql "$DB_URL" -f create_referral_functions.sql

if [ $? -eq 0 ]; then
    echo "✅ Referral system fix completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Test the referral system using test-referral-system.html"
    echo "2. Deploy the updated webhook: supabase functions deploy razorpay-webhook"
    echo "3. Test a complete payment flow with referral"
else
    echo "❌ Error creating RPC functions"
    exit 1
fi
