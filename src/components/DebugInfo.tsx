import React from 'react';

const DebugInfo: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Environment: {import.meta.env.MODE}</div>
        <div>Supabase URL: {supabaseUrl ? '✅ Set' : '❌ Missing'}</div>
        <div>Supabase Key: {supabaseKey ? '✅ Set' : '❌ Missing'}</div>
        <div>Auth Status: {isAuthenticated || 'Not authenticated'}</div>
        <div>User ID: {userId || 'None'}</div>
        <div>User Email: {userEmail || 'None'}</div>
        <div>Current URL: {window.location.href}</div>
      </div>
    </div>
  );
};


export default DebugInfo;
