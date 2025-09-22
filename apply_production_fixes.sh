#!/bin/bash

# Production Fixes Application Script
# This script applies all the database and code fixes for production readiness

set -e  # Exit on any error

echo "🚀 Starting Production Fixes Application..."

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
    print_error "Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_error "Please run this script from the project root directory."
    exit 1
fi

print_status "Applying database migrations..."

# Apply database migrations
print_status "Applying schema fixes migration..."
supabase db push --include-all

if [ $? -eq 0 ]; then
    print_success "Database migrations applied successfully!"
else
    print_error "Failed to apply database migrations!"
    exit 1
fi

# Verify database connection
print_status "Verifying database connection..."
supabase db ping

if [ $? -eq 0 ]; then
    print_success "Database connection verified!"
else
    print_error "Database connection failed!"
    exit 1
fi

# Check if TypeScript compilation works
print_status "Checking TypeScript compilation..."
npm run build

if [ $? -eq 0 ]; then
    print_success "TypeScript compilation successful!"
else
    print_warning "TypeScript compilation had issues. Please check the output above."
fi

# Run linting
print_status "Running ESLint..."
npm run lint

if [ $? -eq 0 ]; then
    print_success "Linting passed!"
else
    print_warning "Linting had issues. Please check the output above."
fi

# Check for any remaining issues
print_status "Checking for common issues..."

# Check for unused imports
if grep -r "import.*unused" src/ 2>/dev/null; then
    print_warning "Found potential unused imports. Please review."
fi

# Check for console.log statements in production code
if grep -r "console\.log" src/ 2>/dev/null; then
    print_warning "Found console.log statements. Consider removing for production."
fi

# Check for TODO comments
if grep -r "TODO\|FIXME\|HACK" src/ 2>/dev/null; then
    print_warning "Found TODO/FIXME/HACK comments. Please address before production."
fi

print_success "Production fixes application completed!"

echo ""
echo "📋 Next Steps:"
echo "1. Review the PRODUCTION_READINESS_CHECKLIST.md"
echo "2. Update UI components to use new services"
echo "3. Run comprehensive tests"
echo "4. Deploy to staging environment"
echo "5. Perform load testing"
echo "6. Deploy to production"
echo ""

print_status "All critical database and code fixes have been applied!"
print_status "The application is now ready for UI updates and testing."
