# Development Authentication Bypass

This document explains how to use the authentication bypass feature for development purposes.

## Overview

The authentication bypass feature allows developers to skip authentication entirely during development, making it easier to test the application without going through the authentication flow.

## How to Enable

### Method 1: Environment Variable (Recommended)

Add the following environment variable to your `.env` file:

```bash
VITE_BYPASS_AUTH=true
```

### Method 2: Browser Console (Runtime Toggle)

Open the browser console and run:

```javascript
// Toggle auth bypass on/off
toggleAuthBypass()

// Or set it explicitly
toggleAuthBypass(true)  // Enable
toggleAuthBypass(false) // Disable
```

After toggling via console, reload the page to apply changes.

## How It Works

When authentication bypass is enabled:

1. **useAuth Hook**: Returns a mock user instead of checking real authentication
2. **ProtectedRoute**: Skips authentication checks and allows access to all routes
3. **Mock User**: Uses predefined mock user data for consistent testing
4. **Visual Indicator**: Shows a yellow "Auth Bypassed" indicator in the top-right corner

## Mock User Data

When bypass is enabled, the following mock user is used:

```typescript
{
  id: 'dev-bypass-user',
  email: 'dev@example.com',
  phone: '+919999999999',
  pin: '1234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

## Development Indicators

- **Console Logs**: Look for `🔧` prefixed messages indicating bypass is active
- **UI Indicator**: Yellow badge in top-right corner showing "Auth Bypassed"
- **Network**: No authentication API calls are made

## Safety Features

- **Development Only**: Bypass only works in development mode (`import.meta.env.DEV`)
- **Localhost Only**: Additional check for localhost/127.0.0.1 hostnames
- **Visual Feedback**: Clear indicators when bypass is active
- **Easy Toggle**: Can be enabled/disabled without code changes

## Usage Examples

### Testing Without Auth Setup

```bash
# Enable bypass
echo "VITE_BYPASS_AUTH=true" >> .env

# Start development server
npm run dev
```

### Quick Toggle During Development

```javascript
// In browser console
toggleAuthBypass(true)  // Enable bypass
// Reload page
// Test your app without auth

toggleAuthBypass(false) // Disable bypass  
// Reload page
// Test with real auth
```

### Testing Auth Flow

```javascript
// Disable bypass to test real auth
toggleAuthBypass(false)
// Reload and test authentication flow

// Re-enable bypass for continued development
toggleAuthBypass(true)
// Reload and continue development
```

## Troubleshooting

### Bypass Not Working

1. Check if you're in development mode: `import.meta.env.DEV` should be `true`
2. Verify environment variable: `VITE_BYPASS_AUTH=true`
3. Check console for bypass messages
4. Ensure you're on localhost or 127.0.0.1

### Still Getting Auth Redirects

1. Clear localStorage: `localStorage.clear()`
2. Reload the page
3. Check console for bypass activation messages

### Mock User Not Working

1. Verify bypass is enabled (check console logs)
2. Check if `shouldBypassAuth()` returns `true`
3. Look for mock user in useAuth hook logs

## Best Practices

1. **Use Environment Variables**: Set `VITE_BYPASS_AUTH=true` in `.env` for consistent bypass
2. **Test Both Modes**: Regularly test with and without bypass enabled
3. **Clear State**: Clear localStorage when switching between modes
4. **Monitor Console**: Watch for bypass-related console messages
5. **Production Safety**: Never enable bypass in production builds

## Integration with Existing Auth

The bypass feature works alongside existing authentication systems:

- **Supabase Auth**: Bypassed when enabled
- **Firebase Auth**: Bypassed when enabled  
- **Dev Auth**: Bypassed when enabled
- **PIN Auth**: Bypassed when enabled

All authentication methods are bypassed uniformly when the toggle is enabled.
