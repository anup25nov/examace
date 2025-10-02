import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Shield, 
  Flag, 
  IndianRupee, 
  Users, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertTriangle,
  Eye,
  MessageSquare,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface QuestionReport {
  id: string;
  user_id: string;
  user_phone?: string;
  exam_id: string;
  test_type?: string;
  test_id?: string;
  question_id: string;
  issue_type: string; // Changed from report_type to issue_type
  issue_description: string; // Changed from description to issue_description
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_phone: string;
  amount: number;
  payment_method: string;
  payment_details: any;
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionReports, setQuestionReports] = useState<QuestionReport[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin' as any, {
          user_uuid: user.id
        });

        if (!error) {
          setIsAdmin(data);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Load pending requests
  useEffect(() => {
    if (isAdmin) {
      loadPendingRequests();
    }
  }, [isAdmin]);

  const loadPendingRequests = async () => {
    try {
      // Load question reports
      const { data: reportsData, error: reportsError } = await supabase.rpc('get_pending_question_reports' as any);
      if (!reportsError) {
        setQuestionReports(reportsData || []);
      }

      // Load withdrawal requests
      const { data: withdrawalsData, error: withdrawalsError } = await supabase.rpc('get_pending_withdrawal_requests' as any);
      if (!withdrawalsError) {
        setWithdrawalRequests(withdrawalsData || []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'rejected') => {
    if (!user) return;

    setProcessing(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('resolve_question_report' as any, {
        report_id: reportId,
        admin_user_id: user.id,
        resolution: resolution,
        admin_notes: adminNotes.trim() || null
      });

      if (error) {
        console.error('Error resolving report:', error);
        setError('Failed to resolve report');
        return;
      }

      if (data) {
        setSelectedReport(null);
        setAdminNotes('');
        loadPendingRequests();
      } else {
        setError('Failed to resolve report');
      }
    } catch (error: any) {
      console.error('Error resolving report:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessWithdrawal = async (requestId: string, action: 'approved' | 'rejected') => {
    if (!user) return;

    setProcessing(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('process_withdrawal_request_with_message' as any, {
        request_id: requestId,
        admin_user_id: user.id,
        action: action,
        admin_notes: adminNotes.trim() || null
      });

      if (error) {
        console.error('Error processing withdrawal:', error);
        setError('Failed to process withdrawal request');
        return;
      }

      if (data) {
        setSelectedWithdrawal(null);
        setAdminNotes('');
        loadPendingRequests();
        // Show success message
        alert(`Withdrawal request ${action} successfully. User has been notified.`);
      } else {
        setError('Failed to process withdrawal request');
      }
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">Manage user requests and reports</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              Admin Access
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <Flag className="w-4 h-4" />
              <span>Question Reports ({questionReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
              <IndianRupee className="w-4 h-4" />
              <span>Withdrawal Requests ({withdrawalRequests.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Question Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {questionReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Reports</h3>
                  <p className="text-gray-600">All question reports have been resolved.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {questionReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{(report.issue_type || 'unknown').replace('_', ' ')}</Badge>
                            <Badge variant="secondary">{report.exam_id}</Badge>
                            <Badge variant="outline">{report.test_type || 'N/A'}</Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Question ID: {report.question_id}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>User:</strong> {report.user_phone || 'N/A'} | 
                            <strong> Test:</strong> {report.test_id || 'N/A'} | 
                            <strong> Date:</strong> {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          {report.issue_description && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              <strong>Description:</strong> {report.issue_description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Withdrawal Requests Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawalRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <IndianRupee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Withdrawals</h3>
                  <p className="text-gray-600">All withdrawal requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {withdrawalRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-green-100 text-green-800">
                              ₹{(request.amount || 0).toFixed(2)}
                            </Badge>
                            <Badge variant="outline">{request.payment_method?.replace('_', ' ') || 'Unknown Method'}</Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Withdrawal Request
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>User:</strong> {request.user_phone || 'Unknown'} | 
                            <strong> Date:</strong> {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            <strong>Payment Details:</strong>
                            <pre className="mt-1 text-xs">
                              {JSON.stringify(request.payment_details || {}, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWithdrawal(request)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Report Resolution Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Question Report</DialogTitle>
              <DialogDescription>
                Review and resolve the question report
              </DialogDescription>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Report Type</Label>
                    <p className="text-sm text-gray-600">{(selectedReport.issue_type || 'unknown').replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label>User</Label>
                    <p className="text-sm text-gray-600">{selectedReport.user_phone || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Question ID</Label>
                  <p className="text-sm text-gray-600">{selectedReport.question_id}</p>
                </div>
                
                {selectedReport.issue_description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedReport.issue_description}</p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about the resolution..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleResolveReport(selectedReport.id, 'rejected')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Resolve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Withdrawal Processing Dialog */}
        <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Process Withdrawal Request</DialogTitle>
              <DialogDescription>
                Review and process the withdrawal request
              </DialogDescription>
            </DialogHeader>
            
            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <p className="text-lg font-semibold text-green-600">₹{selectedWithdrawal.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>User</Label>
                    <p className="text-sm text-gray-600">{selectedWithdrawal.user_phone}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Payment Method</Label>
                  <p className="text-sm text-gray-600">{selectedWithdrawal.payment_method?.replace('_', ' ') || 'Unknown Method'}</p>
                </div>
                
                <div>
                  <Label>Payment Details</Label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <pre>{JSON.stringify(selectedWithdrawal.payment_details, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about the processing..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedWithdrawal(null)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleProcessWithdrawal(selectedWithdrawal.id, 'rejected')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleProcessWithdrawal(selectedWithdrawal.id, 'approved')}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;
