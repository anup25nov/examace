// Auth Debugger Component
// This component helps debug authentication issues in development

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAuthState, clearAllAuthData } from '@/lib/authUtils';

interface AuthDebuggerProps {
  enabled?: boolean;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ enabled = false }) => {
  const { user, loading, isAuthenticated, resetAuth } = useAuth();
  const [authState, setAuthState] = useState(getAuthState());
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const currentState = getAuthState();
      setAuthState(currentState);
      
      const logEntry = `[${new Date().toLocaleTimeString()}] Auth State: ${JSON.stringify(currentState)}`;
      setLogs(prev => [...prev.slice(-9), logEntry]);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  const handleClearAuth = () => {
    clearAllAuthData();
    resetAuth();
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Auth data cleared`]);
  };

  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debugger</h3>
        <button
          onClick={handleClearAuth}
          className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-xs"
        >
          Clear Auth
        </button>
      </div>
      
      <div className="space-y-1 mb-2">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
        <div>User ID: {user?.id || 'null'}</div>
        <div>User Phone: {user?.phone || 'null'}</div>
      </div>
      
      <div className="space-y-1 mb-2">
        <div>localStorage userId: {authState.userId || 'null'}</div>
        <div>localStorage userPhone: {authState.userPhone || 'null'}</div>
        <div>localStorage isAuthenticated: {authState.isAuthenticated ? 'true' : 'false'}</div>
      </div>
      
      <div className="max-h-32 overflow-y-auto">
        <div className="font-semibold mb-1">Recent Logs:</div>
        {logs.map((log, index) => (
          <div key={index} className="text-xs opacity-75">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
