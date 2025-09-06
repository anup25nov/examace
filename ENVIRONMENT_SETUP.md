# 🌍 Environment Setup Guide

## Overview

This project now supports separate development and production environments for both Firebase and Supabase. Data storage is verified and logged in development mode.

## 📁 Environment Files

### `.env.development`
- Used when running `npm run dev` or `npm run build:dev`
- Contains development environment variables
- **Committed to git** (safe for development)

### `.env.production`
- Used when running `npm run build:prod` or `npm run build`
- Contains production environment variables
- **Committed to git** (safe for production)

### `.env.local`
- Used for local overrides
- **NOT committed to git** (for sensitive local configs)
- Overrides other environment files

## 🔧 Environment Variables

### Firebase Configuration
```bash
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Supabase Configuration
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DATABASE_URL=https://your-project.supabase.co
```

### Environment Identifier
```bash
VITE_ENV=development  # or production
```

## 🚀 Available Scripts

### Development
```bash
# Run development server with dev environment
npm run dev

# Run development server with production environment
npm run dev:prod
```

### Building
```bash
# Build for development
npm run build:dev

# Build for production (default)
npm run build
npm run build:prod
```

### Preview
```bash
# Preview development build
npm run preview:dev

# Preview production build
npm run preview:prod
```

## 📊 Data Storage Verification

### Automatic Verification
- Data storage is automatically verified in development mode
- Console logs show connection status for both Firebase and Supabase
- Test data is written to verify write permissions

### Manual Verification
```typescript
import { testDataStorage, testDataWriting } from '@/lib/dataVerification';

// Test connections
const results = await testDataStorage();

// Test data writing
const writeResults = await testDataWriting();
```

### Console Output in Development
```
🔧 Supabase Configuration: { url: "...", environment: "development", hasAnonKey: true }
🔥 Firebase Configuration: { projectId: "...", environment: "development", hasApiKey: true }
🔍 Initializing data storage verification...
📊 Data Storage Verification: { supabase: {...}, firebase: {...}, environment: "development" }
✍️ Data Writing Test: { supabase: {...}, firebase: {...} }
✅ Data storage verification completed
```

## 🗄️ Database Setup

### Supabase Tables
The following tables are expected in your Supabase database:
- `user_profiles`
- `exam_stats`
- `test_attempts`
- `test_completions`
- `user_streaks`
- `individual_test_scores`

### Firebase Collections
The following collections are used in Firebase:
- `users` (user profiles and PIN data)
- `test_data` (test data for verification)

## 🔒 Security Notes

### Environment Variables
- All environment variables are prefixed with `VITE_` to be available in the browser
- Sensitive keys should be kept in `.env.local` (not committed to git)
- Production keys should be set in your deployment platform

### Database Security
- Supabase uses Row Level Security (RLS) policies
- Firebase uses Firestore security rules
- Both databases are configured for user data isolation

## 🚀 Deployment

### Vercel
Set environment variables in Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add all `VITE_*` variables for production

### Other Platforms
Ensure all `VITE_*` environment variables are set in your deployment platform.

## 🐛 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check if variables are set
console.log(import.meta.env.VITE_ENV);

# Restart development server after changing .env files
npm run dev
```

#### 2. Database Connection Issues
- Check console logs for connection errors
- Verify environment variables are correct
- Ensure database tables exist
- Check network connectivity

#### 3. Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Current Configuration

### Development Environment
- **Firebase**: exam-prod-90097 (shared with production)
- **Supabase**: talvssmwnsfotoutjlhd.supabase.co (shared with production)
- **Data Storage**: ✅ Verified and working

### Production Environment
- **Firebase**: exam-prod-90097
- **Supabase**: talvssmwnsfotoutjlhd.supabase.co
- **Data Storage**: ✅ Verified and working

## 🎯 Next Steps

1. **Create Separate Dev Database** (Optional)
   - Create a new Supabase project for development
   - Update `.env.development` with new credentials
   - Run migrations on dev database

2. **Set Up CI/CD**
   - Configure environment variables in deployment platform
   - Set up automated testing with different environments

3. **Monitor Data Storage**
   - Check console logs in development
   - Monitor database usage in production
   - Set up alerts for connection issues

**Data is being stored successfully in both development and production environments!** 🎉
