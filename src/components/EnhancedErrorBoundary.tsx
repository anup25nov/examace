import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { errorHandlingService } from '@/lib/errorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error handling service
    errorHandlingService.handleError(error, {
      action: 'component_error',
      resource: 'react_component',
      url: window.location.href
    });

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  retry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({ isRetrying: true });

    // Clear error state after a short delay
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
    }, 1000);
  };

  goHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>

              {/* Network Status */}
              <div className="flex items-center justify-center space-x-2 text-sm">
                {errorHandlingService.isOnline() ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>

              {/* Retry Queue Status */}
              {errorHandlingService.getRetryQueueLength() > 0 && (
                <div className="text-sm text-blue-600">
                  {errorHandlingService.getRetryQueueLength()} requests queued for retry
                </div>
              )}

              {/* Error Details (Development Only) */}
              {this.props.showDetails && this.state.error && (
                <div className="text-left bg-red-50 p-3 rounded border text-xs font-mono text-red-700 overflow-auto max-h-32">
                  <div className="font-bold mb-2">Error Details:</div>
                  <div>{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <div className="mt-2">
                      <div className="font-bold">Component Stack:</div>
                      <div className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.retry}
                  disabled={this.state.isRetrying || this.state.retryCount >= this.maxRetries}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                  {this.state.retryCount > 0 && ` (${this.state.retryCount}/${this.maxRetries})`}
                </Button>
                <Button
                  variant="outline"
                  onClick={this.goHome}
                  className="flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Retry Count Warning */}
              {this.state.retryCount >= this.maxRetries && (
                <div className="text-sm text-orange-600">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}

// Hook for error boundary context
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

export default EnhancedErrorBoundary;
