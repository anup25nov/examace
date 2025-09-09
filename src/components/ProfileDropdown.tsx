import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Crown, 
  CreditCard, 
  LogOut, 
  ChevronDown,
  Flame,
  Star,
  Shield,
  Gift,
  Users,
  Edit3,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProfileUpdateModal } from './ProfileUpdateModal';
import { referralService } from '@/lib/referralService';

interface ProfileDropdownProps {
  onLogout: () => void;
  onMembershipClick: () => void;
  onReferralClick: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onLogout,
  onMembershipClick,
  onReferralClick
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    total_earnings: 0,
    referral_code: '',
    max_referrals: 20,
    commission_rate: 50.00,
    pending_rewards: 0,
    verified_referrals: 0,
    rewarded_referrals: 0
  });

  // Fetch referral stats - ALWAYS call hooks before any early returns
  useEffect(() => {
    const fetchReferralStats = async () => {
      try {
        const stats = await referralService.getReferralStats();
        setReferralStats(stats);
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }
    };

    if (isAuthenticated && user) {
      fetchReferralStats();
    }
  }, [isAuthenticated, user]);

  // Early return AFTER all hooks
  if (!isAuthenticated || !user) {
    return null;
  }

  const userEmail = profile?.email || localStorage.getItem("userEmail") || "User";
  const userName = (profile as any)?.name || localStorage.getItem("userName") || null;
  const membershipPlan = (profile as any)?.membership_plan || "free";
  const membershipExpiry = (profile as any)?.membership_expiry || null;

  const getMembershipBadge = () => {
    switch (membershipPlan) {
      case 'basic':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Basic Plan</Badge>;
      case 'premium':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Premium Plan</Badge>;
      case 'pro':
        return <Badge variant="secondary" className="bg-gold-100 text-gold-800">Pro Plan</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Free Plan</Badge>;
    }
  };

  const getMembershipIcon = () => {
    switch (membershipPlan) {
      case 'basic':
      case 'premium':
      case 'pro':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center space-x-2 p-2 ${isMobile ? 'w-full justify-start' : ''}`}
        >
          <div className="flex items-center space-x-2">
            {getMembershipIcon()}
            <div className={`text-left ${isMobile ? 'flex-1' : ''}`}>
              <p className="text-sm font-medium text-foreground">
                {isMobile ? 'Profile' : (userName || userEmail.split('@')[0])}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={`w-80 ${isMobile ? 'w-72 mr-2' : ''}`}
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* User Info Section */}
        <div className="px-3 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mx-2 mb-2">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {(userName || userEmail).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userName || userEmail.split('@')[0]}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {userEmail}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {getMembershipBadge()}
                {(profile as any)?.phone_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white/50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Referrals</p>
              <p className="text-sm font-bold text-gray-900">
                {referralStats.total_referrals || 0}
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Earnings</p>
              <p className="text-sm font-bold text-green-600">
                ₹{referralStats.total_earnings || 0}
              </p>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Profile Update Section */}
        <DropdownMenuItem 
          onClick={() => {
            setShowProfileUpdate(true);
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Update Profile</p>
            {/* <p className="text-xs text-muted-foreground">
              Complete your profile information
            </p> */}
          </div>
        </DropdownMenuItem>
        
        {/* Membership Section */}
        <DropdownMenuItem 
          onClick={() => {
            onMembershipClick();
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Crown className="w-4 h-4 text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Membership</p>
            {/* <p className="text-xs text-muted-foreground">
              {membershipPlan === 'free' ? 'Upgrade to unlock premium features' : 'Manage your plan'}
            </p> */}
          </div>
          {membershipPlan !== 'free' && (
            <Shield className="w-4 h-4 text-green-500" />
          )}
        </DropdownMenuItem>
        
        {/* Referral Section */}
           <DropdownMenuItem 
             onClick={() => {
               navigate('/referral');
               setIsOpen(false);
             }}
             className="flex items-center space-x-2 cursor-pointer"
           >
          <Gift className="w-4 h-4 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Referral Program</p>
            {/* <p className="text-xs text-muted-foreground">
              {referralStats.total_referrals} referrals • ₹{referralStats.total_earnings.toFixed(0)} earned
            </p> */}
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            {referralStats.referral_code || 'Get Code'}
          </Badge>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout Section */}
        <DropdownMenuItem 
          onClick={() => {
            onLogout();
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
    {/* Profile Update Modal */}
    <ProfileUpdateModal
      isOpen={showProfileUpdate}
      onClose={() => setShowProfileUpdate(false)}
      onSuccess={() => {
        // Refresh profile data
        window.location.reload();
      }}
    />
  </>
  );
};
