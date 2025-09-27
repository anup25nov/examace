// Database type definitions for new tables
export interface TestShare {
  id: string;
  test_id: string;
  exam_id: string;
  section_id: string;
  test_type: string;
  test_name: string;
  is_premium: boolean;
  share_code: string;
  share_url?: string;
  expires_at: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestShareAccess {
  id: string;
  share_code: string;
  user_id?: string;
  ip_address?: string;
  accessed_at: string;
}

export interface PaymentFailure {
  id: string;
  user_id: string;
  order_id: string;
  failure_reason: string;
  retry_count: number;
  max_retries: number;
  last_retry_at?: string;
  status: 'pending' | 'retrying' | 'failed' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface RefundRequest {
  id: string;
  user_id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  reason: string;
  type: 'user_requested' | 'payment_failed' | 'duplicate_payment' | 'service_unavailable' | 'fraud_detected';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  processed_at?: string;
  refund_id?: string;
  admin_notes?: string;
  created_by: 'user' | 'admin' | 'system';
  created_at: string;
  updated_at: string;
}

export interface ReferralNotification {
  id: string;
  user_id: string;
  type: 'referral_signup' | 'referral_purchase' | 'commission_earned' | 'referral_milestone';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

// Extended Supabase types
export interface Database {
  public: {
    Tables: {
      test_shares: {
        Row: TestShare;
        Insert: Omit<TestShare, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TestShare, 'id' | 'created_at' | 'updated_at'>>;
      };
      test_share_access: {
        Row: TestShareAccess;
        Insert: Omit<TestShareAccess, 'id'>;
        Update: Partial<Omit<TestShareAccess, 'id'>>;
      };
      payment_failures: {
        Row: PaymentFailure;
        Insert: Omit<PaymentFailure, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentFailure, 'id' | 'created_at' | 'updated_at'>>;
      };
      refund_requests: {
        Row: RefundRequest;
        Insert: Omit<RefundRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RefundRequest, 'id' | 'created_at' | 'updated_at'>>;
      };
      referral_notifications: {
        Row: ReferralNotification;
        Insert: Omit<ReferralNotification, 'id'>;
        Update: Partial<Omit<ReferralNotification, 'id'>>;
      };
    };
  };
}
