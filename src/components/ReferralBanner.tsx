import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Users, 
  IndianRupee, 
  TrendingUp,
  X,
  Copy,
  Check,
  Star,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { referralService } from '@/lib/referralServiceSimple';
import { referralBannerService } from '@/lib/referralBannerService';
import { defaultConfig } from '@/config/appConfig';

interface ReferralBannerProps {
  className?: string;
  variant?: 'banner' | 'card' | 'compact';
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({ 
  className = '', 
  variant = 'banner' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadReferralStats();
      // Check if banner should be shown based on dismissal history
      setIsVisible(referralBannerService.shouldShowBanner());
    }
  }, [isAuthenticated, user]);

  const loadReferralStats = async () => {
    if (!user) return;
    
    try {
      const stats = await referralService.getReferralStats(user.id);
      setReferralStats(stats);
    } catch (error) {
      console.error('Error loading referral stats:', error);
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

  const handleDismiss = () => {
    referralBannerService.dismissBanner();
    setIsVisible(false);
  };

  if (!isAuthenticated || !isVisible) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Earn 50% on referrals</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50"
            onClick={() => window.open('/referral', '_blank')}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Refer
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-green-200 shadow-lg ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Referral Program</h3>
                <p className="text-sm text-gray-600">Earn {defaultConfig.commission.percentage}% commission</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {referralStats && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{referralStats.totalReferrals}</div>
                <div className="text-xs text-gray-600">Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">₹{referralStats.totalEarnings}</div>
                <div className="text-xs text-gray-600">Earned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">₹{referralStats.pendingEarnings}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => copyToClipboard(referralStats?.referralLink || '')}
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
              onClick={() => window.open('/referral', '_blank')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default banner variant
  return (
    <div className={`bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">🎉 Referral Program Active!</h3>
            <p className="text-sm opacity-90">Earn {defaultConfig.commission.percentage}% commission on every referral. Share your code and start earning!</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {referralStats && (
            <div className="text-right">
              <div className="text-sm opacity-90">Your Code:</div>
              <div className="font-mono font-bold text-lg">{referralStats.referralCode}</div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => copyToClipboard(referralStats?.referralLink || '')}
            >
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              Copy
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => window.open('/referral', '_blank')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
