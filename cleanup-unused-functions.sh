#!/bin/bash

# Supabase Functions Cleanup Script
# This script removes unused Edge Functions and provides SQL to remove unused RPC functions

echo "🧹 SUPABASE FUNCTIONS CLEANUP SCRIPT"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if we're in the right directory
if [ ! -d "supabase/functions" ]; then
    print_status "❌ Error: supabase/functions directory not found. Run this script from the project root." $RED
    exit 1
fi

print_status "📁 Current directory: $(pwd)" $BLUE
print_status "🔍 Checking for unused Edge Functions..." $BLUE
echo ""

# List of unused Edge Functions to remove
UNUSED_EDGE_FUNCTIONS=(
    "debug-signature"
    "get-test-questions" 
    "test-cors"
)

# List of functions to keep (even if they seem unused)
KEEP_FUNCTIONS=(
    "razorpay-webhook"  # Keep for production webhook handling
)

print_status "🗑️  UNUSED Edge Functions to remove:" $YELLOW
for func in "${UNUSED_EDGE_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        print_status "  • $func" $YELLOW
    else
        print_status "  • $func (not found)" $RED
    fi
done
echo ""

print_status "✅ Edge Functions to keep:" $GREEN
for func in "${KEEP_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        print_status "  • $func" $GREEN
    else
        print_status "  • $func (not found)" $RED
    fi
done
echo ""

# Ask for confirmation
read -p "Do you want to remove the unused Edge Functions? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "🗑️  Removing unused Edge Functions..." $YELLOW
    
    for func in "${UNUSED_EDGE_FUNCTIONS[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            print_status "  Removing $func..." $YELLOW
            rm -rf "supabase/functions/$func"
            if [ $? -eq 0 ]; then
                print_status "  ✅ Removed $func" $GREEN
            else
                print_status "  ❌ Failed to remove $func" $RED
            fi
        else
            print_status "  ⚠️  $func not found, skipping" $YELLOW
        fi
    done
    
    echo ""
    print_status "✅ Edge Functions cleanup completed!" $GREEN
else
    print_status "⏭️  Skipping Edge Functions cleanup" $YELLOW
fi

echo ""
print_status "🔧 RPC Functions cleanup requires database access" $BLUE
print_status "Run the following SQL in your Supabase SQL Editor:" $BLUE
echo ""

cat << 'EOF'
-- Remove unused RPC Functions
-- WARNING: Make sure to backup your database before running these commands

-- Remove calculate_exam_ranks function
DROP FUNCTION IF EXISTS calculate_exam_ranks(text);

-- Check if Args is a real function or parsing error
-- If it's a real function, remove it:
-- DROP FUNCTION IF EXISTS Args;

-- Verify the functions were removed
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('calculate_exam_ranks', 'Args')
ORDER BY proname;
EOF

echo ""
print_status "📊 To check for table triggers, run check-triggers.sql in Supabase SQL Editor" $BLUE
print_status "📋 Full audit report available in supabase-audit-report.md" $BLUE
echo ""
print_status "✨ Cleanup script completed!" $GREEN
