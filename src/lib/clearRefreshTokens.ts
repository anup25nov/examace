// Utility to clear refresh tokens and fix auth errors
// This can be called from browser console or programmatically

export const clearAllTokens = () => {
  try {
    console.log('🧹 Clearing all authentication tokens...');
    
    // Clear all Supabase-related tokens
    const tokenKeys = [
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase.auth.refresh_token',
      'supabase.auth.access_token',
      'supabase.auth.session',
      'supabase.auth.user'
    ];
    
    tokenKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
      }
    });
    
    // Clear any keys that might contain tokens
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('token') || key.includes('refresh') || key.includes('auth') || key.includes('supabase')) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
      }
    });
    
    // Clear all localStorage as final step
    localStorage.clear();
    
    console.log('🎉 All tokens cleared successfully! Please refresh the page.');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error clearing tokens:', error);
    return { success: false, error: error.message };
  }
};

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearAllTokens = clearAllTokens;
  console.log('💡 You can now call clearAllTokens() from the console to clear all auth tokens');
}
