import React from 'react';
import { ReferralDashboard } from './ReferralDashboard';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReferralDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralDashboardModal: React.FC<ReferralDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Referral Dashboard</h2>
          <Button 
            onClick={onClose}
            variant="outline"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-0">
          <ReferralDashboard />
        </div>
      </div>
    </div>
  );
};
