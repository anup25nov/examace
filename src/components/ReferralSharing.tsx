import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  TrendingUp,
  Link,
  QrCode,
  Gift,
  Star,
  Target
} from 'lucide-react';
import { referralService, ReferralStats } from '@/lib/referralService';
import { useAuth } from '@/hooks/useAuth';

interface ReferralSharingProps {
  onClose?: () => void;
}

export const ReferralSharing: React.FC<ReferralSharingProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    total_referrals: 0,
    total_earnings: 0,
    referral_code: '',
    max_referrals: 20,
    commission_rate: 50.00,
    pending_rewards: 0,
    verified_referrals: 0,
    rewarded_referrals: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);

  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/signup?ref=${referralStats.referral_code}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await referralService.getReferralStats();
        setReferralStats(stats);
        
        // Generate referral code if user doesn't have one
        if (!stats.referral_code) {
          setGeneratingCode(true);
          const newCode = await referralService.generateReferralCode();
          if (newCode) {
            setReferralStats(prev => ({ ...prev, referral_code: newCode }));
          }
          setGeneratingCode(false);
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareViaWebAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join S2S - Seedha Selection',
          text: 'Get ready for government job success with S2S! Use my referral code for exclusive benefits.',
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h2>
        <p className="text-gray-600">Earn rewards by referring friends to S2S</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralStats.total_referrals}</p>
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-xs text-gray-500">{referralStats.max_referrals - referralStats.total_referrals} remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">₹{referralStats.total_earnings}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-xs text-gray-500">{referralStats.commission_rate}% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Check className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralStats.verified_referrals}</p>
            <p className="text-sm text-gray-600">Verified</p>
            <p className="text-xs text-gray-500">Completed verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{referralStats.rewarded_referrals}</p>
            <p className="text-sm text-gray-600">Rewarded</p>
            <p className="text-xs text-gray-500">Earned rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Your Referral Code</span>
          </CardTitle>
          <CardDescription>
            Share this code or link with friends to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Referral Code</label>
            <div className="flex space-x-2">
              <Input
                value={referralStats.referral_code || (generatingCode ? 'Generating...' : '')}
                readOnly
                className="font-mono text-lg"
              />
              <Button
                onClick={() => copyToClipboard(referralStats.referral_code)}
                disabled={!referralStats.referral_code || generatingCode}
                variant="outline"
                size="sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Referral Link</label>
            <div className="flex space-x-2">
              <Input
                value={referralLink}
                readOnly
                className="text-sm"
              />
              <Button
                onClick={() => copyToClipboard(referralLink)}
                variant="outline"
                size="sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={shareViaWebAPI} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(referralStats.referral_code)}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>How It Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Code</h3>
              <p className="text-sm text-gray-600">Share your referral code or link with friends</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">They Sign Up</h3>
              <p className="text-sm text-gray-600">Friends use your code to create their account</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">You Earn Rewards</h3>
              <p className="text-sm text-gray-600">Get {referralStats.commission_rate}% commission on their first purchase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Reward Structure</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Phone Verification</p>
                  <p className="text-sm text-gray-600">When referred user verifies their phone</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ₹10
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">First Purchase</p>
                  <p className="text-sm text-gray-600">{referralStats.commission_rate}% of purchase amount</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {referralStats.commission_rate}%
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">Milestone Achievement</p>
                  <p className="text-sm text-gray-600">When referred user completes 10 tests</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                ₹25
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Terms & Conditions</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Maximum {referralStats.max_referrals} referrals per user</li>
            <li>• Rewards are credited only for first-time purchases</li>
            <li>• Self-referrals are not allowed</li>
            <li>• Referral code must be used during signup</li>
            <li>• Rewards are processed within 24 hours</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
