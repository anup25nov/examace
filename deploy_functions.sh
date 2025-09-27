#!/bin/bash

# Deploy the updated Edge Functions
echo "Deploying updated Edge Functions..."

# Deploy the create_razorpay_order function
supabase functions deploy create_razorpay_order

echo "Edge Functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Run the SQL commands in apply_fixes.sql on your production database"
echo "2. Test the fixes in your application"
echo ""
echo "The fixes include:"
echo "- update_daily_visit now returns JSON with streak data"
echo "- get_test_rank_and_highest_score checks both individual_test_scores and test_attempts tables"
echo "- Razorpay receipt length is now within 40 character limit"
echo "- Profile visibility issues fixed in frontend"
echo "- Radio group and checkbox sizes reduced in TestStartModal"
