import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  CreditCard,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { refundProcessingService, RefundRequest } from '@/lib/refundProcessingService';
import { useAuth } from '@/hooks/useAuth';

interface RefundManagementProps {
  onClose?: () => void;
}

export const RefundManagement: React.FC<RefundManagementProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    completedRefunds: 0,
    failedRefunds: 0,
    totalRefundAmount: 0,
    averageRefundAmount: 0
  });

  useEffect(() => {
    loadRefunds();
    loadStats();
  }, [filter]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const { data, error } = await refundProcessingService.getRefundRequests(
        filter === 'all' ? undefined : filter
      );
      
      if (error) {
        setError(error);
      } else {
        setRefunds(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await refundProcessingService.getRefundStatistics();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load refund statistics:', err);
    }
  };

  const handleProcessRefund = async (refundId: string) => {
    try {
      setProcessing(prev => new Set(prev).add(refundId));
      
      const result = await refundProcessingService.processRefund(refundId);
      
      if (result.success) {
        setError(null);
        await loadRefunds();
        await loadStats();
      } else {
        setError(result.error || 'Failed to process refund');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(refundId);
        return newSet;
      });
    }
  };

  const handleCancelRefund = async (refundId: string) => {
    try {
      setProcessing(prev => new Set(prev).add(refundId));
      
      const result = await refundProcessingService.cancelRefundRequest(
        refundId, 
        adminNotes || 'Cancelled by admin'
      );
      
      if (result.success) {
        setError(null);
        await loadRefunds();
        await loadStats();
        setAdminNotes('');
        setSelectedRefund(null);
        setShowDetails(false);
      } else {
        setError(result.error || 'Failed to cancel refund');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel refund');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(refundId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: X }
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

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      user_requested: { color: 'bg-blue-100 text-blue-800', text: 'User Requested' },
      payment_failed: { color: 'bg-red-100 text-red-800', text: 'Payment Failed' },
      duplicate_payment: { color: 'bg-orange-100 text-orange-800', text: 'Duplicate Payment' },
      service_unavailable: { color: 'bg-purple-100 text-purple-800', text: 'Service Unavailable' },
      fraud_detected: { color: 'bg-red-100 text-red-800', text: 'Fraud Detected' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.user_requested;

    return (
      <Badge className={`${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredRefunds = refunds.filter(refund => {
    if (filter === 'all') return true;
    return refund.status === filter;
  });

  if (loading && refunds.length === 0) {
    return (
      <Card className="w-full max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refund Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading refund requests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Refund Management
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={loadRefunds}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRefunds}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingRefunds}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completedRefunds}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.failedRefunds}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatAmount(stats.totalRefundAmount)}</div>
            <div className="text-sm text-purple-700">Total Amount</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{formatAmount(stats.averageRefundAmount)}</div>
            <div className="text-sm text-indigo-700">Average</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'] as const).map((status) => (
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

        {/* Refunds List */}
        <div className="space-y-4">
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No refund requests found for the selected filter.
            </div>
          ) : (
            filteredRefunds.map((refund) => (
              <Card key={refund.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(refund.status)}
                      {getTypeBadge(refund.type)}
                      <span className="text-lg font-semibold text-green-600">
                        {formatAmount(refund.amount)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">User:</span>
                        <span className="font-mono">{refund.user_id.slice(0, 8)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-mono">{refund.payment_id.slice(0, 12)}...</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Requested:</span>
                        <span>{formatDate(refund.requested_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Reason:</span>
                        <span className="text-sm">{refund.reason}</span>
                      </div>
                    </div>

                    {refund.admin_notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Admin Notes:</strong> {refund.admin_notes}
                      </div>
                    )}

                    {refund.refund_id && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Refund ID:</strong> {refund.refund_id}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedRefund(refund);
                        setShowDetails(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>

                    {refund.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleProcessRefund(refund.id)}
                          size="sm"
                          disabled={processing.has(refund.id)}
                        >
                          {processing.has(refund.id) ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetails(true);
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Refund Details Modal */}
        {showDetails && selectedRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Refund Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="mt-1">{getTypeBadge(selectedRefund.type)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <div className="mt-1 text-lg font-semibold text-green-600">
                      {formatAmount(selectedRefund.amount)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Requested At</label>
                    <div className="mt-1">{formatDate(selectedRefund.requested_at)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Reason</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {selectedRefund.reason}
                  </div>
                </div>

                {selectedRefund.admin_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      {selectedRefund.admin_notes}
                    </div>
                  </div>
                )}

                {selectedRefund.status === 'pending' && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes for this refund request..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedRefund(null);
                      setAdminNotes('');
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                  
                  {selectedRefund.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleProcessRefund(selectedRefund.id)}
                        disabled={processing.has(selectedRefund.id)}
                      >
                        {processing.has(selectedRefund.id) ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Approve Refund
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleCancelRefund(selectedRefund.id)}
                        variant="destructive"
                        disabled={processing.has(selectedRefund.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Refund
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RefundManagement;
