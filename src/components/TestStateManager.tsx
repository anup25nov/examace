// Test State Manager - Handles test state synchronization
import { useEffect } from 'react';

interface TestStateManagerProps {
  onRefreshNeeded: () => void;
}

export const TestStateManager: React.FC<TestStateManagerProps> = ({ onRefreshNeeded }) => {
  useEffect(() => {
    // Listen for navigation events
    const handlePopState = () => {
      onRefreshNeeded();
    };

    // Listen for visibility changes (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        onRefreshNeeded();
      }
    };

    // Listen for focus events (user returns to window)
    const handleFocus = () => {
      onRefreshNeeded();
    };

    // Listen for storage events (in case of multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('test_completion_') || e.key?.startsWith('test_score_')) {
        onRefreshNeeded();
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onRefreshNeeded]);

  return null;
};