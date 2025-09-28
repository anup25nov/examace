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
  Loader2
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
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {(profile as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{(profile as any)?.name || 'User'}</h2>
                    <p className="text-sm text-gray-600">{(profile as any)?.phone || 'No phone'}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Phone Verified</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Joined {formatDate((profile as any)?.created_at || new Date().toISOString())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getMembershipIcon()}
                  <span>Membership Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getMembershipBadge()}
                      {/* <span className="text-sm text-gray-600">
                        {membership ? `₹${membership.amount}` : 'Free'}
                      </span> */}
                    </div>
                    <div className="flex items-center space-x-1">
                      {React.createElement(getMembershipStatus().icon, { className: `w-4 h-4 ${getMembershipStatus().color}` })}
                      <span className={`text-sm ${getMembershipStatus().color}`}>
                        {getMembershipStatus().text}
                      </span>
                    </div>
                  </div>

                  {membership && isMembershipActive() && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-800">
                          Expires on {formatDate(membership.end_date)}
                        </span>
                        <span className="text-sm font-medium text-green-800">
                          {getDaysRemaining()} days left
                        </span>
                      </div>
                    </div>
                  )}

                  {shouldShowUpgrade() && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-1">Upgrade Available</h4>
                          <p className="text-sm text-blue-700 mb-3">{getUpgradeMessage()}</p>
                          <Button 
                            onClick={() => setShowMembershipPlans(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
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

            {/* Referral Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-green-500" />
                  <span>Referral Program</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{referralStats.total_referrals}</div>
                    <div className="text-sm text-gray-600">Referrals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{referralStats.total_earnings}</div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">₹{referralStats.pending_earnings}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  {/* <div className="text-center">
                    <div className="text-sm font-mono text-purple-600">{referralStats.referral_code || 'N/A'}</div>
                    <div className="text-sm text-gray-600">Referral Code</div>
                  </div> */}
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => navigate('/referral')}
                    variant="outline"
                    className="w-full"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    View Referral Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowMembershipPlans(true)}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Manage Membership
                </Button>
                <Button 
                  onClick={() => navigate('/referral')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Referral Program
                </Button>
                <Button 
                  onClick={() => navigate('/exam/ssc-cgl')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Take Mock Test
                </Button>
              </CardContent>
            </Card>

            {/* Plan Features */}
            {membership && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Plan Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {membership.plan_id === 'pro' ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">11 Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">3 Months Access</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Detailed Solutions</span>
                        </div>
                      </>
                    ) : membership.plan_id === 'pro_plus' ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Unlimited Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">12 Months Access</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Priority Support</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">Advanced Analytics</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Limited Mock Tests</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-gray-400" />
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
