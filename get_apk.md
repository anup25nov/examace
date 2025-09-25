# 1. Build web app
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Build release APK
cd android
./gradlew assembleRelease


location : android/app/build/outputs/apk/release/app-release.apk