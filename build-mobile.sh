#!/bin/bash

# Mobile build script for Step2Sarkari
echo "🚀 Building Step2Sarkari Mobile App..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build the web app
print_status "Building web application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Web build failed!"
    exit 1
fi

print_success "Web build completed!"

# Sync with Android
print_status "Syncing with Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    print_error "Android sync failed!"
    exit 1
fi

print_success "Android sync completed!"

# Build APK
print_status "Building Android APK..."
cd android
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    print_error "APK build failed!"
    exit 1
fi

cd ..

print_success "APK build completed!"

# Check if APK exists
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    print_success "APK created successfully!"
    print_status "APK Location: $APK_PATH"
    print_status "APK Size: $APK_SIZE"
    
    # Optional: Install APK on connected device
    if command -v adb &> /dev/null; then
        print_status "Installing APK on connected device..."
        adb install -r "$APK_PATH"
        if [ $? -eq 0 ]; then
            print_success "APK installed successfully!"
        else
            print_warning "APK installation failed. Make sure a device is connected."
        fi
    else
        print_warning "ADB not found. APK not installed automatically."
    fi
else
    print_error "APK not found at expected location!"
    exit 1
fi

print_success "🎉 Mobile build process completed successfully!"
print_status "You can find your APK at: $APK_PATH"
