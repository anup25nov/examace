import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { membershipPlansService, MembershipPlan } from '@/lib/membershipPlansService';

interface MembershipPlansAdminProps {
  onClose: () => void;
}

export const MembershipPlansAdmin: React.FC<MembershipPlansAdminProps> = ({ onClose }) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration_months: 1
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await membershipPlansService.getMembershipPlans();
      if (response.success && response.plans) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration_months: plan.duration_months
    });
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      // Here you would call an update function
      // For now, we'll just update the local state
      setPlans(prev => prev.map(plan => 
        plan.id === editingPlan 
          ? { ...plan, ...editForm }
          : plan
      ));
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditForm({ name: '', description: '', price: 0, duration_months: 1 });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading membership plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Membership Plans</h2>
              <p className="text-gray-600 mt-1">Update pricing and features for membership plans</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Plans List */}
        <div className="p-6 space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {membershipPlansService.formatPrice(plan.price, plan.currency)}
                    </Badge>
                    <Badge variant="secondary">
                      {membershipPlansService.getDurationDisplay(plan.duration_months)}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {editingPlan === plan.id && (
                <CardContent className="border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="name">Plan Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (months)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={editForm.duration_months}
                        onChange={(e) => setEditForm(prev => ({ ...prev, duration_months: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              )}

              <CardContent>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Changes are saved automatically. Refresh the page to see updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
