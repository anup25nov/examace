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
import UserMessages from './UserMessages';
import { supabase } from '@/integrations/supabase/client';

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
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Fetch referral stats and admin status - ALWAYS call hooks before any early returns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await referralService.getReferralStats();
        setReferralStats(stats);
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      }

      // Check admin status
      if (user) {
        try {
          const { data, error } = await supabase.rpc('is_admin' as any, {
            user_uuid: user.id
          });
          if (!error) {
            setIsAdmin(data);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    };

    if (isAuthenticated && user) {
      fetchData();
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
      case 'pro_plus':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Pro+ Plan</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Free Plan</Badge>;
    }
  };

  const getMembershipIcon = () => {
    switch (membershipPlan) {
      case 'basic':
      case 'premium':
      case 'pro':
      case 'pro_plus':
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
          className={`flex items-center space-x-3 p-2 hover:bg-gray-50 transition-colors ${isMobile ? 'w-full justify-start' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(userName || userEmail).charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </div>
            <div className={`text-left ${isMobile ? 'flex-1' : ''}`}>
              <p className="text-sm font-semibold text-gray-900">
                {isMobile ? 'Profile' : (userName || userEmail.split('@')[0])}
              </p>
              {!isMobile && (
                <p className="text-xs text-gray-500">
                  {getMembershipBadge().props.children}
                </p>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className={`w-96 ${isMobile ? 'w-80 mr-2' : ''} shadow-xl border border-gray-200`}
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Professional User Info Section */}
        <div className="px-4 py-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-gray-200 rounded-xl mx-2 mb-3">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {(userName || userEmail).charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {userName || userEmail.split('@')[0]}
                </p>
                {isAdmin && (
                  <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate mb-2">
                {userEmail}
              </p>
              <div className="flex items-center space-x-2">
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
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-lg p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-600 font-medium">Referrals</p>
              <p className="text-lg font-bold text-gray-900">
                {referralStats.total_referrals || 0}
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-600 font-medium">Earnings</p>
              <p className="text-lg font-bold text-green-600">
                ₹{referralStats.total_earnings || 0}
              </p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-600 font-medium">Code</p>
              <p className="text-sm font-mono text-blue-600">
                {referralStats.referral_code?.slice(0, 6) || 'N/A'}
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
        
        {/* Admin Access Section */}
        {isAdmin && (
          <DropdownMenuItem 
            onClick={() => {
              navigate('/admin');
              setIsOpen(false);
            }}
            className="flex items-center space-x-2 cursor-pointer bg-red-50 hover:bg-red-100"
          >
            <Shield className="w-4 h-4 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Admin Panel</p>
              <p className="text-xs text-red-600">Manage reports & withdrawals</p>
            </div>
            <Badge className="bg-red-100 text-red-800 text-xs">
              Admin
            </Badge>
          </DropdownMenuItem>
        )}
        
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
          {/* <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            {referralStats.referral_code || 'Get Code'}
          </Badge> */}
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
