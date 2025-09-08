# ExamAce - Google Play Store Setup Guide

## Prerequisites Installation

### 1. Install Java Development Kit (JDK)
```bash
# Install using Homebrew (recommended for macOS)
brew install openjdk@17

# Or download from Oracle: https://www.oracle.com/java/technologies/downloads/
```

### 2. Install Android Studio
1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and install the Android SDK
4. Set up environment variables:
```bash
# Add to your ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Build the APK
After installing the prerequisites:
```bash
# Navigate to your project
cd /Users/anupmishra/Desktop/repos/examace

# Build the web app
npm run build

# Sync with Android
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# The APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

## Google Play Store Setup

### 1. Create Google Play Console Account
1. Go to https://play.google.com/console
2. Pay the one-time $25 registration fee
3. Complete developer account verification

### 2. Create New App
1. Click "Create app"
2. Fill in app details:
   - **App name**: ExamAce
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all applicable boxes

### 3. App Information
- **App name**: ExamAce
- **Short description**: Master competitive exams with practice tests and mock exams
- **Full description**: 
```
ExamAce is your comprehensive exam preparation companion designed to help you excel in competitive examinations. 

🎯 Key Features:
• Practice Tests: Access thousands of practice questions
• Mock Exams: Simulate real exam conditions
• Performance Analytics: Track your progress with detailed insights
• Study Materials: Comprehensive resources for exam preparation
• Offline Support: Study anywhere, anytime
• Progress Tracking: Monitor your improvement over time

📚 Supported Exams:
• SSC CGL
• Banking Exams
• Railway Exams
• And many more competitive exams

🚀 Why Choose ExamAce:
• Expert-curated content
• Real-time performance tracking
• Adaptive learning approach
• Mobile-optimized interface
• Regular updates with new content

Start your exam preparation journey today and achieve your goals with ExamAce!
```

### 4. Graphics Assets
You'll need to create:
- **App icon**: 512x512 PNG (high-res icon)
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2, up to 8 screenshots
  - Phone: 16:9 or 9:16 aspect ratio
  - Tablet: 16:10 or 10:16 aspect ratio

### 5. Content Rating
Complete the content rating questionnaire (Educational/Reference category)

### 6. Target Audience
- **Primary audience**: 18+ years
- **Secondary audience**: 13-17 years (with parental guidance)

### 7. Data Safety
Complete the data safety form:
- Data collection: Yes (user progress, performance analytics)
- Data sharing: No
- Data encryption: Yes (in transit)

### 8. App Access
- **App availability**: All countries
- **Device categories**: Phone and Tablet

## APK/AAB Upload

### For Testing (Internal Testing)
1. Go to "Testing" → "Internal testing"
2. Upload your APK/AAB file
3. Add testers by email
4. Share the testing link

### For Production Release
1. Go to "Production"
2. Upload your signed APK/AAB
3. Complete store listing
4. Submit for review

## Signing Your App

### Generate Keystore (for production)
```bash
keytool -genkey -v -keystore examace-release-key.keystore -alias examace -keyalg RSA -keysize 2048 -validity 10000
```

### Configure signing in build.gradle
Add to `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('examace-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'examace'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Important Notes

1. **Keep your keystore safe** - You'll need it for all future updates
2. **Test thoroughly** - Use internal testing before production release
3. **Follow Google's policies** - Ensure compliance with Play Store policies
4. **Regular updates** - Keep your app updated with new features and bug fixes

## Support and Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Android Developer Documentation](https://developer.android.com/)
- [Capacitor Documentation](https://capacitorjs.com/docs)

## Next Steps

1. Install the prerequisites
2. Build your APK
3. Create Google Play Console account
4. Upload and test your app
5. Submit for review
6. Publish to Play Store

Good luck with your ExamAce app launch! 🚀
