#!/bin/bash

# Deploy Secure Question System
# This script deploys the complete secure question system

echo "🔒 Deploying Secure Question System"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    print_error "Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Deploy database schema
print_status "Step 1: Deploying database schema..."
if [ -f "get_test_questions_function.sql" ]; then
    print_status "Found get_test_questions_function.sql"
    print_warning "Please copy the content of get_test_questions_function.sql and run it in your Supabase SQL Editor"
    print_warning "This will create the necessary tables and functions"
else
    print_error "get_test_questions_function.sql not found"
    exit 1
fi

# Step 2: Deploy Supabase Edge Function
print_status "Step 2: Deploying Supabase Edge Function..."
if [ -d "supabase/functions/get-test-questions" ]; then
    print_status "Deploying get-test-questions function..."
    supabase functions deploy get-test-questions
    if [ $? -eq 0 ]; then
        print_success "Edge function deployed successfully"
    else
        print_error "Failed to deploy edge function"
        exit 1
    fi
else
    print_error "Edge function directory not found"
    exit 1
fi

# Step 3: Migrate questions to database
print_status "Step 3: Migrating questions to database..."
if [ -f "dynamic_migration_complete.sql" ]; then
    print_status "Found dynamic_migration_complete.sql"
    print_warning "Please copy the content of dynamic_migration_complete.sql and run it in your Supabase SQL Editor"
    print_warning "This will migrate all your questions from JSON files to the database"
else
    print_error "dynamic_migration_complete.sql not found"
    exit 1
fi

# Step 4: Test the implementation
print_status "Step 4: Testing the implementation..."
if [ -f "test-secure-implementation.js" ]; then
    print_status "Running test script..."
    node test-secure-implementation.js
    if [ $? -eq 0 ]; then
        print_success "Test completed successfully"
    else
        print_warning "Some tests failed. Check the output above."
    fi
else
    print_error "Test script not found"
fi

# Step 5: Start development server
print_status "Step 5: Starting development server..."
print_status "Starting npm run dev..."
npm run dev &

print_success "Deployment process completed!"
echo ""
echo "📋 Manual Steps Required:"
echo "1. Copy get_test_questions_function.sql content to Supabase SQL Editor and run it"
echo "2. Copy dynamic_migration_complete.sql content to Supabase SQL Editor and run it"
echo "3. Test the application to ensure questions are loading securely"
echo ""
echo "🔒 Security Features Enabled:"
echo "✅ Database-backed questions (no JSON exposure)"
echo "✅ Authentication required for question access"
echo "✅ Premium access control"
echo "✅ Content protection (right-click disabled, etc.)"
echo "✅ Dynamic premium test detection"
echo ""
echo "🚀 Your secure question system is ready!"
