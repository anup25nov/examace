import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  TrendingUp,
  Star,
  X,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { referralService, ReferralStats } from '@/lib/referralServiceSimple';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReferralSystemProps {
  onClose: () => void;
}

export const ReferralSystem: React.FC<ReferralSystemProps> = ({ onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReferralStats();
    }
  }, [isAuthenticated, user]);

  const loadReferralStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const stats = await referralService.getReferralStats(user.id);
      setReferralStats(stats);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setIsLoading(false);
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
    if (!referralStats) return;

    const shareText = `Join ExamAce and get premium exam preparation! Use my referral code: ${referralStats.referralCode}\n\n${referralStats.referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ExamAce',
          text: shareText,
          url: referralStats.referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading referral system...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isMobile ? 'mx-2' : ''}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Referral Program</h2>
                <p className="text-gray-600 text-sm">Earn 50% commission on every referral!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {referralStats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
                    <p className="text-sm text-gray-600">Total Referrals</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">₹{referralStats.totalEarnings}</p>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">₹{referralStats.pendingEarnings}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="p-4">
                    <Check className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">₹{referralStats.paidEarnings}</p>
                    <p className="text-sm text-gray-600">Paid Out</p>
                  </CardContent>
                </Card>
              </div>

              {/* Referral Code Section */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span>Your Referral Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      value={referralStats.referralCode}
                      readOnly
                      className="font-mono text-lg font-bold text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralStats.referralCode)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Input
                      value={referralStats.referralLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(referralStats.referralLink)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={shareReferralLink}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowLeaderboard(!showLeaderboard)}
                      className="flex-1"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Leaderboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-blue-600 font-bold">1</span>
                      </div>
                      <h4 className="font-semibold mb-2">Share Your Code</h4>
                      <p className="text-sm text-gray-600">Share your referral code with friends</p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-green-600 font-bold">2</span>
                      </div>
                      <h4 className="font-semibold mb-2">They Purchase</h4>
                      <p className="text-sm text-gray-600">Your friend buys a membership plan</p>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-purple-600 font-bold">3</span>
                      </div>
                      <h4 className="font-semibold mb-2">You Earn 50%</h4>
                      <p className="text-sm text-gray-600">Get 50% of their purchase as commission</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Rates */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Commission Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Basic Plan (₹30)</span>
                      <Badge className="bg-green-100 text-green-800">₹15</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Premium Plan (₹49)</span>
                      <Badge className="bg-green-100 text-green-800">₹24.50</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Pro Plan (₹99)</span>
                      <Badge className="bg-green-100 text-green-800">₹49.50</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referral Code Found</h3>
              <p className="text-gray-600 mb-4">Generate your referral code to start earning!</p>
              <Button onClick={loadReferralStats} className="bg-blue-600 hover:bg-blue-700">
                Generate Referral Code
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
          <div className="text-center text-sm text-gray-600">
            <p>Minimum payout: ₹100 | Payments processed weekly</p>
            <p className="mt-1">Contact support for payout requests</p>
          </div>
        </div>
      </div>
    </div>
  );
};
