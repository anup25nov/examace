# 📱 ExamAce APK Build Guide

Complete step-by-step guide to build and deploy your ExamAce Android APK.

## 📋 Prerequisites

### 1. System Requirements
- **macOS** (for iOS builds) or **Windows/Linux** (for Android builds)
- **Node.js** (v16 or higher)
- **Java JDK** (v17 recommended)
- **Android Studio** with Android SDK
- **Git** (for version control)

### 2. Required Software Installation

#### Install Java JDK
```bash
# macOS (using Homebrew)
brew install openjdk@17

# Verify installation
java -version
```

#### Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and install:
   - Android SDK
   - Android SDK Platform-Tools
   - Android SDK Build-Tools

#### Set Environment Variables
Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export PATH=$PATH:$JAVA_HOME/bin
```

Reload your shell:
```bash
source ~/.zshrc
```

## 🚀 Quick Build (Automated)

### Option 1: Use Existing Build Script
```bash
# Make script executable
chmod +x build-apk.sh

# Run the build script
./build-apk.sh
```

This will:
1. Build the web application
2. Sync with Android project
3. Build the APK
4. Show the APK location

## 🔧 Manual Build Process

### Step 1: Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Capacitor CLI globally (if not already installed)
npm install -g @capacitor/cli
```

### Step 2: Build Web Application
```bash
# Build the React/Vite application for production
npm run build
```

**Expected Output:**
```
✓ 1951 modules transformed.
dist/index.html                                      1.39 kB │ gzip:   0.56 kB
dist/assets/index-Brvy2EC6.css                     102.46 kB │ gzip:  16.23 kB
dist/assets/index-C6RXzY5e.js                      690.99 kB │ gzip: 200.83 kB
✓ built in 1.83s
```

### Step 3: Sync with Android Project
```bash
# Sync web assets with Android project
npx cap sync android
```

**Expected Output:**
```
✔ Copying web assets from dist to android/app/src/main/assets/public
✔ Creating capacitor.config.json in android/app/src/main/assets
✔ Updating Android plugins
✔ update android in 33.93ms
[info] Sync finished in 0.076s
```

### Step 4: Build Android APK
```bash
# Navigate to Android project
cd android

# Build debug APK
./gradlew assembleDebug

# Or build release APK (for production)
./gradlew assembleRelease
```

**Expected Output:**
```
BUILD SUCCESSFUL in 8s
85 actionable tasks: 85 executed
```

### Step 5: Locate Your APK
```bash
# Debug APK location
ls -la android/app/build/outputs/apk/debug/

# Release APK location (if built)
ls -la android/app/build/outputs/apk/release/
```

## 📱 APK Installation & Testing

### Install on Android Device

#### Method 1: Using ADB (Android Debug Bridge)
```bash
# Connect your Android device via USB
# Enable Developer Options and USB Debugging

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch the app
adb shell am start -n com.examace.app/.MainActivity
```

#### Method 2: Manual Installation
1. **Transfer APK** to your Android device
2. **Enable "Install from Unknown Sources"**:
   - Go to Settings → Security → Unknown Sources
   - Or Settings → Apps → Special Access → Install Unknown Apps
3. **Install APK** by tapping on the file
4. **Launch ExamAce** from your app drawer

### Test Key Features
- [ ] User registration/login
- [ ] Exam interface
- [ ] Payment system (Razorpay)
- [ ] Referral system
- [ ] Membership features
- [ ] Offline functionality

## 🏪 Play Store Deployment

### Step 1: Create Release APK
```bash
# Generate signed APK for Play Store
cd android
./gradlew assembleRelease
```

### Step 2: Sign the APK (Required for Play Store)
```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore examace-release-key.keystore -alias examace -keyalg RSA -keysize 2048 -validity 10000

# Sign the APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore examace-release-key.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk examace

# Align the APK
zipalign -v 4 android/app/build/outputs/apk/release/app-release-unsigned.apk android/app/build/outputs/apk/release/app-release-signed.apk
```

### Step 3: Google Play Console Setup
1. **Create Google Play Console Account**: https://play.google.com/console
2. **Pay Registration Fee**: $25 (one-time)
3. **Create New App**:
   - App name: ExamAce
   - Package name: com.examace.app
   - Category: Education
4. **Upload APK**:
   - Go to Release → Production
   - Upload your signed APK
   - Fill in app details, screenshots, descriptions
5. **Submit for Review**

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Java Not Found
```bash
# Error: Java is not installed
# Solution: Install Java JDK
brew install openjdk@17
```

#### 2. Android SDK Not Found
```bash
# Error: ANDROID_HOME is not set
# Solution: Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 3. Build Failures
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

#### 4. Sync Issues
```bash
# Clear Capacitor cache and resync
npx cap sync android --force
```

#### 5. APK Installation Failed
- Check if device has enough storage
- Enable "Install from Unknown Sources"
- Try installing via ADB instead

### Build Optimization

#### Reduce APK Size
```bash
# Enable ProGuard (in android/app/build.gradle)
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### Enable Bundle Splitting
```javascript
// In vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
})
```

## 📊 Build Information

### Current APK Details
- **App ID**: com.examace.app
- **App Name**: ExamAce
- **Version**: 1.0.0
- **Size**: ~4.6 MB (debug)
- **Target SDK**: Android 13+
- **Min SDK**: Android 21 (Android 5.0)

### Features Included
- ✅ React/Vite web application
- ✅ Capacitor mobile wrapper
- ✅ Razorpay payment integration
- ✅ Supabase database
- ✅ User authentication
- ✅ Exam interface
- ✅ Referral system
- ✅ Membership management

## 🎯 Next Steps

### After Successful Build
1. **Test thoroughly** on multiple devices
2. **Fix any bugs** found during testing
3. **Optimize performance** and reduce APK size
4. **Create release version** with proper signing
5. **Upload to Play Store** following guidelines
6. **Monitor app performance** and user feedback

### Continuous Integration
Consider setting up:
- **GitHub Actions** for automated builds
- **Fastlane** for automated deployment
- **App Center** for beta testing
- **Firebase** for crash reporting

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Capacitor documentation: https://capacitorjs.com/docs
3. Check Android Studio logs for detailed error messages
4. Ensure all prerequisites are properly installed

---

**Happy Building! 🚀**

*Last updated: September 2024*

