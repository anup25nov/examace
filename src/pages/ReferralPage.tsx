import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Star,
  Crown,
  Share2,
  ExternalLink,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { referralService, ReferralStats } from '@/lib/referralService';
import { supabase } from '@/integrations/supabase/client';
import WithdrawalRequestModal from '@/components/WithdrawalRequestModal';

const ReferralPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralNetwork, setReferralNetwork] = useState<any[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReferralStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadReferralStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load comprehensive stats using the new database function
      const { data: statsData, error: statsError } = await supabase.rpc('get_comprehensive_referral_stats' as any, {
        user_uuid: user.id
      });
      
      if (statsError) {
        console.error('Error loading comprehensive stats:', statsError);
      } else if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        setComprehensiveStats(statsData[0]);
      }
      
      // Load detailed referral network
      const { data: networkData, error: networkError } = await supabase.rpc('get_referral_network_detailed' as any, {
        user_uuid: user.id
      });
      
      if (networkError) {
        console.error('Error loading referral network:', networkError);
      } else {
        setReferralNetwork(Array.isArray(networkData) ? networkData : []);
      }
      
      // Fallback to old service if needed
      try {
        const stats = await referralService.getReferralStats();
        setReferralStats(stats);
      } catch (error) {
        console.error('Error loading fallback stats:', error);
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareReferralLink = async () => {
    const referralCode = comprehensiveStats?.referral_code || referralStats?.referral_code;
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ExamAce - Exam Preparation Platform',
          text: `Use my referral code ${referralCode} to get started with ExamAce!`,
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access the referral program.</p>
          <Button onClick={() => navigate('/auth')} className="bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral information...</p>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
                {/* <p className="text-gray-600">Earn 50% commission on every referral</p> */}
              </div>
            </div>
            
            {/* <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              50% Commission
            </Badge> */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Earning Today!</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share ExamAce with your friends and earn 50% commission on every purchase they make. 
            The more you refer, the more you earn!
          </p>
        </div>

        {(comprehensiveStats || referralStats) ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-blue-900">
                    {comprehensiveStats?.total_referrals || referralStats?.total_referrals || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Referrals</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-green-900">
                    ₹{comprehensiveStats?.total_commissions_earned || referralStats?.total_earnings || 0}
                  </div>
                  <div className="text-sm text-green-700">Total Commissions</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-orange-900">
                    ₹{comprehensiveStats?.pending_commissions || referralStats?.pending_rewards || 0}
                  </div>
                  <div className="text-sm text-orange-700">Pending Commissions</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-purple-900">
                    ₹{comprehensiveStats?.paid_commissions || referralStats?.rewarded_referrals || 0}
                  </div>
                  <div className="text-sm text-purple-700">Paid Commissions</div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Code Section */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Your Referral Code</h3>
                  <div className="bg-white/20 rounded-lg p-4 mb-6">
                    <div className="text-3xl font-mono font-bold">
                      {comprehensiveStats?.referral_code || referralStats?.referral_code || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => copyToClipboard(`${window.location.origin}/auth?ref=${comprehensiveStats?.referral_code || referralStats?.referral_code}`)}
                      className="bg-white text-green-600 hover:bg-gray-100"
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    
                    <Button
                      onClick={shareReferralLink}
                      className="bg-white/20 text-white border-white hover:bg-white/30"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Request Section */}
            {comprehensiveStats && (Number(comprehensiveStats.pending_commissions || 0) > 70) && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <span>Withdraw Earnings</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Pending ₹{Number(comprehensiveStats.pending_commissions).toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        You have ₹{Number(comprehensiveStats.pending_commissions).toFixed(2)} pending commissions eligible for withdrawal (threshold: ₹70)
                      </p>
                      <p className="text-xs text-gray-500">
                        Withdrawal requests are processed within 2-3 business days. Minimum pending amount required: ₹70.
                      </p>
                    </div>
                    <WithdrawalRequestModal 
                      availableAmount={Number(comprehensiveStats.pending_commissions)}
                      onRequestSubmitted={loadReferralStats}
                    />
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Disclaimer */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 text-sm text-amber-800">
                Note: Withdrawals are enabled when your pending commissions exceed ₹70. Commissions move from pending to paid after admin review and payout.
              </CardContent>
            </Card>

            {/* Detailed Referral Network */}
            {referralNetwork.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    <span>Your Referral Network</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referralNetwork.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {referral.referred_phone_masked?.slice(-2) || 'XX'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {referral.referred_phone_masked}
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined: {new Date(referral.signup_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={referral.commission_status === 'paid' ? 'default' : 
                                      referral.commission_status === 'pending' ? 'secondary' : 'destructive'}
                            >
                              {referral.commission_status}
                            </Badge>
                            {referral.commission_amount > 0 && (
                              <span className="font-semibold text-green-600">
                                ₹{referral.commission_amount}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.membership_plan !== 'none' ? referral.membership_plan : 'No membership'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  <span>How It Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-blue-600">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Share Your Code</h4>
                    <p className="text-sm text-gray-600">Share your referral code with friends and family</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-green-600">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">They Sign Up</h4>
                    <p className="text-sm text-gray-600">Your referrals sign up using your code</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-purple-600">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">You Earn</h4>
                    <p className="text-sm text-gray-600">Earn 50% commission on their purchases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Commission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <span>Commission Structure</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">50%</div>
                    <div className="text-lg font-semibold text-gray-900 mb-4">Commission Rate</div>
                    <p className="text-gray-600">
                      You earn 50% of every purchase made by your referrals. 
                      The more people you refer, the more you earn!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Referral Code Found</h3>
              <p className="text-gray-600 mb-4">We couldn't find your referral code. Please try refreshing the page.</p>
              <Button onClick={loadReferralStats} className="bg-blue-600 hover:bg-blue-700">
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReferralPage;
