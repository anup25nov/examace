// Generated TypeScript types for Supabase
// This file contains type definitions for the production database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          phone: string
          membership_status: string
          membership_plan: string
          membership_expiry: string | null
          referral_code: string | null
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone: string
          membership_status?: string
          membership_plan?: string
          membership_expiry?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          membership_status?: string
          membership_plan?: string
          membership_expiry?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_memberships: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          start_date: string
          end_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          start_date: string
          end_date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          start_date?: string
          end_date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          payment_id: string
          user_id: string
          plan_id: string
          plan_name: string | null
          amount: number
          currency: string
          payment_method: string | null
          status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          user_id: string
          plan_id: string
          plan_name?: string | null
          amount: number
          currency?: string
          payment_method?: string | null
          status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          user_id?: string
          plan_id?: string
          plan_name?: string | null
          amount?: number
          currency?: string
          payment_method?: string | null
          status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_attempts: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          test_type: string
          test_id: string
          score: number
          total_questions: number
          correct_answers: number
          time_taken: number
          time_spent: number
          status: string
          started_at: string
          completed_at: string | null
          answers: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          test_type: string
          test_id: string
          score?: number
          total_questions: number
          correct_answers?: number
          time_taken?: number
          time_spent?: number
          status?: string
          started_at?: string
          completed_at?: string | null
          answers?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          test_type?: string
          test_id?: string
          score?: number
          total_questions?: number
          correct_answers?: number
          time_taken?: number
          time_spent?: number
          status?: string
          started_at?: string
          completed_at?: string | null
          answers?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_states: {
        Row: {
          id: string
          user_id: string
          exam_id: string
          section_id: string | null
          test_type: string
          test_id: string
          state_data: Json
          last_saved_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exam_id: string
          section_id?: string | null
          test_type: string
          test_id: string
          state_data: Json
          last_saved_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exam_id?: string
          section_id?: string | null
          test_type?: string
          test_id?: string
          state_data?: Json
          last_saved_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_states_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_messages: {
        Row: {
          id: string
          user_id: string
          message_type: string
          message: string
          is_read: boolean
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          message_type: string
          message: string
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          message_type?: string
          message?: string
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_rollbacks: {
        Row: {
          id: string
          payment_id: string
          user_id: string
          plan_id: string
          original_amount: number
          rollback_reason: string
          rollback_data: Json | null
          status: string
          created_at: string
          completed_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          payment_id: string
          user_id: string
          plan_id: string
          original_amount: number
          rollback_reason: string
          rollback_data?: Json | null
          status?: string
          created_at?: string
          completed_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          payment_id?: string
          user_id?: string
          plan_id?: string
          original_amount?: number
          rollback_reason?: string
          rollback_data?: Json | null
          status?: string
          created_at?: string
          completed_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_rollbacks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      performance_metrics: {
        Row: {
          id: string
          metric_type: string
          metric_name: string
          metric_value: number
          metric_unit: string | null
          context: Json | null
          user_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          metric_type: string
          metric_name: string
          metric_value: number
          metric_unit?: string | null
          context?: Json | null
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          metric_type?: string
          metric_name?: string
          metric_value?: number
          metric_unit?: string | null
          context?: Json | null
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rollback_payment_transaction: {
        Args: {
          p_payment_id: string
          p_user_id: string
          p_plan_id: string
          p_reason: string
        }
        Returns: Json
      }
      update_membership_status: {
        Args: {
          p_user_id: string
          p_plan_id: string
          p_status: string
        }
        Returns: boolean
      }
      update_referral_earnings: {
        Args: {
          p_user_id: string
          p_amount: number
          p_operation: string
        }
        Returns: boolean
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
