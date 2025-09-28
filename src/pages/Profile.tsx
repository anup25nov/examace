import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield,
  Calendar,
  CreditCard,
  Users,
  Trophy,
  Gift,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  Settings,
  BarChart3,
  Target,
  Award,
  TrendingUp,
  Loader2,
  BookOpen,
  Brain,
  Flame,
  Sparkles,
  Activity,
  PieChart,
  TrendingDown,
  Eye,
  Bookmark,
  MessageSquare,
  Download,
  Share2,
  Bell,
  Heart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { unifiedPaymentService } from '@/lib/unifiedPaymentService';
import { MembershipPlans } from '@/components/MembershipPlans';
import { PerfectModal } from '@/components/PerfectModal';
import { supabase } from '@/integrations/supabase/client';
import { messagingService } from '@/lib/messagingService';

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMembershipPlans, setShowMembershipPlans] = useState(false);
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    total_earnings: 0,
    referral_code: '',
    pending_earnings: 0
  });
  const [userStats, setUserStats] = useState({
    totalTests: 0,
    averageScore: 0,
    totalTimeSpent: 0
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  // Check if membership modal should be shown
  useEffect(() => {
    const showMembership = searchParams.get('show') === 'membership';
    if (showMembership) {
      setShowMembershipPlans(true);
      // Clean up URL
      navigate('/profile', { replace: true });
    }
  }, [searchParams, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load membership data
      const membershipData = await unifiedPaymentService.getUserMembership(user!.id);
      setMembership(membershipData);

      // Load user statistics from real data
      try {
        // Try to get real test data if available
        const { data: testData, error: testError } = await supabase
          .from('test_attempts')
          .select('*')
          .eq('user_id', user!.id);
        
        if (!testError && testData && testData.length > 0) {
          const totalTests = testData.length;
          const scores = testData.map(test => test.score || 0).filter(score => score > 0);
          const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
          const totalTimeSpent = testData.reduce((sum, test) => sum + (test.time_taken || 0), 0);
          
          setUserStats({
            totalTests,
            averageScore,
            totalTimeSpent: Math.round(totalTimeSpent / 60) // Convert to minutes
          });
        } else {
          // No test data available, keep defaults
          setUserStats({
            totalTests: 0,
            averageScore: 0,
            totalTimeSpent: 0
          });
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
        // Keep defaults on error
        setUserStats({
          totalTests: 0,
          averageScore: 0,
          totalTimeSpent: 0
        });
      }

      // Only load referral stats if user is on referral page or has referral data
      // This reduces unnecessary API calls for users who don't use referrals
      const hasReferralData = localStorage.getItem('hasReferralData') === 'true';
      if (hasReferralData) {
        try {
          const { data, error } = await supabase.rpc('get_user_referral_earnings' as any, {
            user_uuid: user!.id
          });
          if (!error && data && Array.isArray(data) && data.length > 0) {
            setReferralStats({
              total_referrals: 0, // This would need to be fetched separately
              total_earnings: (data[0] as any).total_earnings || 0,
              referral_code: '', // This would need to be fetched separately
              pending_earnings: (data[0] as any).pending_earnings || 0
            });
          }
        } catch (error) {
          console.error('Error loading referral stats:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      messagingService.handleError(error, 'Profile data loading');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Please Login First</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMembershipBadge = () => {
    if (!membership) {
      return <Badge variant="outline" className="text-muted-foreground">Free Plan</Badge>;
    }

    switch (membership.plan_id) {
      case 'pro':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pro Plan</Badge>;
      case 'pro_plus':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Pro+ Plan</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Free Plan</Badge>;
    }
  };

  const getMembershipIcon = () => {
    if (!membership) return <Star className="w-5 h-5 text-gray-500" />;
    
    switch (membership.plan_id) {
      case 'pro':
      case 'pro_plus':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const isMembershipActive = () => {
    if (!membership) return false;
    return membership.status === 'active' && new Date(membership.end_date) > new Date();
  };

  const getMembershipStatus = () => {
    if (!membership) return { text: 'No Active Membership', color: 'text-gray-500', icon: AlertCircle };
    
    if (isMembershipActive()) {
      return { text: 'Active', color: 'text-green-600', icon: CheckCircle };
    } else {
      return { text: 'Expired', color: 'text-red-500', icon: AlertCircle };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!membership || !isMembershipActive()) return 0;
    const endDate = new Date(membership.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysRemainingNumber = () => {
    return getDaysRemaining();
  };

  const shouldShowUpgrade = () => {
    return !membership || membership.plan_id === 'pro' || !isMembershipActive();
  };

  const getUpgradeMessage = () => {
    if (!membership) return 'Upgrade to Pro or Pro+ to unlock all features';
    if (membership.plan_id === 'pro') return 'Upgrade to Pro+ for unlimited access';
    if (!isMembershipActive()) return 'Your membership has expired. Renew to continue';
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header with Glassmorphism */}
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 hover:bg-white/50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(profile as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Profile
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hover:bg-white/50">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-white/50">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Profile Card */}
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
              <div className="relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <CardContent className="relative p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    {/* Profile Avatar */}
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-white/50">
                        <span className="text-white font-bold text-2xl">
                          {(profile as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-1">
                            {(profile as any)?.name || 'User'}
                          </h2>
                          <p className="text-gray-600 mb-2">{(profile as any)?.phone || 'No phone'}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Joined {formatDate((profile as any)?.created_at || new Date().toISOString())}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span className="text-green-600">Verified</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          {getMembershipBadge()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* User Statistics Grid - Only show if user has data */}
            {userStats.totalTests > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{userStats.totalTests}</div>
                    <div className="text-sm text-gray-600">Tests Taken</div>
                  </div>
                </Card>
                
                {userStats.averageScore > 0 && (
                  <Card className="text-center p-4 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-green-50 to-green-100/50">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.averageScore}%</div>
                      <div className="text-sm text-gray-600">Avg Score</div>
                    </div>
                  </Card>
                )}
                
                {userStats.totalTimeSpent > 0 && (
                  <Card className="text-center p-4 hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{userStats.totalTimeSpent}m</div>
                      <div className="text-sm text-gray-600">Time Spent</div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Enhanced Membership Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    {getMembershipIcon()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Membership Status</h3>
                    <p className="text-sm text-gray-600">Your current plan details</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/50">
                    <div className="flex items-center space-x-3">
                      {getMembershipBadge()}
                      <div className="text-sm text-gray-600">
                        {membership ? `₹${membership.amount}` : 'Free Plan'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {React.createElement(getMembershipStatus().icon, { className: `w-5 h-5 ${getMembershipStatus().color}` })}
                      <span className={`font-medium ${getMembershipStatus().color}`}>
                        {getMembershipStatus().text}
                      </span>
                    </div>
                  </div>

                  {membership && isMembershipActive() && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">Expires on {formatDate(membership.end_date)}</p>
                          <p className="text-xs text-green-600">Renew before expiration to continue benefits</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-800">{getDaysRemaining()}</div>
                          <div className="text-xs text-green-600">days left</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={(getDaysRemaining() / 30) * 100} className="h-2" />
                      </div>
                    </div>
                  )}

                  {shouldShowUpgrade() && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-900 mb-2">Upgrade Available</h4>
                          <p className="text-sm text-blue-700 mb-4">{getUpgradeMessage()}</p>
                          <Button 
                            onClick={() => setShowMembershipPlans(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Enhanced Referral Stats Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Referral Program</h3>
                    <p className="text-sm text-gray-600">Earn money by referring friends</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/60 rounded-xl border border-white/50">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{referralStats.total_referrals}</div>
                    <div className="text-sm text-gray-600">Total Referrals</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-xl border border-white/50">
                    <div className="text-3xl font-bold text-green-600 mb-1">₹{referralStats.total_earnings}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-xl border border-white/50 md:col-span-1 col-span-2">
                    <div className="text-3xl font-bold text-blue-600 mb-1">₹{referralStats.pending_earnings}</div>
                    <div className="text-sm text-gray-600">Pending Earnings</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/referral')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    View Referral Dashboard
                  </Button>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Earn 50% commission on every successful referral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowMembershipPlans(true)}
                  className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Crown className="w-4 h-4 mr-3" />
                  Manage Membership
                </Button>
                <Button 
                  onClick={() => navigate('/referral')}
                  className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Gift className="w-4 h-4 mr-3" />
                  Referral Program
                </Button>
                <Button 
                  onClick={() => navigate('/exam/ssc-cgl')}
                  className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Trophy className="w-4 h-4 mr-3" />
                  Take Mock Test
                </Button>
                <Button 
                  onClick={() => navigate('/study-materials')}
                  className="w-full justify-start bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  Study Materials
                </Button>
              </CardContent>
            </Card>

            {/* Study Progress - Only show if user has test data */}
            {userStats.totalTests > 0 && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Study Progress</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tests Completed</span>
                      <span className="font-semibold">{userStats.totalTests}</span>
                    </div>
                    <Progress value={Math.min((userStats.totalTests / 50) * 100, 100)} className="h-2" />
                  </div>
                  
                  {userStats.averageScore > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Average Score</span>
                        <span className="font-semibold">{userStats.averageScore}%</span>
                      </div>
                      <Progress value={userStats.averageScore} className="h-2" />
                    </div>
                  )}
                  
                  {userStats.totalTimeSpent > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Study Time</span>
                        <span className="font-semibold">{userStats.totalTimeSpent} min</span>
                      </div>
                      <Progress value={Math.min((userStats.totalTimeSpent / 1000) * 100, 100)} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plan Features */}
            {membership && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Your Plan Features</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {membership.plan_id === 'pro' ? (
                      <>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">11 Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">3 Months Access</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">Detailed Solutions</span>
                        </div>
                      </>
                    ) : membership.plan_id === 'pro_plus' ? (
                      <>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">Unlimited Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">12 Months Access</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">Priority Support</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium">Advanced Analytics</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                          <Check className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500">Limited Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                          <Check className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-500">Basic Features</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Membership Plans Modal */}
      <PerfectModal
        isOpen={showMembershipPlans}
        onClose={() => setShowMembershipPlans(false)}
        title="Choose Membership Plan"
        maxWidth="max-w-4xl"
      >
        <MembershipPlans
          onSelectPlan={(plan) => {
            console.log('Selected plan:', plan);
            setShowMembershipPlans(false);
          }}
          onClose={() => setShowMembershipPlans(false)}
          currentPlan={membership?.plan_id}
        />
      </PerfectModal>
    </div>
  );
};

export default Profile;
