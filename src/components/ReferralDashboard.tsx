import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  Copy, 
  Share2,
  TrendingUp,
  Wallet,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  pending_commission: number;
  paid_commission: number;
  referral_code: string;
}

// Database response interface
interface ReferralStatsDB {
  total_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  referral_code: string;
}

interface CommissionHistory {
  commission_id: string;
  referred_user_id: string;
  referred_phone: string;
  membership_plan: string;
  membership_amount: number;
  commission_amount: number;
  commission_percentage: number;
  status: string;
  created_at: string;
}

export const ReferralDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load referral stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_referral_earnings' as any, { user_uuid: user.id });

      if (statsError) {
        console.error('Error loading referral stats:', statsError);
        toast.error('Failed to load referral stats');
      } else if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        const dbStats = statsData[0] as ReferralStatsDB;
        setStats({
          total_referrals: dbStats.total_referrals,
          total_earnings: dbStats.total_earnings,
          pending_commission: dbStats.pending_earnings,
          paid_commission: dbStats.paid_earnings,
          referral_code: dbStats.referral_code
        });
      }

      // Load commission history using the RPC function
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_user_commission_history' as any, { user_uuid: user.id });

      if (historyError) {
        console.error('Error loading commission history:', historyError);
        toast.error('Failed to load commission history');
      } else {
        setCommissionHistory(Array.isArray(historyData) ? historyData as unknown as CommissionHistory[] : []);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !stats || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > stats.pending_commission) {
      toast.error('Invalid withdrawal amount');
      return;
    }

    try {
      setWithdrawLoading(true);

      // Use the RPC function for withdrawal
      const { data, error } = await supabase
        .rpc('request_commission_withdrawal' as any, {
          p_user_id: user.id,
          p_amount: amount,
          p_payment_method: withdrawMethod
        });

      if (error) {
        console.error('Error requesting withdrawal:', error);
        toast.error('Failed to request withdrawal');
      } else if (data && Array.isArray(data) && data.length > 0) {
        const result = data[0] as any;
        if (result.success) {
          toast.success('Withdrawal request submitted successfully');
          setWithdrawAmount('');
          loadReferralData(); // Refresh data
        } else {
          toast.error(result.message || 'Failed to request withdrawal');
        }
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Failed to request withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_code);
      toast.success('Referral code copied to clipboard');
    }
  };

  const shareReferralCode = () => {
    if (stats?.referral_code) {
      const shareText = `Join me on ExamAce! Use my referral code: ${stats.referral_code}`;
      const shareUrl = `${window.location.origin}?ref=${stats.referral_code}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Join ExamAce with my referral code',
          text: shareText,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Referral link copied to clipboard');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      cancelled: { color: 'bg-red-100 text-red-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No referral data found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Referral Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={copyReferralCode} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Code
          </Button>
          <Button onClick={shareReferralCode} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_referrals}</div>
            <p className="text-xs text-muted-foreground">People you've referred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.total_earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.pending_commission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.paid_commission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Successfully withdrawn</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="referral-code">Share this code with friends</Label>
              <Input
                id="referral-code"
                value={stats.referral_code}
                readOnly
                className="font-mono text-lg"
              />
            </div>
            <Button onClick={copyReferralCode} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When someone uses your code to sign up and purchases a membership, you'll earn 50% commission!
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="withdraw" className="space-y-4">
        <TabsList>
          <TabsTrigger value="withdraw">Withdraw Earnings</TabsTrigger>
          <TabsTrigger value="history">Commission History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Request Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="withdraw-amount">Amount (₹)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    max={stats.pending_commission}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: ₹{stats.pending_commission.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="withdraw-method">Payment Method</Label>
                  <select
                    id="withdraw-method"
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="paytm">Paytm</option>
                  </select>
                </div>
              </div>
              <Button 
                onClick={handleWithdraw} 
                disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full"
              >
                {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Commission History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {commissionHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No commission history found</p>
              ) : (
                <div className="space-y-4">
                  {commissionHistory.map((commission) => (
                    <div key={commission.commission_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">+₹{commission.commission_amount.toFixed(2)}</span>
                          {getStatusBadge(commission.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          From {commission.referred_phone} - {commission.membership_plan} plan
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{commission.membership_amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{commission.commission_percentage}% commission</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
