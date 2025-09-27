import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Wrench,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Download,
  Settings
} from 'lucide-react';
import { pwaDiagnosticService, PWADiagnosticResult } from '@/lib/pwaDiagnosticService';

interface PWADiagnosticProps {
  onClose?: () => void;
}

export const PWADiagnostic: React.FC<PWADiagnosticProps> = ({ onClose }) => {
  const [diagnostic, setDiagnostic] = useState<PWADiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await pwaDiagnosticService.runDiagnostic();
      setDiagnostic(result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixIssues = async () => {
    setFixing(true);
    try {
      const result = await pwaDiagnosticService.fixIssues();
      setFixed(result.fixed);
      setFailed(result.failed);
      
      // Re-run diagnostic after fixes
      setTimeout(() => {
        runDiagnostic();
      }, 1000);
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setFixing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PWA Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Running diagnostic...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!diagnostic) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Diagnostic Failed
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to run PWA diagnostic. Please try again.
          </p>
          <Button onClick={runDiagnostic}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            PWA Diagnostic
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostic}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={fixIssues}
              variant="default"
              size="sm"
              disabled={fixing || diagnostic.issues.length === 0}
            >
              {fixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Fix Issues
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(diagnostic.score)}>
              {diagnostic.score}
            </span>
            <span className="text-gray-500">/100</span>
          </div>
          <div className="mb-4">
            <Badge className={`${getScoreBadge(diagnostic.score)} text-lg px-4 py-2`}>
              {diagnostic.score >= 80 ? 'Excellent' : 
               diagnostic.score >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
          <Progress value={diagnostic.score} className="w-full max-w-xs mx-auto" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {diagnostic.isPWA ? '✓' : '✗'}
            </div>
            <div className="text-sm text-blue-700">PWA Mode</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {diagnostic.isInstallable ? '✓' : '✗'}
            </div>
            <div className="text-sm text-green-700">Installable</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {diagnostic.hasServiceWorker ? '✓' : '✗'}
            </div>
            <div className="text-sm text-purple-700">Service Worker</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {diagnostic.hasManifest ? '✓' : '✗'}
            </div>
            <div className="text-sm text-orange-700">Manifest</div>
          </div>
        </div>

        {/* Issues */}
        {diagnostic.issues.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Issues Found</h3>
            <div className="space-y-2">
              {diagnostic.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {diagnostic.recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <div className="space-y-2">
              {diagnostic.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fix Results */}
        {(fixed.length > 0 || failed.length > 0) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fix Results</h3>
            
            {fixed.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-green-700">Fixed:</h4>
                {fixed.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {failed.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-700">Failed:</h4>
                {failed.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Device Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Platform</div>
              <div className="flex items-center gap-2">
                {/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span>{navigator.platform}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Connection</div>
              <div className="flex items-center gap-2">
                {navigator.onLine ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Browser</div>
              <div>{navigator.userAgent.split(' ').pop()}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Protocol</div>
              <div>{location.protocol}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWADiagnostic;
