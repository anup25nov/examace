import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Gift,
  Users,
  IndianRupee,
  Copy,
  Check,
  Crown,
  Share2,
  QrCode,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { referralService, ReferralStats } from '@/lib/referralService';
import { supabase } from '@/integrations/supabase/client';
import WithdrawalRequestModal from '@/components/WithdrawalRequestModal';
import { 
  getCommissionPercentage, 
  getMinimumWithdrawal, 
  getMaximumWithdrawal,
  getWithdrawalProcessingDays 
} from '@/config/appConfig';

const ReferralPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralNetwork, setReferralNetwork] = useState<any[]>([]);
  const [comprehensiveStats, setComprehensiveStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReferralStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadReferralStats = async (isRefresh = false) => {
    if (!user) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // First, ensure user has a referral code
      await ensureReferralCodeExists();
      
      // Single comprehensive API call that includes all referral data
      const { data: statsData, error: statsError } = await supabase.rpc('get_comprehensive_referral_stats' as any, {
        user_uuid: user.id
      });
      
      if (statsError) {
        console.error('Error loading comprehensive stats:', statsError);
        // Fallback to old service only if comprehensive call fails
        try {
          const stats = await referralService.getReferralStats();
          setReferralStats(stats);
          setError(null);
        } catch (fallbackError) {
          console.error('Error loading fallback stats:', fallbackError);
          setError('Failed to load referral data. Please try again.');
        }
      } else if (statsData && Array.isArray(statsData) && statsData.length > 0) {
        const stats = statsData[0];
        setComprehensiveStats(stats);
        setError(null);
        
        // Extract network data from comprehensive stats if available
        if (stats.referral_network) {
          setReferralNetwork(Array.isArray(stats.referral_network) ? stats.referral_network : []);
        } else {
          // Only make separate network call if not included in comprehensive stats
          const { data: networkData, error: networkError } = await supabase.rpc('get_referral_network_detailed' as any, {
            user_uuid: user.id
          });
          
          if (!networkError) {
            setReferralNetwork(Array.isArray(networkData) ? networkData : []);
          }
        }
      } else {
        setError('No referral data found. Please try refreshing.');
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ensureReferralCodeExists = async () => {
    if (!user) return;
    
    try {
      // Check if referral code exists
      const { data: existingCode, error: checkError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking referral code:', checkError);
        return;
      }

      // If no referral code exists, create one
      if (!existingCode) {
        console.log('No referral code found, creating one...');
        const { data: createResult, error: createError } = await supabase
          .rpc('create_user_referral_code', {
            user_uuid: user.id,
            custom_code: null
          } as any);

        if (createError) {
          console.error('Error creating referral code:', createError);
        } else if (createResult && Array.isArray(createResult) && createResult.length > 0) {
          const result = createResult[0] as { success: boolean; referral_code: string };
          if (result.success) {
            console.log('Referral code created successfully:', result.referral_code);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring referral code exists:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          text: `Use my referral code ${referralCode} to get started with ExamAce! Earn money by referring friends!`,
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard(referralLink);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  const generateQRCode = () => {
    const referralCode = comprehensiveStats?.referral_code || referralStats?.referral_code;
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
    setQrCodeVisible(!qrCodeVisible);
    
    // In a real implementation, you would generate a QR code here
    // For now, we'll just show the link
    return referralLink;
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
          <div className="relative">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Referral Dashboard</h3>
          <p className="text-gray-600">Setting up your earning potential...</p>
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
                {/* <p className="text-gray-600">Earn {getCommissionPercentage()}% commission on every referral</p> */}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {showSuccessMessage && (
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Referral code created!</span>
                </div>
              )}
              
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => loadReferralStats(true)}
                disabled={refreshing}
                className="text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button> */}
              
              {/* <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
                <Gift className="w-4 h-4 mr-2" />
                {getCommissionPercentage()}% Commission
              </Badge> */}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error loading referral data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadReferralStats(true)}
              className="ml-auto text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Gift className="w-10 h-10 text-white" />
            </div>
            {/* <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div> */}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Earning Today!</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Share code with your friends and earn <span className="font-semibold text-green-600">{getCommissionPercentage()}% commission</span> on first purchase they make. 
            The more you refer, the more you earn!
          </p>
          
        </div>

        {(comprehensiveStats || referralStats) ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    {comprehensiveStats?.total_referrals || referralStats?.total_referrals || 0}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Total Referrals</div>
                  <div className="text-xs text-blue-600 mt-1">Active network</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">
                    ₹{comprehensiveStats?.total_commissions_earned || referralStats?.total_earnings || 0}
                  </div>
                  <div className="text-sm text-green-700 font-medium">Total Commissions</div>
                  <div className="text-xs text-green-600 mt-1">Lifetime earnings</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-orange-900 mb-1">
                    ₹{comprehensiveStats?.pending_commissions || referralStats?.pending_rewards || 0}
                  </div>
                  <div className="text-sm text-orange-700 font-medium">Pending Commissions</div>
                  <div className="text-xs text-orange-600 mt-1">Awaiting payout</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">
                    ₹{comprehensiveStats?.paid_commissions || referralStats?.rewarded_referrals || 0}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Paid Commissions</div>
                  <div className="text-xs text-purple-600 mt-1">Successfully paid</div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Code Section */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Gift className="w-8 h-8 mr-3" />
                    <h3 className="text-2xl font-bold">Your Referral Code</h3>
                  </div>
                  
                  <div className="bg-white/20 rounded-xl p-6 mb-6 backdrop-blur-sm">
                    <div className="text-4xl font-mono font-bold mb-2">
                      {comprehensiveStats?.referral_code || referralStats?.referral_code || 'N/A'}
                    </div>

                    <div className="text-sm opacity-90">💡 <strong>Pro Tip:</strong> Share your code on social media, WhatsApp, or email to maximize your earnings!</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                    <Button
                      onClick={() => copyToClipboard(`${window.location.origin}/auth?ref=${comprehensiveStats?.referral_code || referralStats?.referral_code}`)}
                      className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-6 py-3"
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    
                    <Button
                      onClick={shareReferralLink}
                      className="bg-white/20 text-white border-white hover:bg-white/30 font-semibold px-6 py-3"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    
                    {/* <Button
                      onClick={generateQRCode}
                      className="bg-white/20 text-white border-white hover:bg-white/30 font-semibold px-6 py-3"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </Button> */}
                  </div>
                  
                  {/* QR Code Display */}
                  {qrCodeVisible && (
                    <div className="mt-6 p-4 bg-white/10 rounded-lg">
                      <div className="text-sm mb-2">Scan this QR code to join with your referral:</div>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                          <QrCode className="w-16 h-16 text-gray-600" />
                        </div>
                      </div>
                      <div className="text-xs mt-2 opacity-75">
                        {window.location.origin}/auth?ref={comprehensiveStats?.referral_code || referralStats?.referral_code}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm opacity-90 mt-4">
                    {/* 💡 <strong>Pro Tip:</strong> Share your code on social media, WhatsApp, or email to maximize your earnings! */}
                    {/* 💡 <strong>Pro Tip3:</strong> Share your code on social media, WhatsApp, or email to maximize your earnings! */}
                  
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Request Section */}
            {referralStats && (Number(referralStats.pending_earnings || 0) >= getMinimumWithdrawal()) && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="w-6 h-6 text-green-600" />
                      <span>Withdraw Earnings</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Available ₹{Number(referralStats.pending_earnings).toFixed(2)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        You have ₹{Number(referralStats.pending_earnings).toFixed(2)} available for withdrawal (minimum: ₹{getMinimumWithdrawal()})
                      </p>
                      <p className="text-xs text-gray-500">
                        Withdrawal requests are processed within {getWithdrawalProcessingDays()} business days. Minimum withdrawal amount: ₹{getMinimumWithdrawal()}.
                      </p>
                    </div>
                    <WithdrawalRequestModal 
                      availableAmount={Number(referralStats.pending_earnings)}
                      onRequestSubmitted={loadReferralStats}
                    />
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Progress Tracking */}
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  <span>Your Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Referral Goal Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Referral Goal</span>
                      <span className="text-sm text-gray-600">
                        {comprehensiveStats?.total_referrals || referralStats?.total_referrals || 0} / 50
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(((comprehensiveStats?.total_referrals || referralStats?.total_referrals || 0) / 50) * 100, 100)} 
                      className="h-3"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {50 - (comprehensiveStats?.total_referrals || referralStats?.total_referrals || 0)} more referrals to reach your goal!
                    </div>
                  </div>
                  
                  {/* Earnings Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Monthly Earnings Target</span>
                      <span className="text-sm text-gray-600">
                        ₹{comprehensiveStats?.total_commissions_earned || referralStats?.total_earnings || 0} / ₹5000
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(((comprehensiveStats?.total_commissions_earned || referralStats?.total_earnings || 0) / 5000) * 100, 100)} 
                      className="h-3"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Keep referring to reach your monthly target!
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Referral Network */}
            {referralNetwork.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      <span>Your Referral Network</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {referralNetwork.length} {referralNetwork.length === 1 ? 'Referral' : 'Referrals'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referralNetwork.map((referral, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {referral.referred_phone_masked?.slice(-2) || 'XX'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">
                              {referral.referred_phone_masked}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>Joined: {new Date(referral.signup_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge 
                              className={
                                referral.commission_status === 'paid' ? 'bg-green-100 text-green-800' : 
                                referral.commission_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }
                            >
                              {referral.commission_status}
                            </Badge>
                            {referral.commission_amount > 0 && (
                              <div className="text-right">
                                <div className="font-bold text-green-600 text-lg">
                                  ₹{referral.commission_amount}
                                </div>
                                <div className="text-xs text-gray-500">Commission</div>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {referral.membership_plan !== 'none' ? (
                              <Badge className="bg-purple-100 text-purple-800">
                                {referral.membership_plan}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">No membership</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Commission Details */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <span>Commission Structure</span>
                </CardTitle>
                <p className="text-gray-600">Transparent and rewarding commission system</p>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-8 shadow-lg">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-yellow-600 mb-4">{getCommissionPercentage()}%</div>
                    <div className="text-2xl font-bold text-gray-900 mb-6">Commission Rate</div>
                    <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                      You earn <span className="font-bold text-yellow-600">{getCommissionPercentage()}%</span> of every purchase made by your referrals. 
                      The more people you refer, the more you earn!
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">₹{getMinimumWithdrawal()}</div>
                        <div className="text-sm text-gray-600">Minimum Withdrawal</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{getWithdrawalProcessingDays()}</div>
                        <div className="text-sm text-gray-600">Processing Days</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">Unlimited</div>
                        <div className="text-sm text-gray-600">Referral Limit</div>
                      </div>
                    </div>
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
              <Button onClick={() => loadReferralStats(true)} className="bg-blue-600 hover:bg-blue-700">
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
