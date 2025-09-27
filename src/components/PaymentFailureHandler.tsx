import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  CreditCard,
  Calendar
} from 'lucide-react';
import { enhancedPaymentService, PaymentFailure } from '@/lib/enhancedPaymentService';
import { useAuth } from '@/hooks/useAuth';

interface PaymentFailureHandlerProps {
  onClose?: () => void;
}

export const PaymentFailureHandler: React.FC<PaymentFailureHandlerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [failures, setFailures] = useState<PaymentFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'retrying' | 'failed' | 'resolved'>('all');

  useEffect(() => {
    loadFailures();
  }, [filter]);

  const loadFailures = async () => {
    try {
      setLoading(true);
      const { data, error } = await enhancedPaymentService.getPaymentFailures(
        filter === 'all' ? undefined : filter
      );
      
      if (error) {
        setError(error);
      } else {
        setFailures(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment failures');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailure = async (failureId: string) => {
    try {
      setRetrying(prev => new Set(prev).add(failureId));
      
      const result = await enhancedPaymentService.handlePaymentFailure(failureId);
      
      if (result.success) {
        // Reload failures to show updated status
        await loadFailures();
      } else {
        setError(result.error || 'Failed to retry payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retry payment');
    } finally {
      setRetrying(prev => {
        const newSet = new Set(prev);
        newSet.delete(failureId);
        return newSet;
      });
    }
  };

  const handleRetryAll = async () => {
    try {
      setLoading(true);
      const result = await enhancedPaymentService.retryFailedPayments();
      
      if (result.success) {
        setError(null);
        await loadFailures();
      } else {
        setError(result.error || 'Failed to retry payments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retry payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      retrying: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getFailureReasonText = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'VALIDATION_ERROR': 'Invalid payment data',
      'MEMBERSHIP_CHECK_FAILED': 'Failed to check existing membership',
      'DUPLICATE_MEMBERSHIP': 'User already has active membership',
      'PLAN_NOT_FOUND': 'Membership plan not found',
      'RAZORPAY_ORDER_FAILED': 'Razorpay order creation failed',
      'DATABASE_ERROR': 'Database operation failed',
      'VERIFICATION_FAILED': 'Payment verification failed',
      'PAYMENT_RECORD_NOT_FOUND': 'Payment record not found',
      'DATABASE_UPDATE_FAILED': 'Failed to update payment record',
      'MEMBERSHIP_CREATION_FAILED': 'Failed to create membership',
      'VERIFICATION_ERROR': 'Payment verification error',
      'TIMEOUT': 'Request timed out',
      'RAZORPAY_ERROR': 'Razorpay service error',
      'RAZORPAY_EXCEPTION': 'Razorpay exception',
      'NETWORK_ERROR': 'Network connectivity issue',
      'RATE_LIMITED': 'Rate limit exceeded',
      'TEMPORARY_FAILURE': 'Temporary service failure',
      'GATEWAY_UNAVAILABLE': 'Payment gateway unavailable',
      'UNEXPECTED_ERROR': 'Unexpected error occurred',
      'MAX_RETRIES_EXCEEDED': 'Maximum retry attempts exceeded'
    };

    return reasonMap[reason] || reason;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredFailures = failures.filter(failure => {
    if (filter === 'all') return true;
    return failure.status === filter;
  });

  const pendingCount = failures.filter(f => f.status === 'pending').length;
  const retryingCount = failures.filter(f => f.status === 'retrying').length;
  const failedCount = failures.filter(f => f.status === 'failed').length;
  const resolvedCount = failures.filter(f => f.status === 'resolved').length;

  if (loading && failures.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Payment Failures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading payment failures...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Payment Failures Management
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={loadFailures}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {pendingCount > 0 && (
              <Button
                onClick={handleRetryAll}
                variant="default"
                size="sm"
                disabled={loading}
              >
                Retry All Pending
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{retryingCount}</div>
            <div className="text-sm text-blue-700">Retrying</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
            <div className="text-sm text-green-700">Resolved</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'retrying', 'failed', 'resolved'] as const).map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Failures List */}
        <div className="space-y-4">
          {filteredFailures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payment failures found for the selected filter.
            </div>
          ) : (
            filteredFailures.map((failure) => (
              <Card key={failure.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(failure.status)}
                      <span className="text-sm text-gray-600">
                        {getFailureReasonText(failure.failure_reason)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">User:</span>
                        <span className="font-mono">{failure.user_id.slice(0, 8)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Order:</span>
                        <span className="font-mono">{failure.order_id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Created:</span>
                        <span>{formatDate(failure.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      Retry: {failure.retry_count}/{failure.max_retries}
                      {failure.last_retry_at && (
                        <span className="ml-4">
                          Last retry: {formatDate(failure.last_retry_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {failure.status === 'pending' && failure.retry_count < failure.max_retries && (
                      <Button
                        onClick={() => handleRetryFailure(failure.id)}
                        size="sm"
                        disabled={retrying.has(failure.id)}
                      >
                        {retrying.has(failure.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentFailureHandler;
