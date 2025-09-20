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
  IndianRupee,
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

  const userPhone = (profile as any)?.phone || localStorage.getItem("userPhone") || null;
  const userName = (profile as any)?.name || localStorage.getItem("userName") || null;
  const membershipPlan = (profile as any)?.membership_plan || "free";
  const membershipExpiry = (profile as any)?.membership_expiry || null;
  
  // Format display name - prioritize phone, then name, then fallback
  const getDisplayName = () => {
    if (userPhone) {
      // Remove +91 if it exists
      const cleanPhone = userPhone.replace(/^\+91/, "");
      return `Hi, ${cleanPhone}`;
    }
    if (userName) return userName;
    return "User";
  };
  
  const displayName = getDisplayName();

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
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>
              <div className={`text-left ${isMobile ? 'flex-1' : ''}`}>
                <p className="text-sm font-semibold text-gray-900">
                  {isMobile ? 'Profile' : displayName}
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
        className={`w-72 ${isMobile ? 'w-64 mr-2' : ''} shadow-lg border border-gray-200 rounded-xl`}
      >
        {/* Compact Header */}
        <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getMembershipBadge()}
                {(profile as any)?.phone_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                    ✓
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Stats */}
        <div className="p-3 bg-gray-50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-gray-900">{referralStats.total_referrals || 0}</div>
              <div className="text-xs text-gray-600">Referrals</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-600">₹{referralStats.total_earnings || 0}</div>
              <div className="text-xs text-gray-600">Earnings</div>
            </div>
            <div>
              <div className="text-xs font-mono text-blue-600">{referralStats.referral_code?.slice(0, 6) || 'N/A'}</div>
              <div className="text-xs text-gray-600">Code</div>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="p-2 space-y-1">
          {isAdmin && (
            <DropdownMenuItem 
              onClick={() => {
                navigate('/admin');
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 cursor-pointer hover:bg-red-50 p-2 rounded-lg"
            >
              <div className="p-1 bg-red-100 rounded">
                <Shield className="w-3 h-3 text-red-600" />
              </div>
              <span className="text-sm text-red-800">Admin Panel</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded-lg"
          >
            <div className="p-1 bg-yellow-100 rounded">
              <Crown className="w-3 h-3 text-yellow-600" />
            </div>
            <span className="text-sm">Profile & Membership</span>
            {membershipPlan !== 'free' && (
              <Shield className="w-3 h-3 text-green-500 ml-auto" />
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              navigate('/referral');
              setIsOpen(false);
            }}
            className="flex items-center space-x-2 cursor-pointer hover:bg-green-50 p-2 rounded-lg"
          >
            <div className="p-1 bg-green-100 rounded">
              <Gift className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm">Referral Program</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2 cursor-pointer hover:bg-red-50 text-red-600 p-2 rounded-lg mt-2 border-t border-gray-200"
          >
            <div className="p-1 bg-red-100 rounded">
              <LogOut className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-sm font-medium">Logout</span>
          </DropdownMenuItem>
        </div>
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
