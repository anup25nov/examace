import React, { useState, useEffect } from 'react';
import { MembershipPlans } from './MembershipPlans';

export const GlobalMembershipModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShowMembershipModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('showMembershipModal', handleShowMembershipModal);
    
    return () => {
      window.removeEventListener('showMembershipModal', handleShowMembershipModal);
    };
  }, []);

  if (!isOpen) return null;
  return (
    <MembershipPlans
      onSelectPlan={(plan) => {
        console.log('Selected plan:', plan);
        setIsOpen(false);
      }}
      onClose={() => setIsOpen(false)}
      currentPlan={null} // Will be determined by the component
    />
  );
};
