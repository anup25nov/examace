// Mobile Debug Helper Script
// Run this in your browser console on mobile to access logs

// Function to get all mobile debug logs
function getMobileLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem('mobileDebugLogs') || '[]');
    console.log('📱 Mobile Debug Logs:', logs);
    return logs;
  } catch (error) {
    console.error('Failed to get mobile logs:', error);
    return [];
  }
}

// Function to clear mobile debug logs
function clearMobileLogs() {
  localStorage.removeItem('mobileDebugLogs');
  console.log('✅ Mobile debug logs cleared');
}

// Function to export logs as JSON
function exportMobileLogs() {
  const logs = getMobileLogs();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Create download link
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mobile-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  console.log('📥 Mobile logs exported');
}

// Function to filter logs by message
function filterLogsByMessage(message) {
  const logs = getMobileLogs();
  const filtered = logs.filter(log => 
    log.message.toLowerCase().includes(message.toLowerCase())
  );
  console.log(`🔍 Logs containing "${message}":`, filtered);
  return filtered;
}

// Function to get logs from last N minutes
function getRecentLogs(minutes = 5) {
  const logs = getMobileLogs();
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const recent = logs.filter(log => new Date(log.timestamp) > cutoff);
  console.log(`⏰ Logs from last ${minutes} minutes:`, recent);
  return recent;
}

// Function to get device info
function getDeviceInfo() {
  const logs = getMobileLogs();
  if (logs.length > 0) {
    const latest = logs[logs.length - 1];
    console.log('📱 Device Info:', {
      userAgent: latest.userAgent,
      screenSize: latest.screenSize,
      isMobile: latest.isMobile,
      timestamp: latest.timestamp
    });
    return latest;
  }
  console.log('No logs found');
  return null;
}

// Make functions available globally
window.mobileDebug = {
  getLogs: getMobileLogs,
  clearLogs: clearMobileLogs,
  exportLogs: exportMobileLogs,
  filterByMessage: filterLogsByMessage,
  getRecent: getRecentLogs,
  getDeviceInfo: getDeviceInfo
};

console.log('🚀 Mobile Debug Helper loaded!');
console.log('Available commands:');
console.log('- mobileDebug.getLogs() - Get all logs');
console.log('- mobileDebug.clearLogs() - Clear all logs');
console.log('- mobileDebug.exportLogs() - Export logs as JSON');
console.log('- mobileDebug.filterByMessage("search") - Filter logs');
console.log('- mobileDebug.getRecent(5) - Get logs from last 5 minutes');
console.log('- mobileDebug.getDeviceInfo() - Get device information');
