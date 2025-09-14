export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      exam_stats: {
        Row: {
          average_score: number | null
          best_score: number | null
          created_at: string | null
          exam_id: string
          id: string
          last_test_date: string | null
          rank: number | null
          total_tests: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string | null
          exam_id: string
          id?: string
          last_test_date?: string | null
          rank?: number | null
          total_tests?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          best_score?: number | null
          created_at?: string | null
          exam_id?: string
          id?: string
          last_test_date?: string | null
          rank?: number | null
          total_tests?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      individual_test_scores: {
        Row: {
          completed_at: string | null
          created_at: string | null
          exam_id: string
          id: string
          rank: number | null
          score: number
          test_id: string
          test_type: string
          total_participants: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          exam_id: string
          id?: string
          rank?: number | null
          score: number
          test_id: string
          test_type: string
          total_participants?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          exam_id?: string
          id?: string
          rank?: number | null
          score?: number
          test_id?: string
          test_type?: string
          total_participants?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_test_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "individual_test_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_test_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string | null
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          mock_tests: number
          name: string
          original_price: number | null
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_days: number
          features?: Json | null
          id: string
          is_active?: boolean | null
          mock_tests: number
          name: string
          original_price?: number | null
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          mock_tests?: number
          name?: string
          original_price?: number | null
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      membership_transactions: {
        Row: {
          amount: number
          commission_paid: number | null
          created_at: string | null
          gateway_response: Json | null
          id: string
          membership_id: string | null
          referral_code_used: string | null
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          amount: number
          commission_paid?: number | null
          created_at?: string | null
          gateway_response?: Json | null
          id?: string
          membership_id?: string | null
          referral_code_used?: string | null
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          commission_paid?: number | null
          created_at?: string | null
          gateway_response?: Json | null
          id?: string
          membership_id?: string | null
          referral_code_used?: string | null
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_transactions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "membership_transactions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "user_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "membership_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_id: string
          payment_method: string
          plan_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_id: string
          payment_method: string
          plan_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_id?: string
          payment_method?: string
          plan_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_id: string | null
          referee_id: string | null
          referrer_id: string | null
          status: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          referee_id?: string | null
          referrer_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          referee_id?: string | null
          referrer_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_transactions_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_transactions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referral_transactions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_amount: number
          commission_percentage: number
          created_at: string | null
          id: string
          paid_at: string | null
          purchase_amount: number
          purchase_id: string
          referee_id: string | null
          referral_code: string
          referrer_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          commission_amount: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          purchase_amount: number
          purchase_id: string
          referee_id?: string | null
          referral_code: string
          referrer_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          purchase_amount?: number
          purchase_id?: string
          referee_id?: string | null
          referral_code?: string
          referrer_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          correct_answers: number
          exam_id: string
          id: string
          score: number
          time_taken: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers: number
          exam_id: string
          id?: string
          score: number
          time_taken?: number | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number
          exam_id?: string
          id?: string
          score?: number
          time_taken?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      test_completions: {
        Row: {
          answers: Json | null
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          exam_id: string
          id: string
          score: number
          test_id: string
          test_type: string
          time_taken: number | null
          topic_id: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers: number
          created_at?: string | null
          exam_id: string
          id?: string
          score: number
          test_id: string
          test_type: string
          time_taken?: number | null
          topic_id?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          exam_id?: string
          id?: string
          score?: number
          test_id?: string
          test_type?: string
          time_taken?: number | null
          topic_id?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "test_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          payment_id: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          payment_id?: string | null
          plan_id: string
          start_date: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          payment_id?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          membership_expiry: string | null
          membership_plan: string | null
          membership_status: string | null
          phone: string
          referral_code: string | null
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          membership_expiry?: string | null
          membership_plan?: string | null
          membership_status?: string | null
          phone: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          membership_expiry?: string | null
          membership_plan?: string | null
          membership_status?: string | null
          phone?: string
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          total_tests_taken: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_tests_taken?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_tests_taken?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_membership_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      exam_stats_with_defaults: {
        Row: {
          average_score: number | null
          best_score: number | null
          created_at: string | null
          exam_id: string | null
          id: string | null
          last_test_date: string | null
          rank: number | null
          total_tests: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_membership_summary: {
        Row: {
          days_remaining: number | null
          duration_days: number | null
          end_date: string | null
          is_active: boolean | null
          membership_expiry: string | null
          membership_id: string | null
          membership_plan: string | null
          membership_status: string | null
          membership_status_detail: string | null
          mock_tests: number | null
          phone: string | null
          plan_id: string | null
          plan_name: string | null
          plan_price: number | null
          start_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_referral_summary: {
        Row: {
          code_created_at: string | null
          phone: string | null
          paid_earnings: number | null
          pending_earnings: number | null
          referral_code: string | null
          total_earnings: number | null
          total_referrals: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_exam_ranks: {
        Args: { exam_name: string } | { exam_name: string }
        Returns: undefined
      }
      calculate_test_rank: {
        Args: {
          exam_name: string
          test_name: string
          test_type_name: string
          user_uuid: string
        }
        Returns: number
      }
      create_all_default_exam_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_default_exam_stats: {
        Args: { p_exam_id: string; p_user_id: string }
        Returns: undefined
      }
      create_user_referral_code: {
        Args: { user_uuid: string }
        Returns: string
      }
      expire_old_memberships: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_exam_stats: {
        Args: { exam_name: string; user_uuid: string }
        Returns: {
          average_score: number
          best_score: number
          exam_id: string
          id: string
          last_test_date: string
          rank: number
          total_tests: number
          user_id: string
        }[]
      }
      get_or_create_user_streak: {
        Args: { user_uuid: string }
        Returns: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string
          longest_streak: number
          total_tests_taken: number
          updated_at: string
          user_id: string
        }[]
      }
      get_referral_dashboard: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_referral_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          phone: string
          rank_position: number
          total_earnings: number
          total_referrals: number
          user_id: string
        }[]
      }
      get_user_membership: {
        Args: { user_uuid: string }
        Returns: {
          days_remaining: number
          end_date: string
          membership_id: string
          plan_id: string
          start_date: string
          status: string
        }[]
      }
      get_user_membership_status: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_referral_stats: {
        Args: { user_uuid: string }
        Returns: {
          paid_earnings: number
          pending_earnings: number
          referral_code: string
          total_earnings: number
          total_referrals: number
        }[]
      }
      get_user_test_score: {
        Args: {
          exam_name: string
          test_name: string
          test_type_name: string
          user_uuid: string
        }
        Returns: {
          rank: number
          score: number
          total_participants: number
        }[]
      }
      has_active_membership: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_mock_test_access: {
        Args: { required_tests: number; user_uuid: string }
        Returns: boolean
      }
      is_test_completed: {
        Args: {
          exam_name: string
          test_name: string
          test_type_name: string
          topic_name?: string
          user_uuid: string
        }
        Returns: boolean
      }
      is_test_completed_simple: {
        Args: {
          exam_name: string
          test_name: string
          test_type_name: string
          user_uuid: string
        }
        Returns: boolean
      }
      process_membership_purchase: {
        Args: {
          amount_param: number
          payment_id_param: string
          plan_id_param: string
          referral_code_used?: string
          user_uuid: string
        }
        Returns: Json
      }
      process_referral: {
        Args: {
          purchase_amount_param: number
          purchase_id_param: string
          referee_uuid: string
          referral_code_param: string
        }
        Returns: boolean
      }
      request_referral_payout: {
        Args: {
          amount_param: number
          payment_details_param: Json
          payment_method_param: string
          user_uuid: string
        }
        Returns: boolean
      }
      submitindividualtestscore: {
        Args: {
          exam_name: string
          score_value: number
          test_name: string
          test_type_name: string
          user_uuid: string
        }
        Returns: Json
      }
      update_daily_visit: {
        Args: { user_uuid: string }
        Returns: Json
      }
      update_exam_stats_mock_pyq_only: {
        Args: { exam_name: string }
        Returns: undefined
      }
      update_exam_stats_properly: {
        Args: { exam_name: string; new_score: number; user_uuid: string }
        Returns: Json
      }
      update_user_streak: {
        Args: { user_uuid: string }
        Returns: Json
      }
      upsert_test_completion: {
        Args: {
          p_answers?: Json
          p_correct_answers?: number
          p_exam_id: string
          p_score?: number
          p_test_id: string
          p_test_type: string
          p_time_taken?: number
          p_topic_id?: string
          p_total_questions?: number
          p_user_id: string
        }
        Returns: Json
      }
      upsert_test_completion_simple: {
        Args: {
          p_answers?: Json
          p_correct_answers?: number
          p_exam_id: string
          p_score?: number
          p_test_id: string
          p_test_type: string
          p_time_taken?: number
          p_topic_id?: string
          p_total_questions?: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
