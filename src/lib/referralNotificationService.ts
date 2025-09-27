import { supabase } from '@/integrations/supabase/client';
import { databaseOTPService } from './databaseOTPService';

export interface ReferralNotification {
  id: string;
  userId: string;
  type: 'referral_signup' | 'referral_purchase' | 'commission_earned' | 'referral_milestone';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  type: ReferralNotification['type'];
  title: string;
  message: string;
  whatsappTemplate?: string;
}

export class ReferralNotificationService {
  private static instance: ReferralNotificationService;
  private templates: NotificationTemplate[] = [
    {
      type: 'referral_signup',
      title: '🎉 New Referral Signup!',
      message: 'Great news! {referredUserName} joined ExamAce using your referral code. You\'re one step closer to earning commission!',
      whatsappTemplate: 'referral_signup_template'
    },
    {
      type: 'referral_purchase',
      title: '💰 Referral Made a Purchase!',
      message: 'Excellent! {referredUserName} just purchased a {planName} membership. You\'ll earn {commissionAmount} commission!',
      whatsappTemplate: 'referral_purchase_template'
    },
    {
      type: 'commission_earned',
      title: '💵 Commission Earned!',
      message: 'Congratulations! You\'ve earned {commissionAmount} commission from {referredUserName}\'s purchase. Total earnings: {totalEarnings}',
      whatsappTemplate: 'commission_earned_template'
    },
    {
      type: 'referral_milestone',
      title: '🏆 Referral Milestone Achieved!',
      message: 'Amazing! You\'ve reached {milestone} referrals. Keep up the great work and earn more!',
      whatsappTemplate: 'referral_milestone_template'
    }
  ];

  public static getInstance(): ReferralNotificationService {
    if (!ReferralNotificationService.instance) {
      ReferralNotificationService.instance = new ReferralNotificationService();
    }
    return ReferralNotificationService.instance;
  }

  /**
   * Send referral signup notification
   */
  async sendReferralSignupNotification(
    referrerId: string,
    referredUserId: string,
    referredUserName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔔 Sending referral signup notification to: ${referrerId}`);

      // Get referrer's phone number
      const { data: referrerProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('phone, name')
        .eq('id', referrerId)
        .single();

      if (profileError || !referrerProfile) {
        return { success: false, error: 'Referrer profile not found' };
      }

      // Get referred user's name
      const { data: referredProfile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', referredUserId)
        .single();

      const displayName = referredProfile?.name || referredUserName || 'a new user';

      // Create notification
      const notification = await this.createNotification({
        userId: referrerId,
        type: 'referral_signup',
        title: '🎉 New Referral Signup!',
        message: `Great news! ${displayName} joined ExamAce using your referral code. You're one step closer to earning commission!`,
        data: {
          referredUserId,
          referredUserName: displayName
        }
      });

      if (!notification.success) {
        return notification;
      }

      // Send WhatsApp notification
      await this.sendWhatsAppNotification(
        referrerProfile.phone,
        'referral_signup',
        {
          referredUserName: displayName,
          referrerName: referrerProfile.name || 'there'
        }
      );

      console.log(`✅ Referral signup notification sent to: ${referrerId}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error sending referral signup notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send referral purchase notification
   */
  async sendReferralPurchaseNotification(
    referrerId: string,
    referredUserId: string,
    planName: string,
    commissionAmount: number,
    referredUserName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔔 Sending referral purchase notification to: ${referrerId}`);

      // Get referrer's phone number
      const { data: referrerProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('phone, name')
        .eq('id', referrerId)
        .single();

      if (profileError || !referrerProfile) {
        return { success: false, error: 'Referrer profile not found' };
      }

      // Get referred user's name
      const { data: referredProfile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', referredUserId)
        .single();

      const displayName = referredProfile?.name || referredUserName || 'your referral';

      // Create notification
      const notification = await this.createNotification({
        userId: referrerId,
        type: 'referral_purchase',
        title: '💰 Referral Made a Purchase!',
        message: `Excellent! ${displayName} just purchased a ${planName} membership. You'll earn ₹${commissionAmount} commission!`,
        data: {
          referredUserId,
          referredUserName: displayName,
          planName,
          commissionAmount
        }
      });

      if (!notification.success) {
        return notification;
      }

      // Send WhatsApp notification
      await this.sendWhatsAppNotification(
        referrerProfile.phone,
        'referral_purchase',
        {
          referredUserName: displayName,
          planName,
          commissionAmount: `₹${commissionAmount}`,
          referrerName: referrerProfile.name || 'there'
        }
      );

      console.log(`✅ Referral purchase notification sent to: ${referrerId}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error sending referral purchase notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send commission earned notification
   */
  async sendCommissionEarnedNotification(
    referrerId: string,
    commissionAmount: number,
    totalEarnings: number,
    referredUserName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔔 Sending commission earned notification to: ${referrerId}`);

      // Get referrer's phone number
      const { data: referrerProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('phone, name')
        .eq('id', referrerId)
        .single();

      if (profileError || !referrerProfile) {
        return { success: false, error: 'Referrer profile not found' };
      }

      // Create notification
      const notification = await this.createNotification({
        userId: referrerId,
        type: 'commission_earned',
        title: '💵 Commission Earned!',
        message: `Congratulations! You've earned ₹${commissionAmount} commission${referredUserName ? ` from ${referredUserName}'s purchase` : ''}. Total earnings: ₹${totalEarnings}`,
        data: {
          commissionAmount,
          totalEarnings,
          referredUserName
        }
      });

      if (!notification.success) {
        return notification;
      }

      // Send WhatsApp notification
      await this.sendWhatsAppNotification(
        referrerProfile.phone,
        'commission_earned',
        {
          commissionAmount: `₹${commissionAmount}`,
          totalEarnings: `₹${totalEarnings}`,
          referredUserName: referredUserName || 'your referral',
          referrerName: referrerProfile.name || 'there'
        }
      );

      console.log(`✅ Commission earned notification sent to: ${referrerId}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error sending commission earned notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send referral milestone notification
   */
  async sendReferralMilestoneNotification(
    referrerId: string,
    milestone: string,
    referralCount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔔 Sending referral milestone notification to: ${referrerId}`);

      // Get referrer's phone number
      const { data: referrerProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('phone, name')
        .eq('id', referrerId)
        .single();

      if (profileError || !referrerProfile) {
        return { success: false, error: 'Referrer profile not found' };
      }

      // Create notification
      const notification = await this.createNotification({
        userId: referrerId,
        type: 'referral_milestone',
        title: '🏆 Referral Milestone Achieved!',
        message: `Amazing! You've reached ${milestone} referrals (${referralCount} total). Keep up the great work and earn more!`,
        data: {
          milestone,
          referralCount
        }
      });

      if (!notification.success) {
        return notification;
      }

      // Send WhatsApp notification
      await this.sendWhatsAppNotification(
        referrerProfile.phone,
        'referral_milestone',
        {
          milestone,
          referralCount: referralCount.toString(),
          referrerName: referrerProfile.name || 'there'
        }
      );

      console.log(`✅ Referral milestone notification sent to: ${referrerId}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error sending referral milestone notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<{ data: ReferralNotification[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('referral_notifications' as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: 'Failed to fetch notifications' };
      }

      return { data: (data as any) || [], error: null };

    } catch (error: any) {
      console.error('Error fetching user notifications:', error);
      return { data: [], error: 'Internal server error' };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('referral_notifications' as any)
        .update({ is_read: true } as any)
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: 'Failed to mark notification as read' };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('referral_notifications' as any)
        .update({ is_read: true } as any)
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: 'Failed to mark notifications as read' };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // Private helper methods

  private async createNotification(notification: {
    userId: string;
    type: ReferralNotification['type'];
    title: string;
    message: string;
    data?: any;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('referral_notifications' as any)
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: 'Failed to create notification' };
      }

      return { success: true };

    } catch (error: any) {
      console.error('Error creating notification:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  private async sendWhatsAppNotification(
    phone: string,
    templateType: string,
    variables: Record<string, string>
  ): Promise<void> {
    try {
      // Format phone number for WhatsApp
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '91' + formattedPhone;
      } else if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }

      // Get template
      const template = this.templates.find(t => t.whatsappTemplate === `${templateType}_template`);
      if (!template) {
        console.log(`No WhatsApp template found for: ${templateType}`);
        return;
      }

      // Replace variables in message
      let message = template.message;
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      // Send via databaseOTPService (reusing the WhatsApp infrastructure)
      const result = await databaseOTPService.sendOTP(formattedPhone);
      
      if (result.success) {
        console.log(`✅ WhatsApp notification sent to: ${formattedPhone}`);
      } else {
        console.error(`❌ Failed to send WhatsApp notification to: ${formattedPhone}`, result.error);
      }

    } catch (error: any) {
      console.error('Error sending WhatsApp notification:', error);
    }
  }
}

export const referralNotificationService = ReferralNotificationService.getInstance();
