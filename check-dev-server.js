#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');

console.log('🔍 Checking development server status...');

// Check if dev server is running
const checkServer = () => {
  const req = http.get('http://localhost:8080', (res) => {
    console.log('✅ Development server is running on http://localhost:8080');
    console.log('📱 Mobile interface should be accessible');
    console.log('🔧 If you see old logs, try:');
    console.log('   1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
    console.log('   2. Clear browser cache');
    console.log('   3. Open DevTools → Application → Storage → Clear storage');
    console.log('   4. Or visit: http://localhost:8080/force-refresh.html');
  });
  
  req.on('error', (err) => {
    console.log('❌ Development server is not running');
    console.log('🚀 Starting development server...');
    
    exec('npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to start dev server:', error);
        return;
      }
      console.log('✅ Development server started');
      console.log('📱 Access the app at: http://localhost:8080');
    });
  });
};

checkServer();
