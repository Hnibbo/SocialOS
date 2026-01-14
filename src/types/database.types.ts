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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      achievements: {
        Row: {
          asset_reward: string | null
          badge_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_secret: boolean | null
          name: string
          rarity: string | null
          requirement_data: Json | null
          requirement_threshold: number
          requirement_type: string
          sort_order: number | null
          xp_reward: number | null
        }
        Insert: {
          asset_reward?: string | null
          badge_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          is_secret?: boolean | null
          name: string
          rarity?: string | null
          requirement_data?: Json | null
          requirement_threshold: number
          requirement_type: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Update: {
          asset_reward?: string | null
          badge_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_secret?: boolean | null
          name?: string
          rarity?: string | null
          requirement_data?: Json | null
          requirement_threshold?: number
          requirement_type?: string
          sort_order?: number | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_asset_reward_fkey"
            columns: ["asset_reward"]
            isOneToOne: false
            referencedRelation: "digital_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          age_max: number | null
          age_min: number | null
          allow_dating: boolean | null
          business_id: string | null
          cancelled_reason: string | null
          category: string | null
          chat_enabled: boolean | null
          cost_amount: number | null
          cost_currency: string | null
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          current_attendees: number | null
          description: string | null
          end_time: string | null
          expires_at: string | null
          gender_filter: string | null
          group_id: string | null
          id: string
          interests: string[] | null
          is_anonymous: boolean | null
          is_free: boolean | null
          is_public: boolean | null
          is_recurring: boolean | null
          is_virtual: boolean | null
          location: unknown
          location_address: Json | null
          location_name: string | null
          max_attendees: number | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          photos_enabled: boolean | null
          recurrence_rule: string | null
          rsvp_required: boolean | null
          start_time: string
          status: string | null
          stripe_price_id: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          vibe_tags: string[] | null
          virtual_link: string | null
          waitlist_count: number | null
          waitlist_enabled: boolean | null
        }
        Insert: {
          activity_type: string
          age_max?: number | null
          age_min?: number | null
          allow_dating?: boolean | null
          business_id?: string | null
          cancelled_reason?: string | null
          category?: string | null
          chat_enabled?: boolean | null
          cost_amount?: number | null
          cost_currency?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time?: string | null
          expires_at?: string | null
          gender_filter?: string | null
          group_id?: string | null
          id?: string
          interests?: string[] | null
          is_anonymous?: boolean | null
          is_free?: boolean | null
          is_public?: boolean | null
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          location?: unknown
          location_address?: Json | null
          location_name?: string | null
          max_attendees?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          photos_enabled?: boolean | null
          recurrence_rule?: string | null
          rsvp_required?: boolean | null
          start_time: string
          status?: string | null
          stripe_price_id?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          vibe_tags?: string[] | null
          virtual_link?: string | null
          waitlist_count?: number | null
          waitlist_enabled?: boolean | null
        }
        Update: {
          activity_type?: string
          age_max?: number | null
          age_min?: number | null
          allow_dating?: boolean | null
          business_id?: string | null
          cancelled_reason?: string | null
          category?: string | null
          chat_enabled?: boolean | null
          cost_amount?: number | null
          cost_currency?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_attendees?: number | null
          description?: string | null
          end_time?: string | null
          expires_at?: string | null
          gender_filter?: string | null
          group_id?: string | null
          id?: string
          interests?: string[] | null
          is_anonymous?: boolean | null
          is_free?: boolean | null
          is_public?: boolean | null
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          location?: unknown
          location_address?: Json | null
          location_name?: string | null
          max_attendees?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          photos_enabled?: boolean | null
          recurrence_rule?: string | null
          rsvp_required?: boolean | null
          start_time?: string
          status?: string | null
          stripe_price_id?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          vibe_tags?: string[] | null
          virtual_link?: string | null
          waitlist_count?: number | null
          waitlist_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_attendees: {
        Row: {
          activity_id: string
          checked_in: boolean | null
          checked_in_at: string | null
          payment_id: string | null
          payment_status: string | null
          rsvp_time: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          activity_id: string
          checked_in?: boolean | null
          checked_in_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          rsvp_time?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string
          checked_in?: boolean | null
          checked_in_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          rsvp_time?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_attendees_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_messages: {
        Row: {
          activity_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_announcement: boolean | null
          media_urls: string[] | null
          message_type: string | null
          sender_id: string | null
        }
        Insert: {
          activity_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_announcement?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          sender_id?: string | null
        }
        Update: {
          activity_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_announcement?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_messages_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_id: string | null
          claimed: boolean | null
          clicked: boolean | null
          created_at: string | null
          distance_meters: number | null
          id: string
          location: unknown
          user_id: string | null
        }
        Insert: {
          ad_id?: string | null
          claimed?: boolean | null
          clicked?: boolean | null
          created_at?: string | null
          distance_meters?: number | null
          id?: string
          location?: unknown
          user_id?: string | null
        }
        Update: {
          ad_id?: string | null
          claimed?: boolean | null
          clicked?: boolean | null
          created_at?: string | null
          distance_meters?: number | null
          id?: string
          location?: unknown
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "proximity_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_config: {
        Row: {
          api_key_env: string | null
          cost_reset_at: string | null
          cost_tracking: boolean | null
          created_at: string | null
          current_cost_today: number | null
          description: string | null
          display_name: string
          enabled: boolean | null
          fallback_behavior: Json | null
          fallback_enabled: boolean | null
          feature: string
          id: string
          log_all_requests: boolean | null
          log_retention_days: number | null
          max_cost_per_day: number | null
          max_tokens: number | null
          model: string | null
          provider: string | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          system_prompt: string | null
          temperature: number | null
          top_p: number | null
          updated_at: string | null
        }
        Insert: {
          api_key_env?: string | null
          cost_reset_at?: string | null
          cost_tracking?: boolean | null
          created_at?: string | null
          current_cost_today?: number | null
          description?: string | null
          display_name: string
          enabled?: boolean | null
          fallback_behavior?: Json | null
          fallback_enabled?: boolean | null
          feature: string
          id?: string
          log_all_requests?: boolean | null
          log_retention_days?: number | null
          max_cost_per_day?: number | null
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          system_prompt?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key_env?: string | null
          cost_reset_at?: string | null
          cost_tracking?: boolean | null
          created_at?: string | null
          current_cost_today?: number | null
          description?: string | null
          display_name?: string
          enabled?: boolean | null
          fallback_behavior?: Json | null
          fallback_enabled?: boolean | null
          feature?: string
          id?: string
          log_all_requests?: boolean | null
          log_retention_days?: number | null
          max_cost_per_day?: number | null
          max_tokens?: number | null
          model?: string | null
          provider?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          system_prompt?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_decisions: {
        Row: {
          confidence: number | null
          context: Json | null
          cost: number | null
          created_at: string | null
          decision: string | null
          feature: string
          id: string
          input_data: Json | null
          latency_ms: number | null
          model_used: string | null
          output_data: Json | null
          override_at: string | null
          override_by: string | null
          override_reason: string | null
          provider: string | null
          reasoning: string | null
          related_id: string | null
          related_type: string | null
          tokens_input: number | null
          tokens_output: number | null
          was_overridden: boolean | null
        }
        Insert: {
          confidence?: number | null
          context?: Json | null
          cost?: number | null
          created_at?: string | null
          decision?: string | null
          feature: string
          id?: string
          input_data?: Json | null
          latency_ms?: number | null
          model_used?: string | null
          output_data?: Json | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          provider?: string | null
          reasoning?: string | null
          related_id?: string | null
          related_type?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          was_overridden?: boolean | null
        }
        Update: {
          confidence?: number | null
          context?: Json | null
          cost?: number | null
          created_at?: string | null
          decision?: string | null
          feature?: string
          id?: string
          input_data?: Json | null
          latency_ms?: number | null
          model_used?: string | null
          output_data?: Json | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          provider?: string | null
          reasoning?: string | null
          related_id?: string | null
          related_type?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          was_overridden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_feature_fkey"
            columns: ["feature"]
            isOneToOne: false
            referencedRelation: "ai_config"
            referencedColumns: ["feature"]
          },
          {
            foreignKeyName: "ai_decisions_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_type: string | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          ai_config_feature: string | null
          cooldown_seconds: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered: string | null
          name: string
          priority: number | null
          times_triggered: number | null
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string | null
          use_ai: boolean | null
        }
        Insert: {
          actions: Json
          ai_config_feature?: string | null
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          name: string
          priority?: number | null
          times_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string | null
          use_ai?: boolean | null
        }
        Update: {
          actions?: Json
          ai_config_feature?: string | null
          cooldown_seconds?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          name?: string
          priority?: number | null
          times_triggered?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string | null
          use_ai?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_ai_config_feature_fkey"
            columns: ["ai_config_feature"]
            isOneToOne: false
            referencedRelation: "ai_config"
            referencedColumns: ["feature"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_bookings: {
        Row: {
          amount: number | null
          booking_date: string
          booking_time: string
          business_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string | null
          currency: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          party_size: number | null
          service_name: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          booking_date: string
          booking_time: string
          business_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          party_size?: number | null
          service_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          booking_date?: string
          booking_time?: string
          business_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          party_size?: number | null
          service_name?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string | null
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          owner_responded_at: string | null
          owner_response: string | null
          photos: string[] | null
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string | null
          visit_date: string | null
          visit_type: string | null
        }
        Insert: {
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          owner_responded_at?: string | null
          owner_response?: string | null
          photos?: string[] | null
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          visit_date?: string | null
          visit_type?: string | null
        }
        Update: {
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          owner_responded_at?: string | null
          owner_response?: string | null
          photos?: string[] | null
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          visit_date?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          ad_budget_monthly: number | null
          address: Json | null
          address_formatted: string | null
          amenities: string[] | null
          brand_color: string | null
          can_book: boolean | null
          can_order: boolean | null
          can_reserve: boolean | null
          category: string
          cover_url: string | null
          created_at: string | null
          delivery_enabled: boolean | null
          description: string | null
          email: string | null
          follower_count: number | null
          hours: Json | null
          id: string
          is_open_now: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          location: unknown
          logo_url: string | null
          name: string
          owner_id: string | null
          payment_methods: string[] | null
          phone: string | null
          photos: string[] | null
          proximity_ads_enabled: boolean | null
          rating_avg: number | null
          rating_count: number | null
          review_count: number | null
          short_description: string | null
          slug: string | null
          social_links: Json | null
          status: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          subcategory: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          tags: string[] | null
          timezone: string | null
          updated_at: string | null
          verification_docs: Json | null
          verified_at: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          ad_budget_monthly?: number | null
          address?: Json | null
          address_formatted?: string | null
          amenities?: string[] | null
          brand_color?: string | null
          can_book?: boolean | null
          can_order?: boolean | null
          can_reserve?: boolean | null
          category: string
          cover_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          description?: string | null
          email?: string | null
          follower_count?: number | null
          hours?: Json | null
          id?: string
          is_open_now?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          location?: unknown
          logo_url?: string | null
          name: string
          owner_id?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          photos?: string[] | null
          proximity_ads_enabled?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          review_count?: number | null
          short_description?: string | null
          slug?: string | null
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          subcategory?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          verification_docs?: Json | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          ad_budget_monthly?: number | null
          address?: Json | null
          address_formatted?: string | null
          amenities?: string[] | null
          brand_color?: string | null
          can_book?: boolean | null
          can_order?: boolean | null
          can_reserve?: boolean | null
          category?: string
          cover_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          description?: string | null
          email?: string | null
          follower_count?: number | null
          hours?: Json | null
          id?: string
          is_open_now?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          location?: unknown
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          photos?: string[] | null
          proximity_ads_enabled?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          review_count?: number | null
          short_description?: string | null
          slug?: string | null
          social_links?: Json | null
          status?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          subcategory?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          verification_docs?: Json | null
          verified_at?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      city_challenges: {
        Row: {
          challenge_title: string
          challenge_type: string
          challenger_city_name: string | null
          completion_percentage: number | null
          current_participants: number | null
          defender_city_name: string | null
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          rewards: Json | null
          start_time: string
          target_user_count: number | null
          xp_reward: number | null
        }
        Insert: {
          challenge_title: string
          challenge_type: string
          challenger_city_name?: string | null
          completion_percentage?: number | null
          current_participants?: number | null
          defender_city_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          rewards?: Json | null
          start_time?: string
          target_user_count?: number | null
          xp_reward?: number | null
        }
        Update: {
          challenge_title?: string
          challenge_type?: string
          challenger_city_name?: string | null
          completion_percentage?: number | null
          current_participants?: number | null
          defender_city_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          rewards?: Json | null
          start_time?: string
          target_user_count?: number | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      city_energy_states: {
        Row: {
          activity_count: number | null
          city_name: string
          energy_level: string
          energy_score: number
          id: string
          is_active: boolean | null
          last_updated_at: string | null
          location_bounds: string | null
          neighborhood: string | null
          user_count: number | null
        }
        Insert: {
          activity_count?: number | null
          city_name: string
          energy_level: string
          energy_score: number
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          location_bounds?: string | null
          neighborhood?: string | null
          user_count?: number | null
        }
        Update: {
          activity_count?: number | null
          city_name?: string
          energy_level?: string
          energy_score?: number
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          location_bounds?: string | null
          neighborhood?: string | null
          user_count?: number | null
        }
        Relationships: []
      }
      compliance_regions: {
        Row: {
          age_of_consent: number | null
          age_of_majority: number | null
          banned_features: string[] | null
          code: string
          cookie_policy_version: string | null
          data_deletion_deadline_days: number | null
          data_export_deadline_days: number | null
          data_retention_days: number | null
          is_active: boolean | null
          name: string
          privacy_version: string | null
          regulations: string[] | null
          required_disclosures: string[] | null
          requires_parental_consent_under: number | null
          special_categories: string[] | null
          terms_version: string | null
          updated_at: string | null
        }
        Insert: {
          age_of_consent?: number | null
          age_of_majority?: number | null
          banned_features?: string[] | null
          code: string
          cookie_policy_version?: string | null
          data_deletion_deadline_days?: number | null
          data_export_deadline_days?: number | null
          data_retention_days?: number | null
          is_active?: boolean | null
          name: string
          privacy_version?: string | null
          regulations?: string[] | null
          required_disclosures?: string[] | null
          requires_parental_consent_under?: number | null
          special_categories?: string[] | null
          terms_version?: string | null
          updated_at?: string | null
        }
        Update: {
          age_of_consent?: number | null
          age_of_majority?: number | null
          banned_features?: string[] | null
          code?: string
          cookie_policy_version?: string | null
          data_deletion_deadline_days?: number | null
          data_export_deadline_days?: number | null
          data_retention_days?: number | null
          is_active?: boolean | null
          name?: string
          privacy_version?: string | null
          regulations?: string[] | null
          required_disclosures?: string[] | null
          requires_parental_consent_under?: number | null
          special_categories?: string[] | null
          terms_version?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content: {
        Row: {
          audience: string[] | null
          comments_count: number | null
          comments_enabled: boolean | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          creator_id: string | null
          deleted_at: string | null
          download_enabled: boolean | null
          duet_enabled: boolean | null
          expires_at: string | null
          hashtags: string[] | null
          id: string
          is_deleted: boolean | null
          is_local: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          location: unknown
          location_name: string | null
          media_urls: string[] | null
          mentions: string[] | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_result: Json | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          saves_count: number | null
          shares_count: number | null
          tags: string[] | null
          text_content: string | null
          thumbnail_url: string | null
          updated_at: string | null
          views_count: number | null
          visibility: string | null
        }
        Insert: {
          audience?: string[] | null
          comments_count?: number | null
          comments_enabled?: boolean | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          download_enabled?: boolean | null
          duet_enabled?: boolean | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_local?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: unknown
          location_name?: string | null
          media_urls?: string[] | null
          mentions?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_result?: Json | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          saves_count?: number | null
          shares_count?: number | null
          tags?: string[] | null
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Update: {
          audience?: string[] | null
          comments_count?: number | null
          comments_enabled?: boolean | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          download_enabled?: boolean | null
          duet_enabled?: boolean | null
          expires_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_local?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          location?: unknown
          location_name?: string | null
          media_urls?: string[] | null
          mentions?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_result?: Json | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          saves_count?: number | null
          shares_count?: number | null
          tags?: string[] | null
          text_content?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          block_key: string
          content: Json
          created_at: string | null
          id: string
          locale: string | null
          og_image: string | null
          page: string
          published: boolean | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          block_key: string
          content: Json
          created_at?: string | null
          id?: string
          locale?: string | null
          og_image?: string | null
          page: string
          published?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          block_key?: string
          content?: Json
          created_at?: string | null
          id?: string
          locale?: string | null
          og_image?: string | null
          page?: string
          published?: boolean | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          parent_id: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_likes: {
        Row: {
          content_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_saves: {
        Row: {
          collection: string | null
          content_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          collection?: string | null
          content_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          collection?: string | null
          content_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_saves_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_views: {
        Row: {
          completed: boolean | null
          content_id: string | null
          created_at: string | null
          id: string
          source: string | null
          user_id: string | null
          watch_duration_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          user_id?: string | null
          watch_duration_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          user_id?: string | null
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          last_message_id: string | null
          user1_archived: boolean | null
          user1_id: string | null
          user1_muted: boolean | null
          user1_unread_count: number | null
          user2_archived: boolean | null
          user2_id: string | null
          user2_muted: boolean | null
          user2_unread_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          user1_archived?: boolean | null
          user1_id?: string | null
          user1_muted?: boolean | null
          user1_unread_count?: number | null
          user2_archived?: boolean | null
          user2_id?: string | null
          user2_muted?: boolean | null
          user2_unread_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          user1_archived?: boolean | null
          user1_id?: string | null
          user1_muted?: boolean | null
          user1_unread_count?: number | null
          user2_archived?: boolean | null
          user2_id?: string | null
          user2_muted?: boolean | null
          user2_unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_last_message_id_fkey"
            columns: ["last_message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crossed_paths: {
        Row: {
          crossed_at: string | null
          id: string
          location: unknown
          location_name: string | null
          times_crossed: number | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          crossed_at?: string | null
          id?: string
          location?: unknown
          location_name?: string | null
          times_crossed?: number | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          crossed_at?: string | null
          id?: string
          location?: unknown
          location_name?: string | null
          times_crossed?: number | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crossed_paths_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossed_paths_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossed_paths_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossed_paths_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          completed_at: string | null
          deadline: string | null
          download_expires_at: string | null
          download_url: string | null
          id: string
          notes: string | null
          processed_by: string | null
          processing_notes: string | null
          request_type: string
          requested_at: string | null
          scope: string[] | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          deadline?: string | null
          download_expires_at?: string | null
          download_url?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_notes?: string | null
          request_type: string
          requested_at?: string | null
          scope?: string[] | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          deadline?: string | null
          download_expires_at?: string | null
          download_url?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_notes?: string | null
          request_type?: string
          requested_at?: string | null
          scope?: string[] | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_matches: {
        Row: {
          chat_started: boolean | null
          context: string | null
          context_id: string | null
          first_message_at: string | null
          id: string
          is_anonymous: boolean | null
          matched_at: string | null
          status: string | null
          unmatched_at: string | null
          unmatched_by: string | null
          user1_id: string | null
          user1_revealed: boolean | null
          user2_id: string | null
          user2_revealed: boolean | null
        }
        Insert: {
          chat_started?: boolean | null
          context?: string | null
          context_id?: string | null
          first_message_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          matched_at?: string | null
          status?: string | null
          unmatched_at?: string | null
          unmatched_by?: string | null
          user1_id?: string | null
          user1_revealed?: boolean | null
          user2_id?: string | null
          user2_revealed?: boolean | null
        }
        Update: {
          chat_started?: boolean | null
          context?: string | null
          context_id?: string | null
          first_message_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          matched_at?: string | null
          status?: string | null
          unmatched_at?: string | null
          unmatched_by?: string | null
          user1_id?: string | null
          user1_revealed?: boolean | null
          user2_id?: string | null
          user2_revealed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          match_id: string | null
          media_url: string | null
          message_type: string | null
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string | null
          media_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "dating_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_profiles: {
        Row: {
          age_max: number | null
          age_min: number | null
          created_at: string | null
          daily_swipe_count: number | null
          daily_swipe_reset: string | null
          deal_breakers: string[] | null
          distance_max_km: number | null
          gender_preference: string[] | null
          height_cm: number | null
          height_preference_max: number | null
          height_preference_min: number | null
          interests: string[] | null
          is_active: boolean | null
          last_active: string | null
          looking_for: string[] | null
          modes_enabled: string[] | null
          photos: string[] | null
          prompts: Json | null
          relationship_type: string | null
          show_age: boolean | null
          show_distance: boolean | null
          show_last_name: boolean | null
          show_photos: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          daily_swipe_count?: number | null
          daily_swipe_reset?: string | null
          deal_breakers?: string[] | null
          distance_max_km?: number | null
          gender_preference?: string[] | null
          height_cm?: number | null
          height_preference_max?: number | null
          height_preference_min?: number | null
          interests?: string[] | null
          is_active?: boolean | null
          last_active?: string | null
          looking_for?: string[] | null
          modes_enabled?: string[] | null
          photos?: string[] | null
          prompts?: Json | null
          relationship_type?: string | null
          show_age?: boolean | null
          show_distance?: boolean | null
          show_last_name?: boolean | null
          show_photos?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          created_at?: string | null
          daily_swipe_count?: number | null
          daily_swipe_reset?: string | null
          deal_breakers?: string[] | null
          distance_max_km?: number | null
          gender_preference?: string[] | null
          height_cm?: number | null
          height_preference_max?: number | null
          height_preference_min?: number | null
          interests?: string[] | null
          is_active?: boolean | null
          last_active?: string | null
          looking_for?: string[] | null
          modes_enabled?: string[] | null
          photos?: string[] | null
          prompts?: Json | null
          relationship_type?: string | null
          show_age?: boolean | null
          show_distance?: boolean | null
          show_last_name?: boolean | null
          show_photos?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dating_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dating_swipes: {
        Row: {
          context: string | null
          context_id: string | null
          created_at: string | null
          direction: string
          id: string
          swiped_id: string | null
          swiper_id: string | null
        }
        Insert: {
          context?: string | null
          context_id?: string | null
          created_at?: string | null
          direction: string
          id?: string
          swiped_id?: string | null
          swiper_id?: string | null
        }
        Update: {
          context?: string | null
          context_id?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          swiped_id?: string | null
          swiper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dating_swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_swiped_id_fkey"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dating_swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_assets: {
        Row: {
          asset_data: Json
          asset_type: string
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_limited: boolean | null
          name: string
          preview_url: string | null
          price: number
          quantity_available: number | null
          quantity_sold: number | null
          stripe_price_id: string | null
        }
        Insert: {
          asset_data: Json
          asset_type: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          name: string
          preview_url?: string | null
          price: number
          quantity_available?: number | null
          quantity_sold?: number | null
          stripe_price_id?: string | null
        }
        Update: {
          asset_data?: Json
          asset_type?: string
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          name?: string
          preview_url?: string | null
          price?: number
          quantity_available?: number | null
          quantity_sold?: number | null
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_deleted_recipient: boolean | null
          is_deleted_sender: boolean | null
          is_read: boolean | null
          media_urls: string[] | null
          message_type: string | null
          read_at: string | null
          recipient_id: string | null
          reply_to: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted_recipient?: boolean | null
          is_deleted_sender?: boolean | null
          is_read?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted_recipient?: boolean | null
          is_deleted_sender?: boolean | null
          is_read?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          read_at?: string | null
          recipient_id?: string | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          html_content: string
          id: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string | null
          countries: string[] | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          name: string
          rollout_percentage: number | null
          subscription_tiers: string[] | null
          updated_at: string | null
          updated_by: string | null
          user_blacklist: string[] | null
          user_whitelist: string[] | null
        }
        Insert: {
          category?: string | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          name: string
          rollout_percentage?: number | null
          subscription_tiers?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          user_blacklist?: string[] | null
          user_whitelist?: string[] | null
        }
        Update: {
          category?: string | null
          countries?: string[] | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          name?: string
          rollout_percentage?: number | null
          subscription_tiers?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          user_blacklist?: string[] | null
          user_whitelist?: string[] | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          notifications_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          notifications_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          notifications_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          invitee_id: string | null
          inviter_id: string | null
          message: string | null
          responded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          invitee_id?: string | null
          inviter_id?: string | null
          message?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          invitee_id?: string | null
          inviter_id?: string | null
          message?: string | null
          responded_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          invited_by: string | null
          joined_at: string | null
          nickname: string | null
          notifications_enabled: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          invited_by?: string | null
          joined_at?: string | null
          nickname?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          invited_by?: string | null
          joined_at?: string | null
          nickname?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string | null
          created_at: string | null
          edited_at: string | null
          group_id: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          media_urls: string[] | null
          message_type: string | null
          reactions: Json | null
          reply_to: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          reactions?: Json | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          group_id?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          media_urls?: string[] | null
          message_type?: string | null
          reactions?: Json | null
          reply_to?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          activities_enabled: boolean | null
          avatar_url: string | null
          banned_words: string[] | null
          banner_url: string | null
          category: string | null
          chat_enabled: boolean | null
          content_enabled: boolean | null
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          dating_enabled: boolean | null
          description: string | null
          expires_at: string | null
          id: string
          interests: string[] | null
          invite_only: boolean | null
          is_moving: boolean | null
          is_public: boolean | null
          is_verified: boolean | null
          join_approval_required: boolean | null
          last_activity: string | null
          location: unknown
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_members: number | null
          member_count: number | null
          moderation_level: string | null
          name: string
          privacy: string | null
          updated_at: string | null
          vibe_tags: string[] | null
        }
        Insert: {
          activities_enabled?: boolean | null
          avatar_url?: string | null
          banned_words?: string[] | null
          banner_url?: string | null
          category?: string | null
          chat_enabled?: boolean | null
          content_enabled?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          dating_enabled?: boolean | null
          description?: string | null
          expires_at?: string | null
          id?: string
          interests?: string[] | null
          invite_only?: boolean | null
          is_moving?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          join_approval_required?: boolean | null
          last_activity?: string | null
          location?: unknown
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_members?: number | null
          member_count?: number | null
          moderation_level?: string | null
          name: string
          privacy?: string | null
          updated_at?: string | null
          vibe_tags?: string[] | null
        }
        Update: {
          activities_enabled?: boolean | null
          avatar_url?: string | null
          banned_words?: string[] | null
          banner_url?: string | null
          category?: string | null
          chat_enabled?: boolean | null
          content_enabled?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          dating_enabled?: boolean | null
          description?: string | null
          expires_at?: string | null
          id?: string
          interests?: string[] | null
          invite_only?: boolean | null
          is_moving?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          join_approval_required?: boolean | null
          last_activity?: string | null
          location?: unknown
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_members?: number | null
          member_count?: number | null
          moderation_level?: string | null
          name?: string
          privacy?: string | null
          updated_at?: string | null
          vibe_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_stats: {
        Row: {
          created_at: string | null
          hashtag: string
          last_used: string | null
          trend_score: number | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          hashtag: string
          last_used?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          hashtag?: string
          last_used?: string | null
          trend_score?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          leaderboard_id: string
          period_end: string | null
          period_start: string
          rank: number | null
          score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          leaderboard_id: string
          period_end?: string | null
          period_start: string
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          leaderboard_id?: string
          period_end?: string | null
          period_start?: string
          rank?: number | null
          score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_leaderboard_id_fkey"
            columns: ["leaderboard_id"]
            isOneToOne: false
            referencedRelation: "leaderboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          description: string | null
          id: string
          is_active: boolean | null
          metric: string
          name: string
          period: string | null
        }
        Insert: {
          description?: string | null
          id: string
          is_active?: boolean | null
          metric: string
          name: string
          period?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric?: string
          name?: string
          period?: string | null
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          allow_comments: boolean | null
          allow_gifts: boolean | null
          description: string | null
          ended_at: string | null
          gifts_received: Json | null
          host_id: string | null
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          is_public: boolean | null
          likes_count: number | null
          location: unknown
          location_name: string | null
          max_duration_seconds: number | null
          max_participants: number | null
          max_viewers: number | null
          peak_viewers: number | null
          playback_url: string | null
          recording_enabled: boolean | null
          recording_url: string | null
          scheduled_for: string | null
          started_at: string | null
          stream_key: string | null
          stream_type: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          total_views: number | null
          updated_at: string | null
          viewer_count: number | null
          visibility: string | null
          webrtc_room_id: string | null
        }
        Insert: {
          allow_comments?: boolean | null
          allow_gifts?: boolean | null
          description?: string | null
          ended_at?: string | null
          gifts_received?: Json | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          location?: unknown
          location_name?: string | null
          max_duration_seconds?: number | null
          max_participants?: number | null
          max_viewers?: number | null
          peak_viewers?: number | null
          playback_url?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          stream_key?: string | null
          stream_type: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          total_views?: number | null
          updated_at?: string | null
          viewer_count?: number | null
          visibility?: string | null
          webrtc_room_id?: string | null
        }
        Update: {
          allow_comments?: boolean | null
          allow_gifts?: boolean | null
          description?: string | null
          ended_at?: string | null
          gifts_received?: Json | null
          host_id?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          location?: unknown
          location_name?: string | null
          max_duration_seconds?: number | null
          max_participants?: number | null
          max_viewers?: number | null
          peak_viewers?: number | null
          playback_url?: string | null
          recording_enabled?: boolean | null
          recording_url?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          stream_key?: string | null
          stream_type?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          total_views?: number | null
          updated_at?: string | null
          viewer_count?: number | null
          visibility?: string | null
          webrtc_room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_streams_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_history: {
        Row: {
          accuracy: number | null
          id: string
          location: unknown
          recorded_at: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          id?: string
          location?: unknown
          recorded_at?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          id?: string
          location?: unknown
          recorded_at?: string | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loneliness_detection: {
        Row: {
          consecutive_inactive_periods: number | null
          detected_at: string | null
          id: string
          intervention_sent_at: string | null
          intervention_triggered: boolean | null
          intervention_type: string | null
          isolation_score: number | null
          last_active_at: string | null
          user_id: string | null
        }
        Insert: {
          consecutive_inactive_periods?: number | null
          detected_at?: string | null
          id?: string
          intervention_sent_at?: string | null
          intervention_triggered?: boolean | null
          intervention_type?: string | null
          isolation_score?: number | null
          last_active_at?: string | null
          user_id?: string | null
        }
        Update: {
          consecutive_inactive_periods?: number | null
          detected_at?: string | null
          id?: string
          intervention_sent_at?: string | null
          intervention_triggered?: boolean | null
          intervention_type?: string | null
          isolation_score?: number | null
          last_active_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_capsules: {
        Row: {
          capsule_type: string
          content: Json
          created_at: string | null
          energy_score: number | null
          id: string
          is_private: boolean | null
          location_lat: number | null
          location_lng: number | null
          mood_score: number | null
          shared_with: string[] | null
          tags: string[] | null
          title: string
          user_id: string | null
        }
        Insert: {
          capsule_type: string
          content: Json
          created_at?: string | null
          energy_score?: number | null
          id?: string
          is_private?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          mood_score?: number | null
          shared_with?: string[] | null
          tags?: string[] | null
          title: string
          user_id?: string | null
        }
        Update: {
          capsule_type?: string
          content?: Json
          created_at?: string | null
          energy_score?: number | null
          id?: string
          is_private?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          mood_score?: number | null
          shared_with?: string[] | null
          tags?: string[] | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      moment_drops: {
        Row: {
          created_by_user_id: string | null
          current_participants: number | null
          description: string | null
          drop_type: string
          end_time: string
          id: string
          is_active: boolean | null
          location_lat: number | null
          location_lng: number | null
          max_participants: number | null
          radius_meters: number | null
          rewards: Json | null
          start_time: string
          title: string
        }
        Insert: {
          created_by_user_id?: string | null
          current_participants?: number | null
          description?: string | null
          drop_type: string
          end_time: string
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          max_participants?: number | null
          radius_meters?: number | null
          rewards?: Json | null
          start_time?: string
          title: string
        }
        Update: {
          created_by_user_id?: string | null
          current_participants?: number | null
          description?: string | null
          drop_type?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          max_participants?: number | null
          radius_meters?: number | null
          rewards?: Json | null
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          activities_email: boolean | null
          activities_push: boolean | null
          content_email: boolean | null
          content_push: boolean | null
          email_enabled: boolean | null
          groups_email: boolean | null
          groups_push: boolean | null
          marketing_email: boolean | null
          marketing_push: boolean | null
          matches_email: boolean | null
          matches_push: boolean | null
          messages_email: boolean | null
          messages_push: boolean | null
          push_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities_email?: boolean | null
          activities_push?: boolean | null
          content_email?: boolean | null
          content_push?: boolean | null
          email_enabled?: boolean | null
          groups_email?: boolean | null
          groups_push?: boolean | null
          marketing_email?: boolean | null
          marketing_push?: boolean | null
          matches_email?: boolean | null
          matches_push?: boolean | null
          messages_email?: boolean | null
          messages_push?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities_email?: boolean | null
          activities_push?: boolean | null
          content_email?: boolean | null
          content_push?: boolean | null
          email_enabled?: boolean | null
          groups_email?: boolean | null
          groups_push?: boolean | null
          marketing_email?: boolean | null
          marketing_push?: boolean | null
          matches_email?: boolean | null
          matches_push?: boolean | null
          messages_email?: boolean | null
          messages_push?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string | null
          action_url: string | null
          body: string | null
          category: string | null
          created_at: string | null
          data: Json | null
          id: string
          image_url: string | null
          is_pushed: boolean | null
          is_read: boolean | null
          notification_type: string
          pushed_at: string | null
          read_at: string | null
          related_id: string | null
          related_type: string | null
          sender_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          is_pushed?: boolean | null
          is_read?: boolean | null
          notification_type: string
          pushed_at?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          image_url?: string | null
          is_pushed?: boolean | null
          is_read?: boolean | null
          notification_type?: string
          pushed_at?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          sender_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      panic_events: {
        Row: {
          context: Json | null
          id: string
          location: unknown
          resolution: string | null
          resolved_at: string | null
          triggered_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          id?: string
          location?: unknown
          resolution?: string | null
          resolved_at?: string | null
          triggered_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          id?: string
          location?: unknown
          resolution?: string | null
          resolved_at?: string | null
          triggered_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "panic_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panic_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_type: string
          status: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          can_edit_live: boolean | null
          category: string
          created_at: string | null
          description: string | null
          display_name: string | null
          env_var_name: string | null
          is_env_var: boolean | null
          is_secret: boolean | null
          key: string
          previous_value: Json | null
          requires_restart: boolean | null
          subcategory: string | null
          updated_at: string | null
          updated_by: string | null
          validation_schema: Json | null
          value: Json
          value_type: string | null
        }
        Insert: {
          can_edit_live?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          env_var_name?: string | null
          is_env_var?: boolean | null
          is_secret?: boolean | null
          key: string
          previous_value?: Json | null
          requires_restart?: boolean | null
          subcategory?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validation_schema?: Json | null
          value: Json
          value_type?: string | null
        }
        Update: {
          can_edit_live?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          env_var_name?: string | null
          is_env_var?: boolean | null
          is_secret?: boolean | null
          key?: string
          previous_value?: Json | null
          requires_restart?: boolean | null
          subcategory?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validation_schema?: Json | null
          value?: Json
          value_type?: string | null
        }
        Relationships: []
      }
      proximity_ads: {
        Row: {
          active_hours: Json | null
          business_id: string | null
          claims_count: number | null
          clicks_count: number | null
          cost_per_claim: number | null
          cost_per_click: number | null
          cost_per_impression: number | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          daily_budget: number | null
          description: string | null
          discount_amount: number | null
          discount_type: string | null
          end_time: string
          id: string
          image_url: string | null
          impressions_count: number | null
          is_active: boolean | null
          is_approved: boolean | null
          max_claims: number | null
          max_impressions: number | null
          offer_type: string | null
          promo_code: string | null
          radius_meters: number | null
          start_time: string
          target_age_max: number | null
          target_age_min: number | null
          target_genders: string[] | null
          target_interests: string[] | null
          title: string
          total_spent: number | null
        }
        Insert: {
          active_hours?: Json | null
          business_id?: string | null
          claims_count?: number | null
          clicks_count?: number | null
          cost_per_claim?: number | null
          cost_per_click?: number | null
          cost_per_impression?: number | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          daily_budget?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          end_time: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          is_approved?: boolean | null
          max_claims?: number | null
          max_impressions?: number | null
          offer_type?: string | null
          promo_code?: string | null
          radius_meters?: number | null
          start_time: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_genders?: string[] | null
          target_interests?: string[] | null
          title: string
          total_spent?: number | null
        }
        Update: {
          active_hours?: Json | null
          business_id?: string | null
          claims_count?: number | null
          clicks_count?: number | null
          cost_per_claim?: number | null
          cost_per_click?: number | null
          cost_per_impression?: number | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          daily_budget?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          end_time?: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          is_approved?: boolean | null
          max_claims?: number | null
          max_impressions?: number | null
          offer_type?: string | null
          promo_code?: string | null
          radius_meters?: number | null
          start_time?: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_genders?: string[] | null
          target_interests?: string[] | null
          title?: string
          total_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proximity_ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          platform: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          platform: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          platform?: string
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_chat_messages: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "random_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_chat_queue: {
        Row: {
          anonymous: boolean | null
          expires_at: string | null
          gender: string | null
          gender_preference: string | null
          id: string
          intent: string | null
          joined_at: string | null
          location: unknown
          nearby_only: boolean | null
          search_radius_km: number | null
          user_id: string | null
        }
        Insert: {
          anonymous?: boolean | null
          expires_at?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          intent?: string | null
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Update: {
          anonymous?: boolean | null
          expires_at?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          intent?: string | null
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_chat_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chat_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_chats: {
        Row: {
          converted_to: string | null
          distance_km: number | null
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          ended_by: string | null
          id: string
          is_anonymous: boolean | null
          message_count: number | null
          started_at: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          converted_to?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_count?: number | null
          started_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          converted_to?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_count?: number | null
          started_at?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_chats_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chats_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chats_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_chats_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connect_queue: {
        Row: {
          connection_type: string
          expires_at: string | null
          global_fallback: boolean | null
          id: string
          joined_at: string | null
          location: unknown
          nearby_only: boolean | null
          preferences: Json | null
          search_radius_km: number | null
          user_id: string | null
        }
        Insert: {
          connection_type: string
          expires_at?: string | null
          global_fallback?: boolean | null
          id?: string
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          preferences?: Json | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Update: {
          connection_type?: string
          expires_at?: string | null
          global_fallback?: boolean | null
          id?: string
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          preferences?: Json | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_connect_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_connect_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_connections: {
        Row: {
          connection_type: string
          converted_to: string | null
          distance_km: number | null
          duration_seconds: number | null
          end_reason: string | null
          ended_at: string | null
          ended_by: string | null
          id: string
          is_nearby: boolean | null
          report_reason: string | null
          reported: boolean | null
          started_at: string | null
          user1_id: string | null
          user1_location: unknown
          user1_rating: number | null
          user2_id: string | null
          user2_location: unknown
          user2_rating: number | null
          webrtc_room_id: string | null
        }
        Insert: {
          connection_type: string
          converted_to?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_nearby?: boolean | null
          report_reason?: string | null
          reported?: boolean | null
          started_at?: string | null
          user1_id?: string | null
          user1_location?: unknown
          user1_rating?: number | null
          user2_id?: string | null
          user2_location?: unknown
          user2_rating?: number | null
          webrtc_room_id?: string | null
        }
        Update: {
          connection_type?: string
          converted_to?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          end_reason?: string | null
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          is_nearby?: boolean | null
          report_reason?: string | null
          reported?: boolean | null
          started_at?: string | null
          user1_id?: string | null
          user1_location?: unknown
          user1_rating?: number | null
          user2_id?: string | null
          user2_location?: unknown
          user2_rating?: number | null
          webrtc_room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_connections_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_connections_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_connections_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_connections_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      random_date_queue: {
        Row: {
          expires_at: string | null
          id: string
          joined_at: string | null
          location: unknown
          nearby_only: boolean | null
          preferences: Json | null
          search_radius_km: number | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          preferences?: Json | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          joined_at?: string | null
          location?: unknown
          nearby_only?: boolean | null
          preferences?: Json | null
          search_radius_km?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_date_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "random_date_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          ai_analysis: Json | null
          ai_severity_score: number | null
          created_at: string | null
          description: string | null
          evidence_urls: string[] | null
          id: string
          priority: string | null
          reason: string
          reported_content_id: string | null
          reported_content_type: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolution: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          ai_analysis?: Json | null
          ai_severity_score?: number | null
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          priority?: string | null
          reason: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          ai_analysis?: Json | null
          ai_severity_score?: number | null
          created_at?: string | null
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          priority?: string | null
          reason?: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_signals: {
        Row: {
          duration_minutes: number | null
          end_time: string
          id: string
          is_active: boolean | null
          signal_type: string
          signal_value: string | null
          start_time: string | null
          user_id: string | null
          visibility_radius_meters: number | null
        }
        Insert: {
          duration_minutes?: number | null
          end_time: string
          id?: string
          is_active?: boolean | null
          signal_type: string
          signal_value?: string | null
          start_time?: string | null
          user_id?: string | null
          visibility_radius_meters?: number | null
        }
        Update: {
          duration_minutes?: number | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          signal_type?: string
          signal_value?: string | null
          start_time?: string | null
          user_id?: string | null
          visibility_radius_meters?: number | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      stream_messages: {
        Row: {
          content: string | null
          created_at: string | null
          gift_amount: number | null
          gift_type: string | null
          id: string
          is_pinned: boolean | null
          message_type: string | null
          stream_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          gift_amount?: number | null
          gift_type?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          stream_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          gift_amount?: number | null
          gift_type?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          stream_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_participants: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          role: string | null
          stream_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          stream_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          stream_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_viewers: {
        Row: {
          joined_at: string | null
          left_at: string | null
          stream_id: string
          user_id: string
          watch_duration_seconds: number | null
        }
        Insert: {
          joined_at?: string | null
          left_at?: string | null
          stream_id: string
          user_id: string
          watch_duration_seconds?: number | null
        }
        Update: {
          joined_at?: string | null
          left_at?: string | null
          stream_id?: string
          user_id?: string
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_viewers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_viewers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_accounts: {
        Row: {
          created_at: string | null
          details_submitted: boolean | null
          payouts_enabled: boolean | null
          status: string | null
          stripe_account_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details_submitted?: boolean | null
          payouts_enabled?: boolean | null
          status?: string | null
          stripe_account_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details_submitted?: boolean | null
          payouts_enabled?: boolean | null
          status?: string | null
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          stripe_price_monthly: string | null
          stripe_price_yearly: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_monthly?: string | null
          stripe_price_yearly?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          stripe_price_monthly?: string | null
          stripe_price_yearly?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          claimed: boolean | null
          claimed_at: string | null
          completed: boolean | null
          completed_at: string | null
          progress: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          claimed?: boolean | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          progress?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          claimed?: boolean | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assets: {
        Row: {
          acquired_at: string | null
          acquisition_type: string | null
          asset_id: string | null
          equipped_slot: string | null
          id: string
          is_equipped: boolean | null
          payment_id: string | null
          user_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          acquisition_type?: string | null
          asset_id?: string | null
          equipped_slot?: string | null
          id?: string
          is_equipped?: boolean | null
          payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          acquisition_type?: string | null
          asset_id?: string | null
          equipped_slot?: string | null
          id?: string
          is_equipped?: boolean | null
          payment_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "digital_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assets_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          consent_type: string
          consent_version: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          consent_version: string
          granted: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          consent_version?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metrics: {
        Row: {
          followers_count: number | null
          following_count: number | null
          hup_score: number | null
          posts_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          followers_count?: number | null
          following_count?: number | null
          hup_score?: number | null
          posts_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          followers_count?: number | null
          following_count?: number | null
          hup_score?: number | null
          posts_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          accuracy: number | null
          altitude: number | null
          anonymous_mode: boolean | null
          availability: Database["public"]["Enums"]["user_availability"] | null
          current_activity_id: string | null
          current_group_id: string | null
          energy_level: number | null
          heading: number | null
          intent_icons: string[] | null
          is_visible: boolean | null
          last_known_location: unknown
          last_location_update: string | null
          last_location_updated_at: string | null
          last_seen: string | null
          location: unknown
          location_name: string | null
          looking_for: string[] | null
          mood: string | null
          online_at: string | null
          presence_expires_at: string | null
          speed: number | null
          status_emoji: string | null
          status_text: string | null
          updated_at: string | null
          user_id: string
          visibility_mode: string | null
          visibility_radius: number | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          anonymous_mode?: boolean | null
          availability?: Database["public"]["Enums"]["user_availability"] | null
          current_activity_id?: string | null
          current_group_id?: string | null
          energy_level?: number | null
          heading?: number | null
          intent_icons?: string[] | null
          is_visible?: boolean | null
          last_known_location?: unknown
          last_location_update?: string | null
          last_location_updated_at?: string | null
          last_seen?: string | null
          location?: unknown
          location_name?: string | null
          looking_for?: string[] | null
          mood?: string | null
          online_at?: string | null
          presence_expires_at?: string | null
          speed?: number | null
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string | null
          user_id: string
          visibility_mode?: string | null
          visibility_radius?: number | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          anonymous_mode?: boolean | null
          availability?: Database["public"]["Enums"]["user_availability"] | null
          current_activity_id?: string | null
          current_group_id?: string | null
          energy_level?: number | null
          heading?: number | null
          intent_icons?: string[] | null
          is_visible?: boolean | null
          last_known_location?: unknown
          last_location_update?: string | null
          last_location_updated_at?: string | null
          last_seen?: string | null
          location?: unknown
          location_name?: string | null
          looking_for?: string[] | null
          mood?: string | null
          online_at?: string | null
          presence_expires_at?: string | null
          speed?: number | null
          status_emoji?: string | null
          status_text?: string | null
          updated_at?: string | null
          user_id?: string
          visibility_mode?: string | null
          visibility_radius?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          achievements: Json | null
          api_token: string | null
          avatar_3d_config: Json | null
          avatar_url: string | null
          badges: string[] | null
          ban_reason: string | null
          banned: boolean | null
          banned_until: string | null
          bio: string | null
          birth_date: string | null
          cover_url: string | null
          created_at: string | null
          creator_bio: string | null
          creator_categories: string[] | null
          creator_handle: string | null
          creator_monetization_enabled: boolean | null
          creator_verified: boolean | null
          date_of_birth: string | null
          dating_enabled: boolean | null
          dating_preferences: Json | null
          digital_assets: Json | null
          display_name: string | null
          email: string | null
          first_name: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_creator: boolean | null
          last_active: string | null
          last_name: string | null
          level: number | null
          location_city: string | null
          location_country: string | null
          location_timezone: string | null
          phone: string | null
          privacy_settings: Json | null
          stripe_connect_id: string | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string | null
          username: string | null
          verified: boolean | null
          vibe_tags: string[] | null
          website: string | null
          xp_points: number | null
        }
        Insert: {
          achievements?: Json | null
          api_token?: string | null
          avatar_3d_config?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_bio?: string | null
          creator_categories?: string[] | null
          creator_handle?: string | null
          creator_monetization_enabled?: boolean | null
          creator_verified?: boolean | null
          date_of_birth?: string | null
          dating_enabled?: boolean | null
          dating_preferences?: Json | null
          digital_assets?: Json | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          is_creator?: boolean | null
          last_active?: string | null
          last_name?: string | null
          level?: number | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          vibe_tags?: string[] | null
          website?: string | null
          xp_points?: number | null
        }
        Update: {
          achievements?: Json | null
          api_token?: string | null
          avatar_3d_config?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_bio?: string | null
          creator_categories?: string[] | null
          creator_handle?: string | null
          creator_monetization_enabled?: boolean | null
          creator_verified?: boolean | null
          date_of_birth?: string | null
          dating_enabled?: boolean | null
          dating_preferences?: Json | null
          digital_assets?: Json | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_creator?: boolean | null
          last_active?: string | null
          last_name?: string | null
          level?: number | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          vibe_tags?: string[] | null
          website?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_id: string | null
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_active: string | null
          location_city: string | null
          location_country: string | null
          os: string | null
          revoke_reason: string | null
          revoked_at: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active?: string | null
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_id?: string | null
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_active?: string | null
          location_city?: string | null
          location_country?: string | null
          os?: string | null
          revoke_reason?: string | null
          revoked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_roles: {
        Row: {
          current_level: number | null
          earned_at: string | null
          id: string
          is_active: boolean | null
          role_attributes: Json | null
          role_type: string
          unlocks: Json | null
          user_id: string | null
          xp_points: number | null
        }
        Insert: {
          current_level?: number | null
          earned_at?: string | null
          id?: string
          is_active?: boolean | null
          role_attributes?: Json | null
          role_type: string
          unlocks?: Json | null
          user_id?: string | null
          xp_points?: number | null
        }
        Update: {
          current_level?: number | null
          earned_at?: string | null
          id?: string
          is_active?: boolean | null
          role_attributes?: Json | null
          role_type?: string
          unlocks?: Json | null
          user_id?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at_period_end: boolean | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_period?: string | null
          cancel_at_period_end?: boolean | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: string
          status: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          status?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          achievements: Json | null
          api_token: string | null
          avatar_3d_config: Json | null
          avatar_url: string | null
          badges: string[] | null
          ban_reason: string | null
          banned: boolean | null
          banned_until: string | null
          bio: string | null
          birth_date: string | null
          cover_url: string | null
          created_at: string | null
          creator_bio: string | null
          creator_categories: string[] | null
          creator_handle: string | null
          creator_monetization_enabled: boolean | null
          creator_verified: boolean | null
          date_of_birth: string | null
          dating_enabled: boolean | null
          dating_preferences: Json | null
          digital_assets: Json | null
          display_name: string | null
          email: string | null
          first_name: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string | null
          interests: string[] | null
          is_creator: boolean | null
          last_active: string | null
          last_name: string | null
          level: number | null
          location_city: string | null
          location_country: string | null
          location_timezone: string | null
          phone: string | null
          privacy_settings: Json | null
          stripe_connect_id: string | null
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string | null
          username: string | null
          verified: boolean | null
          vibe_tags: string[] | null
          website: string | null
          xp_points: number | null
        }
        Insert: {
          achievements?: Json | null
          api_token?: string | null
          avatar_3d_config?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_bio?: string | null
          creator_categories?: string[] | null
          creator_handle?: string | null
          creator_monetization_enabled?: boolean | null
          creator_verified?: boolean | null
          date_of_birth?: string | null
          dating_enabled?: boolean | null
          dating_preferences?: Json | null
          digital_assets?: Json | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          interests?: string[] | null
          is_creator?: boolean | null
          last_active?: string | null
          last_name?: string | null
          level?: number | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          vibe_tags?: string[] | null
          website?: string | null
          xp_points?: number | null
        }
        Update: {
          achievements?: Json | null
          api_token?: string | null
          avatar_3d_config?: Json | null
          avatar_url?: string | null
          badges?: string[] | null
          ban_reason?: string | null
          banned?: boolean | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_bio?: string | null
          creator_categories?: string[] | null
          creator_handle?: string | null
          creator_monetization_enabled?: boolean | null
          creator_verified?: boolean | null
          date_of_birth?: string | null
          dating_enabled?: boolean | null
          dating_preferences?: Json | null
          digital_assets?: Json | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          interests?: string[] | null
          is_creator?: boolean | null
          last_active?: string | null
          last_name?: string | null
          level?: number | null
          location_city?: string | null
          location_country?: string | null
          location_timezone?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          stripe_connect_id?: string | null
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          username?: string | null
          verified?: boolean | null
          vibe_tags?: string[] | null
          website?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_ban_user: { Args: { target_user_id: string }; Returns: undefined }
      admin_deactivate_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      cleanup_invalid_tokens: { Args: never; Returns: undefined }
      cleanup_location_history: { Args: never; Returns: undefined }
      decrement_stream_viewers: {
        Args: { stream_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      find_best_matches: {
        Args: {
          p_latitude: number
          p_limit?: number
          p_longitude: number
          p_radius_meters?: number
        }
        Returns: {
          age: number
          avatar_url: string
          bio: string
          distance_meters: number
          full_name: string
          match_score: number
          shared_interests: string[]
          user_id: string
          username: string
        }[]
      }
      find_nearby_activities:
        | {
            Args: { lat: number; lng: number; radius_meters?: number }
            Returns: {
              activity_type: string
              description: string
              distance_meters: number
              id: string
              location_lat: number
              location_lng: number
              start_time: string
              title: string
            }[]
          }
        | {
            Args: {
              p_lat: number
              p_limit?: number
              p_long: number
              p_radius_meters: number
            }
            Returns: {
              activity_type: string
              description: string
              distance_meters: number
              expires_at: string
              id: string
              lat: number
              location_name: string
              long: number
              title: string
            }[]
          }
        | {
            Args: {
              p_limit?: number
              p_location: unknown
              p_radius_meters?: number
            }
            Returns: {
              activity_type: string
              current_attendees: number
              distance_meters: number
              id: string
              is_free: boolean
              start_time: string
              title: string
            }[]
          }
      find_nearby_groups:
        | {
            Args: { p_lat: number; p_long: number; p_radius_meters: number }
            Returns: {
              avatar_url: string
              description: string
              distance_meters: number
              id: string
              lat: number
              long: number
              member_count: number
              name: string
            }[]
          }
        | {
            Args: {
              p_lat: number
              p_limit?: number
              p_long: number
              p_radius_meters: number
            }
            Returns: {
              avatar_url: string
              description: string
              distance_meters: number
              id: string
              lat: number
              long: number
              member_count: number
              name: string
            }[]
          }
      find_nearby_users:
        | {
            Args: { p_lat: number; p_lng: number; p_radius_meters?: number }
            Returns: {
              avatar_url: string | null
              display_name: string | null
              energy_level: number | null
              id: string
              intent_signal: string | null
              lat: number | null
              lng: number | null
              last_seen: string | null
            }[]
          }
        | {
            Args: { p_lat: number; p_long: number; p_radius_meters?: number }
            Returns: {
              avatar_url: string | null
              description: string | null
              id: string
              lat: number | null
              long: number | null
              member_count: number | null
              name: string | null
            }[]
          }
        | {
            Args: {
              lat: number
              lng: number
              radius_meters?: number
            }
            Returns: {
              activity_type: string | null
              description: string | null
              distance_meters: number | null
              id: string
              location_lat: number | null
              location_lng: number | null
              start_time: string | null
              title: string | null
            }[]
          }
        | {
            Args: {
              p_lat: number
              p_lng: number
              p_radius_meters?: number
            }
            Returns: {
              asset_type: string | null
              description: string | null
              id: string
              lat: number | null
              lng: number | null
              metadata: unknown | null
              name: string | null
            }[]
          }
        | {
            Args: {
              p_lat: number
              p_lng: number
              p_radius_meters?: number
            }
            Returns: {
              description: string | null
              drop_type: string | null
              end_time: string | null
              id: string
              lat: number | null
              lng: number | null
              location_name: string | null
              radius: number | null
              start_time: string | null
              title: string | null
            }[]
          }
        | {
            Args: { p_lat: number; p_long: number; p_radius_meters: number; p_limit?: number }
            Returns: {
              activity_type: string | null
              description: string | null
              distance_meters: number | null
              expires_at: string | null
              id: string
              lat: number | null
              long: number | null
              location_name: string | null
              title: string | null
            }[]
          }
      find_random_connection: {
        Args: {
          p_connection_type: string
          p_location: unknown
          p_nearby_only: boolean
          p_radius_km: number
          p_user_id: string
        }
        Returns: string
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      increment_stream_viewers: {
        Args: { stream_id: string }
        Returns: undefined
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_user_location: {
        Args: { lat: number; lng: number }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      content_type: "reel" | "photo" | "text" | "story" | "live"
      moderation_status: "pending" | "approved" | "rejected" | "flagged"
      subscription_tier: "free" | "basic" | "premium" | "creator" | "business"
      user_availability: "available" | "busy" | "invisible" | "do_not_disturb"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_type: ["reel", "photo", "text", "story", "live"],
      moderation_status: ["pending", "approved", "rejected", "flagged"],
      subscription_tier: ["free", "basic", "premium", "creator", "business"],
      user_availability: ["available", "busy", "invisible", "do_not_disturb"],
    },
  },
} as const
