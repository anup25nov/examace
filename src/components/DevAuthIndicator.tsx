import { shouldBypassAuth, devConfig } from '@/config/devConfig';

export const DevAuthIndicator = () => {
  // Only show in development and when auth is bypassed
  if (!devConfig.isDevelopment || !shouldBypassAuth()) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-black px-3 py-2 rounded-lg shadow-lg text-sm font-medium border-2 border-yellow-600">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔧</span>
        <span>Auth Bypassed</span>
      </div>
      <div className="text-xs mt-1 opacity-80">
        Dev Mode
      </div>
    </div>
  );
};
