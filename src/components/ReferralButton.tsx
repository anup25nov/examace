import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReferralDashboardModal } from './ReferralDashboardModal';
import { Users } from 'lucide-react';

export const ReferralButton: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowDashboard(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Users className="w-4 h-4" />
        My Referrals
      </Button>
      
      <ReferralDashboardModal 
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
};
