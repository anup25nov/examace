import { toast } from 'sonner';
import { 
  getSuccessNotificationDuration, 
  getErrorNotificationDuration, 
  getWarningNotificationDuration, 
  getInfoNotificationDuration 
} from '@/config/appConfig';

export interface MessageConfig {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class MessagingService {
  private static instance: MessagingService;

  public static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Success messages
  success(message: string, config?: MessageConfig) {
    toast.success(message, {
      description: config?.description,
      duration: config?.duration || getSuccessNotificationDuration(),
      action: config?.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined
    });
  }

  // Error messages
  error(message: string, config?: MessageConfig) {
    toast.error(message, {
      description: config?.description,
      duration: config?.duration || getErrorNotificationDuration(),
      action: config?.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined
    });
  }

  // Warning messages
  warning(message: string, config?: MessageConfig) {
    toast.warning(message, {
      description: config?.description,
      duration: config?.duration || getWarningNotificationDuration(),
      action: config?.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined
    });
  }

  // Info messages
  info(message: string, config?: MessageConfig) {
    toast.info(message, {
      description: config?.description,
      duration: config?.duration || getInfoNotificationDuration(),
      action: config?.action ? {
        label: config.action.label,
        onClick: config.action.onClick
      } : undefined
    });
  }

  // Loading messages
  loading(message: string) {
    return toast.loading(message);
  }

  // Dismiss loading message
  dismiss(id: string | number) {
    toast.dismiss(id);
  }

  // Specific message templates for common actions
  membershipPurchased(planName: string) {
    this.success(`🎉 Welcome to ${planName}!`, {
      description: 'Your membership has been activated successfully. You can now access all premium features.',
      duration: 5000
    });
  }

  membershipUpgraded(fromPlan: string, toPlan: string) {
    this.success(`🚀 Upgraded to ${toPlan}!`, {
      description: `You've successfully upgraded from ${fromPlan} to ${toPlan}. Enjoy your new features!`,
      duration: 5000
    });
  }

  membershipExpired() {
    this.warning('⚠️ Membership Expired', {
      description: 'Your membership has expired. Renew to continue accessing premium features.',
      duration: 6000,
      action: {
        label: 'Renew Now',
        onClick: () => window.location.href = '/profile'
      }
    });
  }

  testCompleted(score: number, totalQuestions: number) {
    const percentage = Math.round((score / totalQuestions) * 100);
    this.success(`🎯 Test Completed!`, {
      description: `You scored ${score}/${totalQuestions} (${percentage}%). Great job!`,
      duration: 5000,
      action: {
        label: 'View Results',
        onClick: () => window.history.back()
      }
    });
  }

  testSubmitted() {
    this.success('✅ Test Submitted Successfully', {
      description: 'Your test has been submitted and is being processed.',
      duration: 4000
    });
  }

  withdrawalRequested(amount: number) {
    this.success('💰 Withdrawal Request Submitted', {
      description: `Your withdrawal request for ₹${amount} has been submitted and will be processed within 3 business days.`,
      duration: 5000
    });
  }

  withdrawalApproved(amount: number) {
    this.success('✅ Withdrawal Approved', {
      description: `Your withdrawal of ₹${amount} has been approved and will be processed shortly.`,
      duration: 5000
    });
  }

  withdrawalRejected(amount: number, reason?: string) {
    this.error('❌ Withdrawal Rejected', {
      description: `Your withdrawal of ₹${amount} was rejected. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
      duration: 6000,
      action: {
        label: 'Contact Support',
        onClick: () => window.location.href = '/contact'
      }
    });
  }

  referralCodeGenerated(code: string) {
    this.success('🎁 Referral Code Generated', {
      description: `Your referral code is: ${code}. Share it with friends to earn commissions!`,
      duration: 5000,
      action: {
        label: 'Share Now',
        onClick: () => {
          if (navigator.share) {
            navigator.share({
              title: 'Join Step2Sarkari',
              text: `Use my referral code ${code} to get started!`,
              url: `${window.location.origin}/auth?ref=${code}`
            });
          } else {
            navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${code}`);
            this.info('Referral link copied to clipboard!');
          }
        }
      }
    });
  }

  referralEarned(amount: number, referrerName?: string) {
    this.success('🎉 Referral Commission Earned!', {
      description: `You earned ₹${amount} from ${referrerName ? referrerName : 'a referral'}. Keep sharing to earn more!`,
      duration: 5000
    });
  }

  profileUpdated() {
    this.success('👤 Profile Updated', {
      description: 'Your profile has been updated successfully.',
      duration: 3000
    });
  }

  passwordChanged() {
    this.success('🔒 Password Changed', {
      description: 'Your password has been changed successfully.',
      duration: 3000
    });
  }

  phoneVerified() {
    this.success('📱 Phone Verified', {
      description: 'Your phone number has been verified successfully.',
      duration: 3000
    });
  }

  questionReported() {
    this.success('📝 Question Reported', {
      description: 'Thank you for reporting this question. Our team will review it shortly.',
      duration: 4000
    });
  }

  questionReportApproved() {
    this.success('✅ Report Approved', {
      description: 'Your question report has been approved and the question has been updated.',
      duration: 4000
    });
  }

  questionReportRejected() {
    this.warning('⚠️ Report Rejected', {
      description: 'Your question report was not approved. The question appears to be correct.',
      duration: 4000
    });
  }

  planLimitReached(planType: string, usedTests: number, maxTests: number) {
    this.warning('⚠️ Plan Limit Reached', {
      description: `You've used ${usedTests}/${maxTests} tests in your ${planType} plan. Upgrade to continue.`,
      duration: 6000,
      action: {
        label: 'Upgrade Now',
        onClick: () => window.location.href = '/profile'
      }
    });
  }

  paymentFailed(reason?: string) {
    this.error('💳 Payment Failed', {
      description: reason || 'Your payment could not be processed. Please try again or use a different payment method.',
      duration: 6000,
      action: {
        label: 'Try Again',
        onClick: () => window.location.reload()
      }
    });
  }

  paymentProcessing() {
    this.info('⏳ Processing Payment', {
      description: 'Your payment is being processed. Please wait...',
      duration: 3000
    });
  }

  networkError() {
    this.error('🌐 Network Error', {
      description: 'Please check your internet connection and try again.',
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    });
  }

  sessionExpired() {
    this.warning('⏰ Session Expired', {
      description: 'Your session has expired. Please log in again.',
      duration: 5000,
      action: {
        label: 'Login',
        onClick: () => window.location.href = '/auth'
      }
    });
  }

  // Generic error handler
  handleError(error: any, context?: string) {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    if (error?.message) {
      this.error(error.message);
    } else if (typeof error === 'string') {
      this.error(error);
    } else {
      this.error('An unexpected error occurred. Please try again.');
    }
  }

  // Generic success handler
  handleSuccess(message: string, context?: string) {
    console.log(`Success in ${context || 'unknown context'}:`, message);
    this.success(message);
  }
}

export const messagingService = MessagingService.getInstance();
