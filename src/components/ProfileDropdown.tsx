import React, { useState } from 'react';
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
  Phone, 
  Settings, 
  LogOut, 
  ChevronDown,
  Flame,
  Star,
  Shield,
  Gift,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileDropdownProps {
  onLogout: () => void;
  onMembershipClick: () => void;
  onPhoneUpdate: () => void;
  onSettingsClick: () => void;
  onReferralClick: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onLogout,
  onMembershipClick,
  onPhoneUpdate,
  onSettingsClick,
  onReferralClick
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const userEmail = profile?.email || localStorage.getItem("userEmail") || "User";
  const userPhone = (profile as any)?.phone || localStorage.getItem("userPhone") || null;
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
                {isMobile ? 'Profile' : userEmail.split('@')[0]}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={isMobile ? "start" : "end"} 
        className={`w-80 ${isMobile ? 'w-full' : ''}`}
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* User Info Section */}
        <div className="px-2 py-2">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userEmail}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {getMembershipBadge()}
              </div>
            </div>
          </div>
          
        </div>
        
        <DropdownMenuSeparator />
        
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
            <p className="text-xs text-muted-foreground">
              {membershipPlan === 'free' ? 'Upgrade to unlock premium features' : 'Manage your plan'}
            </p>
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
            <p className="text-xs text-muted-foreground">
              Earn 50% commission on referrals
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            Earn
          </Badge>
        </DropdownMenuItem>
        
        {/* Phone Number Section */}
        <DropdownMenuItem 
          onClick={() => {
            onPhoneUpdate();
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Phone className="w-4 h-4" />
          <div className="flex-1">
            <p className="text-sm font-medium">Phone Number</p>
            <p className="text-xs text-muted-foreground">
              {userPhone ? `+91 ${userPhone}` : 'Add phone number'}
            </p>
          </div>
        </DropdownMenuItem>
        
        {/* Settings Section */}
        <DropdownMenuItem 
          onClick={() => {
            onSettingsClick();
            setIsOpen(false);
          }}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
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
  );
};
