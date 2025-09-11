import { supabase } from '@/integrations/supabase/client';

class AdminService {
  // Check if current user is admin
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await (supabase as any).rpc('is_user_admin', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in isCurrentUserAdmin:', error);
      return false;
    }
  }

  // Check if specific user is admin
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('is_user_admin', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in isUserAdmin:', error);
      return false;
    }
  }

  // Grant admin access to a user (admin only)
  async grantAdminAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('grant_admin_access', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error granting admin access:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in grantAdminAccess:', error);
      return false;
    }
  }

  // Revoke admin access from a user (admin only)
  async revokeAdminAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('revoke_admin_access', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error revoking admin access:', error);
        return false;
      }

      return Boolean(data);
    } catch (error) {
      console.error('Error in revokeAdminAccess:', error);
      return false;
    }
  }

  // Get all admin users
  async getAllAdmins(): Promise<{ id: string; email: string; name?: string }[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('id, email')
        .eq('is_admin', true);

      if (error) {
        console.error('Error getting admin users:', error);
        return [];
      }

      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }));
    } catch (error) {
      console.error('Error in getAllAdmins:', error);
      return [];
    }
  }
}

export const adminService = new AdminService();
