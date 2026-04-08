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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          payment_type: string
          product_id: string | null
          referred_user_id: string
          sale_amount: number
          status: string
          stripe_session_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          created_at?: string
          id?: string
          payment_type: string
          product_id?: string | null
          referred_user_id: string
          sale_amount: number
          status?: string
          stripe_session_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          payment_type?: string
          product_id?: string | null
          referred_user_id?: string
          sale_amount?: number
          status?: string
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          active: boolean
          code: string
          commission_rate: number
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          commission_rate: number
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          commission_rate?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_log: {
        Row: {
          category: string
          change_date: string
          created_at: string
          description: string
          id: string
        }
        Insert: {
          category: string
          change_date?: string
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          category?: string
          change_date?: string
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          role: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_notifications: {
        Row: {
          id: string
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_type?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_gaps: {
        Row: {
          analyzed_at: string
          gaps: Json
          id: string
          product_id: string
        }
        Insert: {
          analyzed_at?: string
          gaps?: Json
          id?: string
          product_id: string
        }
        Update: {
          analyzed_at?: string
          gaps?: Json
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_gaps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_nudges: {
        Row: {
          id: string
          nudge_type: string
          product_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          nudge_type?: string
          product_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          nudge_type?: string
          product_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_nudges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_prompt_usage: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          prompt_count: number
          updated_at: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          prompt_count?: number
          updated_at?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          prompt_count?: number
          updated_at?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_prompt_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          product_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_emails_sent: {
        Row: {
          email_type: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          email_type: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          email_type?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flagged_responses: {
        Row: {
          ai_response: string | null
          flagged_at: string
          id: string
          message_id: string
          product_id: string | null
          status: string
          thumbs_down_count: number
          user_question: string | null
        }
        Insert: {
          ai_response?: string | null
          flagged_at?: string
          id?: string
          message_id: string
          product_id?: string | null
          status?: string
          thumbs_down_count?: number
          user_question?: string | null
        }
        Update: {
          ai_response?: string | null
          flagged_at?: string
          id?: string
          message_id?: string
          product_id?: string | null
          status?: string
          thumbs_down_count?: number
          user_question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flagged_responses_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_responses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          feedback_type: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          feedback_type: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_snapshots: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics: Json
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          snapshot_date?: string
        }
        Relationships: []
      }
      monthly_tool_usage: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          tool_type: string
          updated_at: string
          usage_count: number
          usage_month: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          tool_type: string
          updated_at?: string
          usage_count?: number
          usage_month?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          tool_type?: string
          updated_at?: string
          usage_count?: number
          usage_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_tool_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          chatbase_free_url: string | null
          chatbase_premium_url: string | null
          created_at: string | null
          exam_board: string
          id: string
          lifetime_price: number
          monthly_price: number
          name: string
          qualification_type: string
          slug: string
          stripe_lifetime_price_id: string | null
          stripe_monthly_price_id: string | null
          subject: string
          system_prompt_deluxe: string | null
          system_prompt_free: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          chatbase_free_url?: string | null
          chatbase_premium_url?: string | null
          created_at?: string | null
          exam_board: string
          id?: string
          lifetime_price: number
          monthly_price: number
          name: string
          qualification_type?: string
          slug: string
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          subject: string
          system_prompt_deluxe?: string | null
          system_prompt_free?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          chatbase_free_url?: string | null
          chatbase_premium_url?: string | null
          created_at?: string | null
          exam_board?: string
          id?: string
          lifetime_price?: number
          monthly_price?: number
          name?: string
          qualification_type?: string
          slug?: string
          stripe_lifetime_price_id?: string | null
          stripe_monthly_price_id?: string | null
          subject?: string
          system_prompt_deluxe?: string | null
          system_prompt_free?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_improvements: {
        Row: {
          created_at: string
          feedback_count: number
          guidelines: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          feedback_count?: number
          guidelines: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          feedback_count?: number
          guidelines?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_improvements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_granted_referred: boolean
          reward_granted_referrer: boolean
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_granted_referred?: boolean
          reward_granted_referrer?: boolean
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_granted_referred?: boolean
          reward_granted_referrer?: boolean
          status?: string
        }
        Relationships: []
      }
      seasonal_prompts: {
        Row: {
          guidelines: string
          id: string
          product_id: string
          season: string
          updated_at: string
        }
        Insert: {
          guidelines: string
          id?: string
          product_id: string
          season: string
          updated_at?: string
        }
        Update: {
          guidelines?: string
          id?: string
          product_id?: string
          season?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_prompts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_projects: {
        Row: {
          created_at: string
          created_by: string | null
          custom_sections: Json | null
          diagram_library: Json | null
          essay_marker_marks: Json | null
          exam_board: string
          exam_dates: Json | null
          exam_technique: string | null
          exam_technique_submitted: boolean
          id: string
          last_deployed_at: string | null
          product_id: string | null
          qualification_type: string
          selected_features: Json | null
          staged_specifications: Json | null
          status: string
          subject: string
          suggested_prompts: Json | null
          system_prompt: string | null
          system_prompt_submitted: boolean
          trainer_achievements: Json | null
          trainer_bio_submitted: boolean
          trainer_description: string | null
          trainer_image_url: string | null
          trainer_name: string | null
          trainer_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_sections?: Json | null
          diagram_library?: Json | null
          essay_marker_marks?: Json | null
          exam_board: string
          exam_dates?: Json | null
          exam_technique?: string | null
          exam_technique_submitted?: boolean
          id?: string
          last_deployed_at?: string | null
          product_id?: string | null
          qualification_type?: string
          selected_features?: Json | null
          staged_specifications?: Json | null
          status?: string
          subject: string
          suggested_prompts?: Json | null
          system_prompt?: string | null
          system_prompt_submitted?: boolean
          trainer_achievements?: Json | null
          trainer_bio_submitted?: boolean
          trainer_description?: string | null
          trainer_image_url?: string | null
          trainer_name?: string | null
          trainer_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_sections?: Json | null
          diagram_library?: Json | null
          essay_marker_marks?: Json | null
          exam_board?: string
          exam_dates?: Json | null
          exam_technique?: string | null
          exam_technique_submitted?: boolean
          id?: string
          last_deployed_at?: string | null
          product_id?: string | null
          qualification_type?: string
          selected_features?: Json | null
          staged_specifications?: Json | null
          status?: string
          subject?: string
          suggested_prompts?: Json | null
          system_prompt?: string | null
          system_prompt_submitted?: boolean
          trainer_achievements?: Json | null
          trainer_bio_submitted?: boolean
          trainer_description?: string | null
          trainer_image_url?: string | null
          trainer_name?: string | null
          trainer_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_uploads: {
        Row: {
          chunks_created: number | null
          created_at: string
          doc_type: string | null
          file_name: string
          file_url: string
          id: string
          paper_number: number | null
          processing_status: string
          project_id: string
          section_type: string
          year: string | null
        }
        Insert: {
          chunks_created?: number | null
          created_at?: string
          doc_type?: string | null
          file_name: string
          file_url: string
          id?: string
          paper_number?: number | null
          processing_status?: string
          project_id: string
          section_type: string
          year?: string | null
        }
        Update: {
          chunks_created?: number | null
          created_at?: string
          doc_type?: string | null
          file_name?: string
          file_url?: string
          id?: string
          paper_number?: number | null
          processing_status?: string
          project_id?: string
          section_type?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_uploads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "trainer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_brain_profiles: {
        Row: {
          created_at: string
          id: string
          profile_summary: string
          subjects_detected: Json | null
          updated_at: string
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_summary?: string
          subjects_detected?: Json | null
          updated_at?: string
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_summary?: string
          subjects_detected?: Json | null
          updated_at?: string
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          feedback_type: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          feedback_type: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      user_mistakes: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          last_reviewed_at: string | null
          mastered: boolean
          next_review_at: string
          note: string | null
          product_id: string
          question_image_url: string | null
          question_text: string | null
          review_count: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          mastered?: boolean
          next_review_at?: string
          note?: string | null
          product_id: string
          question_image_url?: string | null
          question_text?: string | null
          review_count?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          last_reviewed_at?: string | null
          mastered?: boolean
          next_review_at?: string
          note?: string | null
          product_id?: string
          question_image_url?: string | null
          question_text?: string | null
          review_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mistakes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          additional_info: string | null
          created_at: string
          id: string
          predicted_grade: string
          product_id: string | null
          target_grade: string
          updated_at: string
          user_id: string
          year: string
        }
        Insert: {
          additional_info?: string | null
          created_at?: string
          id?: string
          predicted_grade?: string
          product_id?: string | null
          target_grade?: string
          updated_at?: string
          user_id: string
          year?: string
        }
        Update: {
          additional_info?: string | null
          created_at?: string
          id?: string
          predicted_grade?: string
          product_id?: string | null
          target_grade?: string
          updated_at?: string
          user_id?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string | null
          longest_streak: number
          streak_freeze_used: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          streak_freeze_used?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          streak_freeze_used?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          active: boolean | null
          cancelled_at: string | null
          created_at: string | null
          id: string
          migrated_from_users_table: boolean | null
          payment_type: string | null
          product_id: string
          started_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          migrated_from_users_table?: boolean | null
          payment_type?: string | null
          product_id: string
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          migrated_from_users_table?: boolean | null
          payment_type?: string | null
          product_id?: string
          started_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_premium: boolean
          payment_type: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_premium?: boolean
          payment_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_premium?: boolean
          payment_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      affiliates_public: {
        Row: {
          active: boolean | null
          code: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_tool_usage: {
        Args: { p_product_id: string; p_tool_type: string; p_user_id: string }
        Returns: Json
      }
      get_user_count: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_prompt_usage: {
        Args: { p_limit?: number; p_product_id: string; p_user_id: string }
        Returns: Json
      }
      increment_tool_usage: {
        Args: {
          p_limit: number
          p_product_id: string
          p_tool_type: string
          p_user_id: string
        }
        Returns: Json
      }
      match_documents: {
        Args: {
          filter_product_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "trainer" | "user"
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
    Enums: {
      app_role: ["admin", "trainer", "user"],
    },
  },
} as const
