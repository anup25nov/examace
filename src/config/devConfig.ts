// Development configuration
// This file contains development-specific settings and toggles

export const devConfig = {
  // Authentication bypass toggle
  // Set to true to disable authentication in development
  bypassAuth: import.meta.env.VITE_BYPASS_AUTH === 'true',
  
  // Development mode detection
  isDevelopment: import.meta.env.DEV || 
                 window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.includes('localhost'),
  
  // Mock user data for bypassed authentication
  mockUser: {
    id: '660edf9c-fcad-41a3-8f27-4a496413899f',
    email: 'anupm.ug19.cs@nitp.ac.in',
    phone: '+919999999999',
    pin: '1234',
    createdAt: '2025-09-06T11:35:18.003578+00:00',
    updatedAt: '2025-09-06T15:21:37.07798+00:00'
  }
};

// Helper function to check if auth should be bypassed
export const shouldBypassAuth = (): boolean => {
  return devConfig.isDevelopment && devConfig.bypassAuth;
};

// Helper function to get mock user data
export const getMockUser = () => {
  return devConfig.mockUser;
};

// Console helper for development
if (devConfig.isDevelopment) {
  console.log('🔧 Development Config:', {
    bypassAuth: devConfig.bypassAuth,
    isDevelopment: devConfig.isDevelopment,
    shouldBypass: shouldBypassAuth()
  });
  
  // Add global helper for toggling auth bypass
  (window as any).toggleAuthBypass = (enabled?: boolean) => {
    if (enabled !== undefined) {
      localStorage.setItem('dev-bypass-auth', enabled.toString());
    } else {
      const current = localStorage.getItem('dev-bypass-auth') === 'true';
      localStorage.setItem('dev-bypass-auth', (!current).toString());
    }
    console.log('Auth bypass toggled. Reload the page to apply changes.');
    console.log('Current setting:', localStorage.getItem('dev-bypass-auth'));
    console.log('User data will be:', devConfig.mockUser);
  };
  
  // Check for localStorage override
  const localStorageBypass = localStorage.getItem('dev-bypass-auth');
  if (localStorageBypass !== null) {
    devConfig.bypassAuth = localStorageBypass === 'true';
    console.log('🔧 Auth bypass overridden via localStorage:', devConfig.bypassAuth);
  }
}
