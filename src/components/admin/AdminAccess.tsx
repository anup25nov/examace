import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaymentAdminPanel } from './PaymentAdminPanel';
import { MembershipPlansAdmin } from './MembershipPlansAdmin';
import { Settings, CreditCard, Users } from 'lucide-react';

interface AdminAccessProps {
  onClose: () => void;
}

export const AdminAccess: React.FC<AdminAccessProps> = ({ onClose }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePanel, setActivePanel] = useState<'main' | 'payments' | 'membership'>('main');

  // Simple admin authentication (in production, use proper authentication)
  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') { // Change this to a secure password
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdminLogin} className="flex-1">
                Login
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Default password: admin123 (change in production)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activePanel === 'payments') {
    return <PaymentAdminPanel onClose={() => setActivePanel('main')} />;
  }

  if (activePanel === 'membership') {
    return <MembershipPlansAdmin onClose={() => setActivePanel('main')} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Management */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActivePanel('payments')}>
              <CardContent className="p-6 text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">Payment Management</h3>
                <p className="text-gray-600 text-sm">
                  View, verify, and manage all payments. Handle disputes and manual verification.
                </p>
              </CardContent>
            </Card>

            {/* Membership Plans */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActivePanel('membership')}>
              <CardContent className="p-6 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold mb-2">Membership Plans</h3>
                <p className="text-gray-600 text-sm">
                  Manage membership plans, pricing, and features. Update plans dynamically.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <Button variant="outline" onClick={onClose}>
              Close Admin Panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
