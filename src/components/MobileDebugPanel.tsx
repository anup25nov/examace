import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Trash2, Eye, EyeOff, Bug } from 'lucide-react';
import { mobileDebugger } from '@/lib/mobileDebugger';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

const MobileDebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');

  useEffect(() => {
    // Load initial logs
    setLogs(mobileDebugger.getRecentLogs(50));
    
    // Update logs every second
    const interval = setInterval(() => {
      setLogs(mobileDebugger.getRecentLogs(50));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const exportLogs = () => {
    const logData = mobileDebugger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-debug-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    const logData = mobileDebugger.exportLogs();
    navigator.clipboard.writeText(logData).then(() => {
      alert('Logs copied to clipboard!');
    });
  };

  const clearLogs = () => {
    mobileDebugger.clearLogs();
    setLogs([]);
  };

  // Show debug panel only in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                   localStorage.getItem('debug-mode') === 'enabled';

  if (!shouldShow) return null;

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        style={{ display: isVisible ? 'none' : 'block' }}
      >
        <Bug className="w-6 h-6" />
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">Mobile Debug Panel</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLogs}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLogs}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Hide
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Filter Buttons */}
              <div className="flex space-x-2">
                {(['all', 'error', 'warn', 'info'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={filter === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(level)}
                  >
                    {level.toUpperCase()}
                    <Badge variant="secondary" className="ml-2">
                      {level === 'all' ? logs.length : logs.filter(l => l.level === level).length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Logs Display */}
              <ScrollArea className="h-96 w-full border rounded-md p-4 bg-gray-50">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No logs found for the selected filter.
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${getLogColor(log.level)}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="font-medium text-sm mb-1">
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Data
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded border overflow-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                        {log.stack && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Stack
                            </summary>
                            <pre className="mt-2 p-2 bg-white rounded border overflow-auto text-xs">
                              {log.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mobileDebugger.info('Test Info Log', { test: true })}
                >
                  Test Info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mobileDebugger.warn('Test Warning Log', { test: true })}
                >
                  Test Warning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => mobileDebugger.error('Test Error Log', { test: true, stack: new Error().stack })}
                >
                  Test Error
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default MobileDebugPanel;
