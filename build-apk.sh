#!/bin/bash

# ExamAce APK Build Script
# This script builds the ExamAce Android APK

echo "🚀 Building ExamAce APK..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java JDK first."
    echo "Run: brew install openjdk@17"
    exit 1
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME is not set. Please install Android Studio and set up environment variables."
    echo "Add to your ~/.zshrc:"
    echo "export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    exit 1
fi

# Build the web app
echo "📦 Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
fi

# Sync with Android
echo "🔄 Syncing with Android project..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Android sync failed!"
    exit 1
fi

# Build APK
echo "🔨 Building Android APK..."
cd android
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ APK built successfully!"
    echo "📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🎉 Your ExamAce APK is ready!"
    echo "📋 Next steps:"
    echo "1. Test the APK on an Android device"
    echo "2. Create a Google Play Console account"
    echo "3. Upload your APK to the Play Store"
    echo ""
    echo "📖 See PLAY_STORE_SETUP_GUIDE.md for detailed instructions"
else
    echo "❌ APK build failed!"
    exit 1
fi
