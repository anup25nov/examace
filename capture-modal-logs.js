// Modal Log Capture Script
// Run this in the browser console to capture modal logs

(function() {
    console.log('🔍 Starting Modal Log Capture...');
    
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Array to store modal-related logs
    const modalLogs = [];
    
    // Override console.log to capture modal logs
    console.log = function(...args) {
        const message = args.join(' ');
        
        // Check if this is a modal-related log
        if (message.includes('[ModalWrapper]') || 
            message.includes('[MembershipPlans]') || 
            message.includes('[ModalDebugger]') ||
            message.includes('[useViewportModal]')) {
            
            modalLogs.push({
                timestamp: new Date().toISOString(),
                type: 'log',
                message: message,
                args: args
            });
            
            // Highlight modal logs
            originalLog('%c' + message, 'color: #3b82f6; font-weight: bold;');
        } else {
            originalLog(...args);
        }
    };
    
    // Override console.error to capture modal errors
    console.error = function(...args) {
        const message = args.join(' ');
        
        if (message.includes('[ModalWrapper]') || 
            message.includes('[MembershipPlans]') || 
            message.includes('[ModalDebugger]') ||
            message.includes('[useViewportModal]')) {
            
            modalLogs.push({
                timestamp: new Date().toISOString(),
                type: 'error',
                message: message,
                args: args
            });
            
            originalError('%c' + message, 'color: #ef4444; font-weight: bold;');
        } else {
            originalError(...args);
        }
    };
    
    // Function to get captured logs
    window.getModalLogs = function() {
        console.log('📊 Captured Modal Logs:', modalLogs);
        return modalLogs;
    };
    
    // Function to clear logs
    window.clearModalLogs = function() {
        modalLogs.length = 0;
        console.log('🗑️ Modal logs cleared');
    };
    
    // Function to export logs as JSON
    window.exportModalLogs = function() {
        const dataStr = JSON.stringify(modalLogs, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'modal-logs-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
        link.click();
        URL.revokeObjectURL(url);
        console.log('💾 Modal logs exported to file');
    };
    
    // Function to show summary
    window.showModalLogSummary = function() {
        const summary = {
            totalLogs: modalLogs.length,
            byType: modalLogs.reduce((acc, log) => {
                acc[log.type] = (acc[log.type] || 0) + 1;
                return acc;
            }, {}),
            byComponent: modalLogs.reduce((acc, log) => {
                const component = log.message.match(/\[([^\]]+)\]/)?.[1] || 'Unknown';
                acc[component] = (acc[component] || 0) + 1;
                return acc;
            }, {}),
            recentLogs: modalLogs.slice(-10).map(log => ({
                timestamp: log.timestamp,
                component: log.message.match(/\[([^\]]+)\]/)?.[1] || 'Unknown',
                message: log.message.substring(0, 100) + (log.message.length > 100 ? '...' : '')
            }))
        };
        
        console.log('📈 Modal Log Summary:', summary);
        return summary;
    };
    
    console.log('✅ Modal Log Capture Started!');
    console.log('📋 Available commands:');
    console.log('- getModalLogs() - View all captured logs');
    console.log('- clearModalLogs() - Clear captured logs');
    console.log('- exportModalLogs() - Download logs as JSON file');
    console.log('- showModalLogSummary() - Show log summary');
    console.log('');
    console.log('🎯 Now open the Choose Plan modal and the logs will be captured automatically!');
})();
