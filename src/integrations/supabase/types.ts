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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_type"]
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          organization_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          billing_cycle: string
          category: string
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          metric_key: string | null
          name: string
          price_minor: number
          quantity_per_unit: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          category?: string
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          metric_key?: string | null
          name: string
          price_minor?: number
          quantity_per_unit?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          category?: string
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          metric_key?: string | null
          name?: string
          price_minor?: number
          quantity_per_unit?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_activity: {
        Row: {
          created_at: string
          id: string
          kind: string
          metadata: Json
          summary: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          summary: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          summary?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          last_message_at: string | null
          metadata: Json
          model: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json
          model?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json
          model?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          model: string | null
          role: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          role?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          body: string
          category: string
          created_at: string
          favorite: boolean
          id: string
          last_used_at: string | null
          title: string
          updated_at: string
          use_count: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          title: string
          updated_at?: string
          use_count?: number
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          title?: string
          updated_at?: string
          use_count?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workflow_runs: {
        Row: {
          approved_at: string | null
          created_at: string
          error: string | null
          executed_at: string | null
          id: string
          input: Json
          latency_ms: number | null
          model: string | null
          preview: Json
          provider: string | null
          result: Json
          retries: number
          scheduled_at: string | null
          status: string
          target: Json
          tokens_in: number | null
          tokens_out: number | null
          trigger_type: string
          undo_data: Json
          updated_at: string
          user_id: string
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          model?: string | null
          preview?: Json
          provider?: string | null
          result?: Json
          retries?: number
          scheduled_at?: string | null
          status?: string
          target?: Json
          tokens_in?: number | null
          tokens_out?: number | null
          trigger_type?: string
          undo_data?: Json
          updated_at?: string
          user_id: string
          workflow_id: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          error?: string | null
          executed_at?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          model?: string | null
          preview?: Json
          provider?: string | null
          result?: Json
          retries?: number
          scheduled_at?: string | null
          status?: string
          target?: Json
          tokens_in?: number | null
          tokens_out?: number | null
          trigger_type?: string
          undo_data?: Json
          updated_at?: string
          user_id?: string
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflow_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_workspace_memory: {
        Row: {
          brand_voice: string | null
          content_preferences: Json
          created_at: string
          design_preferences: Json
          notes: string | null
          preferred_tone: string | null
          target_audience: string | null
          updated_at: string
          updated_by: string | null
          workspace_id: string
        }
        Insert: {
          brand_voice?: string | null
          content_preferences?: Json
          created_at?: string
          design_preferences?: Json
          notes?: string | null
          preferred_tone?: string | null
          target_audience?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id: string
        }
        Update: {
          brand_voice?: string | null
          content_preferences?: Json
          created_at?: string
          design_preferences?: Json
          notes?: string | null
          preferred_tone?: string | null
          target_audience?: string | null
          updated_at?: string
          updated_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workspace_memory_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          bio_page_id: string
          block_id: string | null
          block_type: string | null
          browser: string | null
          campaign_id: string | null
          city: string | null
          click_source: string | null
          country: string | null
          created_at: string
          device_type: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms: number | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: number
          is_bot: boolean
          link_host: string | null
          link_url: string | null
          os: string | null
          qr_source: string | null
          referrer_host: string | null
          referrer_source: string | null
          region: string | null
          scroll_pct: number | null
          session_id: string | null
          timezone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_hash: string
          workspace_id: string
        }
        Insert: {
          bio_page_id: string
          block_id?: string | null
          block_type?: string | null
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          click_source?: string | null
          country?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms?: number | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          is_bot?: boolean
          link_host?: string | null
          link_url?: string | null
          os?: string | null
          qr_source?: string | null
          referrer_host?: string | null
          referrer_source?: string | null
          region?: string | null
          scroll_pct?: number | null
          session_id?: string | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_hash: string
          workspace_id: string
        }
        Update: {
          bio_page_id?: string
          block_id?: string | null
          block_type?: string | null
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          click_source?: string | null
          country?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms?: number | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          is_bot?: boolean
          link_host?: string | null
          link_url?: string | null
          os?: string | null
          qr_source?: string | null
          referrer_host?: string | null
          referrer_source?: string | null
          region?: string | null
          scroll_pct?: number | null
          session_id?: string | null
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          bio_page_id: string
          browser: string | null
          campaign_id: string | null
          city: string | null
          country: string | null
          device_type: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms: number
          engagement_score: number
          entry_url: string | null
          exit_url: string | null
          id: string
          is_bounce: boolean
          is_returning: boolean
          last_seen_at: string
          link_clicks: number
          max_scroll_pct: number
          os: string | null
          page_views: number
          qr_source: string | null
          referrer_host: string | null
          referrer_source: string | null
          region: string | null
          screen_size: string | null
          session_key: string
          started_at: string
          timezone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_hash: string
          workspace_id: string
        }
        Insert: {
          bio_page_id: string
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms?: number
          engagement_score?: number
          entry_url?: string | null
          exit_url?: string | null
          id?: string
          is_bounce?: boolean
          is_returning?: boolean
          last_seen_at?: string
          link_clicks?: number
          max_scroll_pct?: number
          os?: string | null
          page_views?: number
          qr_source?: string | null
          referrer_host?: string | null
          referrer_source?: string | null
          region?: string | null
          screen_size?: string | null
          session_key: string
          started_at?: string
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_hash: string
          workspace_id: string
        }
        Update: {
          bio_page_id?: string
          browser?: string | null
          campaign_id?: string | null
          city?: string | null
          country?: string | null
          device_type?: Database["public"]["Enums"]["analytics_device_type"]
          duration_ms?: number
          engagement_score?: number
          entry_url?: string | null
          exit_url?: string | null
          id?: string
          is_bounce?: boolean
          is_returning?: boolean
          last_seen_at?: string
          link_clicks?: number
          max_scroll_pct?: number
          os?: string | null
          page_views?: number
          qr_source?: string | null
          referrer_host?: string | null
          referrer_source?: string | null
          region?: string | null
          screen_size?: string | null
          session_key?: string
          started_at?: string
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          revoked_at: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          revoked_at?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          revoked_at?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          duration_ms: number
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string | null
          method: string
          request_id: string
          status_code: number
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method: string
          request_id: string
          status_code: number
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          request_id?: string
          status_code?: number
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          organization_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_coupon_redemptions: {
        Row: {
          amount_discounted_minor: number
          coupon_id: string
          created_at: string
          currency: string | null
          id: string
          invoice_id: string | null
          redeemed_at: string
          subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_discounted_minor?: number
          coupon_id: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string | null
          redeemed_at?: string
          subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_discounted_minor?: number
          coupon_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          invoice_id?: string | null
          redeemed_at?: string
          subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "billing_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_coupon_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_coupon_redemptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_coupons: {
        Row: {
          amount_off_minor: number | null
          applies_to_cycles: Database["public"]["Enums"]["billing_cycle"][]
          applies_to_plans: string[]
          archived_at: string | null
          category: string | null
          code: string
          created_at: string
          currency: string | null
          duration: Database["public"]["Enums"]["coupon_duration"]
          duration_in_months: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions: number | null
          metadata: Json
          minimum_purchase_minor: number | null
          name: string | null
          percent_off: number | null
          redeemed_count: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          amount_off_minor?: number | null
          applies_to_cycles?: Database["public"]["Enums"]["billing_cycle"][]
          applies_to_plans?: string[]
          archived_at?: string | null
          category?: string | null
          code: string
          created_at?: string
          currency?: string | null
          duration?: Database["public"]["Enums"]["coupon_duration"]
          duration_in_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          metadata?: Json
          minimum_purchase_minor?: number | null
          name?: string | null
          percent_off?: number | null
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_off_minor?: number | null
          applies_to_cycles?: Database["public"]["Enums"]["billing_cycle"][]
          applies_to_plans?: string[]
          archived_at?: string | null
          category?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          duration?: Database["public"]["Enums"]["coupon_duration"]
          duration_in_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["coupon_kind"]
          max_redemptions?: number | null
          metadata?: Json
          minimum_purchase_minor?: number | null
          name?: string | null
          percent_off?: number | null
          redeemed_count?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          actor_id: string | null
          amount_minor: number | null
          created_at: string
          currency: string | null
          event_type: string
          from_plan: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          subscription_id: string | null
          to_plan: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          amount_minor?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          from_plan?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          subscription_id?: string | null
          to_plan?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          amount_minor?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          from_plan?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          subscription_id?: string | null
          to_plan?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_due_minor: number
          amount_paid_minor: number
          billing_address: Json
          created_at: string
          currency: string
          customer_gstin: string | null
          discount_minor: number
          due_at: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_invoice_id: string | null
          hsn_sac: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          line_items: Json
          metadata: Json
          paid_at: string | null
          pdf_url: string | null
          place_of_supply: string | null
          seller_gstin: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          subtotal_minor: number
          tax_details: Json
          tax_minor: number
          total_minor: number
          updated_at: string
          voided_at: string | null
          workspace_id: string
        }
        Insert: {
          amount_due_minor?: number
          amount_paid_minor?: number
          billing_address?: Json
          created_at?: string
          currency?: string
          customer_gstin?: string | null
          discount_minor?: number
          due_at?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_invoice_id?: string | null
          hsn_sac?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          line_items?: Json
          metadata?: Json
          paid_at?: string | null
          pdf_url?: string | null
          place_of_supply?: string | null
          seller_gstin?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal_minor?: number
          tax_details?: Json
          tax_minor?: number
          total_minor?: number
          updated_at?: string
          voided_at?: string | null
          workspace_id: string
        }
        Update: {
          amount_due_minor?: number
          amount_paid_minor?: number
          billing_address?: Json
          created_at?: string
          currency?: string
          customer_gstin?: string | null
          discount_minor?: number
          due_at?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_invoice_id?: string | null
          hsn_sac?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          line_items?: Json
          metadata?: Json
          paid_at?: string | null
          pdf_url?: string | null
          place_of_supply?: string | null
          seller_gstin?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          subtotal_minor?: number
          tax_details?: Json
          tax_minor?: number
          total_minor?: number
          updated_at?: string
          voided_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount_minor: number
          captured_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_signature: string | null
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          payment_gateway_id: string | null
          payment_order_id: string | null
          receipt_url: string | null
          refund_amount_minor: number
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_minor?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          payment_gateway_id?: string | null
          payment_order_id?: string | null
          receipt_url?: string | null
          refund_amount_minor?: number
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_minor?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_signature?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          payment_gateway_id?: string | null
          payment_order_id?: string | null
          receipt_url?: string | null
          refund_amount_minor?: number
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_custom: boolean
          is_public: boolean
          limits: Json
          metadata: Json
          name: string
          price_lifetime_minor: number | null
          price_monthly_minor: number | null
          price_quarterly_minor: number | null
          price_yearly_minor: number | null
          sort_order: number
          tier: string
          trial_days: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_custom?: boolean
          is_public?: boolean
          limits?: Json
          metadata?: Json
          name: string
          price_lifetime_minor?: number | null
          price_monthly_minor?: number | null
          price_quarterly_minor?: number | null
          price_yearly_minor?: number | null
          sort_order?: number
          tier: string
          trial_days?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_custom?: boolean
          is_public?: boolean
          limits?: Json
          metadata?: Json
          name?: string
          price_lifetime_minor?: number | null
          price_monthly_minor?: number | null
          price_quarterly_minor?: number | null
          price_yearly_minor?: number | null
          sort_order?: number
          tier?: string
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          cycle: Database["public"]["Enums"]["billing_cycle"]
          ended_at: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          id: string
          metadata: Json
          paused_at: string | null
          plan_id: string
          quantity: number
          resumed_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          unit_amount_minor: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          ended_at?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json
          paused_at?: string | null
          plan_id: string
          quantity?: number
          resumed_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_minor?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          cycle?: Database["public"]["Enums"]["billing_cycle"]
          ended_at?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          id?: string
          metadata?: Json
          paused_at?: string | null
          plan_id?: string
          quantity?: number
          resumed_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          unit_amount_minor?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_tax_settings: {
        Row: {
          billing_address: Json
          country: string | null
          created_at: string
          gstin: string | null
          legal_name: string | null
          metadata: Json
          prices_include_tax: boolean
          state: string | null
          tax_rate: number
          tax_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          billing_address?: Json
          country?: string | null
          created_at?: string
          gstin?: string | null
          legal_name?: string | null
          metadata?: Json
          prices_include_tax?: boolean
          state?: string | null
          tax_rate?: number
          tax_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          billing_address?: Json
          country?: string | null
          created_at?: string
          gstin?: string | null
          legal_name?: string | null
          metadata?: Json
          prices_include_tax?: boolean
          state?: string | null
          tax_rate?: number
          tax_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_tax_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_page_publish_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          page_id: string
          version_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          page_id: string
          version_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          page_id?: string
          version_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_page_publish_events_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_page_publish_events_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "bio_page_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_page_publish_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_page_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_publish: boolean
          label: string
          notes: string | null
          page_id: string
          workspace_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_publish?: boolean
          label?: string
          notes?: string | null
          page_id: string
          workspace_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_publish?: boolean
          label?: string
          notes?: string | null
          page_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bio_page_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bio_pages: {
        Row: {
          apple_touch_icon_url: string | null
          archived_at: string | null
          category: string | null
          content: Json
          created_at: string
          deleted_at: string | null
          description: string | null
          favicon_url: string | null
          id: string
          last_saved_at: string | null
          name: string
          owner_id: string
          password_hash: string | null
          published_at: string | null
          published_content: Json | null
          published_version_id: string | null
          qr_settings: Json
          scheduled_publish_at: string | null
          scheduled_unpublish_at: string | null
          seo: Json
          share_settings: Json
          slug: string
          status: Database["public"]["Enums"]["bio_page_status"]
          tracking_overrides: Json
          updated_at: string
          visibility: Database["public"]["Enums"]["bio_page_visibility"]
          workspace_id: string
        }
        Insert: {
          apple_touch_icon_url?: string | null
          archived_at?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          last_saved_at?: string | null
          name: string
          owner_id: string
          password_hash?: string | null
          published_at?: string | null
          published_content?: Json | null
          published_version_id?: string | null
          qr_settings?: Json
          scheduled_publish_at?: string | null
          scheduled_unpublish_at?: string | null
          seo?: Json
          share_settings?: Json
          slug: string
          status?: Database["public"]["Enums"]["bio_page_status"]
          tracking_overrides?: Json
          updated_at?: string
          visibility?: Database["public"]["Enums"]["bio_page_visibility"]
          workspace_id: string
        }
        Update: {
          apple_touch_icon_url?: string | null
          archived_at?: string | null
          category?: string | null
          content?: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          last_saved_at?: string | null
          name?: string
          owner_id?: string
          password_hash?: string | null
          published_at?: string | null
          published_content?: Json | null
          published_version_id?: string | null
          qr_settings?: Json
          scheduled_publish_at?: string | null
          scheduled_unpublish_at?: string | null
          seo?: Json
          share_settings?: Json
          slug?: string
          status?: Database["public"]["Enums"]["bio_page_status"]
          tracking_overrides?: Json
          updated_at?: string
          visibility?: Database["public"]["Enums"]["bio_page_visibility"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bio_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          brand_asset_ids: string[]
          colors: Json
          created_at: string
          created_by: string
          dark_logo_asset_id: string | null
          description: string | null
          favicon_asset_id: string | null
          id: string
          is_default: boolean
          light_logo_asset_id: string | null
          logo_asset_id: string | null
          name: string
          social_share_asset_id: string | null
          typography: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand_asset_ids?: string[]
          colors?: Json
          created_at?: string
          created_by: string
          dark_logo_asset_id?: string | null
          description?: string | null
          favicon_asset_id?: string | null
          id?: string
          is_default?: boolean
          light_logo_asset_id?: string | null
          logo_asset_id?: string | null
          name: string
          social_share_asset_id?: string | null
          typography?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand_asset_ids?: string[]
          colors?: Json
          created_at?: string
          created_by?: string
          dark_logo_asset_id?: string | null
          description?: string | null
          favicon_asset_id?: string | null
          id?: string
          is_default?: boolean
          light_logo_asset_id?: string | null
          logo_asset_id?: string | null
          name?: string
          social_share_asset_id?: string | null
          typography?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_dark_logo_asset_id_fkey"
            columns: ["dark_logo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_favicon_asset_id_fkey"
            columns: ["favicon_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_light_logo_asset_id_fkey"
            columns: ["light_logo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_social_share_asset_id_fkey"
            columns: ["social_share_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_kits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          bio_page_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          name: string
          notes: string | null
          short_code: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_url: string
          updated_at: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
          workspace_id: string
        }
        Insert: {
          bio_page_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          notes?: string | null
          short_code?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_url: string
          updated_at?: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
          workspace_id: string
        }
        Update: {
          bio_page_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          short_code?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_url?: string
          updated_at?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_approvals: {
        Row: {
          agency_workspace_id: string
          client_workspace_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          description: string | null
          entity_ref: Json
          history: Json
          id: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requested_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agency_workspace_id: string
          client_workspace_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          entity_ref?: Json
          history?: Json
          id?: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agency_workspace_id?: string
          client_workspace_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          entity_ref?: Json
          history?: Json
          id?: string
          kind?: Database["public"]["Enums"]["approval_kind"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_approvals_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_approvals_client_workspace_id_fkey"
            columns: ["client_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          agency_workspace_id: string
          assigned_by: string | null
          client_workspace_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["assignment_role"]
          user_id: string
        }
        Insert: {
          agency_workspace_id: string
          assigned_by?: string | null
          client_workspace_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["assignment_role"]
          user_id: string
        }
        Update: {
          agency_workspace_id?: string
          assigned_by?: string | null
          client_workspace_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["assignment_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_assignments_client_workspace_id_fkey"
            columns: ["client_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          agency_workspace_id: string
          author_id: string
          body: string
          client_workspace_id: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          agency_workspace_id: string
          author_id: string
          body: string
          client_workspace_id: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          agency_workspace_id?: string
          author_id?: string
          body?: string
          client_workspace_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_workspace_id_fkey"
            columns: ["client_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          agency_workspace_id: string
          brand_kit: Json
          business_info: Json
          client_workspace_id: string
          created_at: string
          domain_info: Json
          goals: Json
          id: string
          last_active_at: string | null
          monthly_revenue_cents: number
          onboarding_completed: boolean
          onboarding_step: number
          social_accounts: Json
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          agency_workspace_id: string
          brand_kit?: Json
          business_info?: Json
          client_workspace_id: string
          created_at?: string
          domain_info?: Json
          goals?: Json
          id?: string
          last_active_at?: string | null
          monthly_revenue_cents?: number
          onboarding_completed?: boolean
          onboarding_step?: number
          social_accounts?: Json
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          agency_workspace_id?: string
          brand_kit?: Json
          business_info?: Json
          client_workspace_id?: string
          created_at?: string
          domain_info?: Json
          goals?: Json
          id?: string
          last_active_at?: string | null
          monthly_revenue_cents?: number
          onboarding_completed?: boolean
          onboarding_step?: number
          social_accounts?: Json
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_client_workspace_id_fkey"
            columns: ["client_workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          active: boolean
          client_id: string | null
          config: Json
          created_at: string
          id: string
          name: string
          priority: number
          rule_type: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id: string
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          client_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          name: string
          priority?: number
          rule_type?: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          active?: boolean
          client_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          name?: string
          priority?: number
          rule_type?: Database["public"]["Enums"]["commission_rule_type"]
          tenant_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "reseller_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          base_amount_cents: number
          client_id: string | null
          commission_cents: number
          created_at: string
          currency: string
          earned_at: string
          id: string
          invoice_ref: string | null
          metadata: Json
          payout_id: string | null
          rule_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          base_amount_cents?: number
          client_id?: string | null
          commission_cents?: number
          created_at?: string
          currency?: string
          earned_at?: string
          id?: string
          invoice_ref?: string | null
          metadata?: Json
          payout_id?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          base_amount_cents?: number
          client_id?: string | null
          commission_cents?: number
          created_at?: string
          currency?: string
          earned_at?: string
          id?: string
          invoice_ref?: string | null
          metadata?: Json
          payout_id?: string | null
          rule_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "reseller_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_records: {
        Row: {
          created_at: string
          data_retention_days: number
          evidence: Json
          framework: string
          id: string
          last_reviewed_at: string | null
          legal_hold: boolean
          next_review_at: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_retention_days?: number
          evidence?: Json
          framework: string
          id?: string
          last_reviewed_at?: string | null
          legal_hold?: boolean
          next_review_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_retention_days?: number
          evidence?: Json
          framework?: string
          id?: string
          last_reviewed_at?: string | null
          legal_hold?: boolean
          next_review_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          avatar_url: string | null
          connected_at: string
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_used_at: string | null
          metadata: Json
          provider: string
          provider_account_id: string
          scopes: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          provider: string
          provider_account_id: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json
          provider?: string
          provider_account_id?: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connected_apps: {
        Row: {
          app_icon_url: string | null
          app_name: string
          app_slug: string
          connected_at: string
          created_at: string
          id: string
          last_activity_at: string | null
          metadata: Json
          permissions: string[]
          revoked_at: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          app_icon_url?: string | null
          app_name: string
          app_slug: string
          connected_at?: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json
          permissions?: string[]
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          app_icon_url?: string | null
          app_name?: string
          app_slug?: string
          connected_at?: string
          created_at?: string
          id?: string
          last_activity_at?: string | null
          metadata?: Json
          permissions?: string[]
          revoked_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connected_apps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_goals: {
        Row: {
          bio_page_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          goal_type: Database["public"]["Enums"]["conversion_goal_type"]
          id: string
          match_rules: Json
          name: string
          priority: number
          target_value: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          bio_page_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          goal_type: Database["public"]["Enums"]["conversion_goal_type"]
          id?: string
          match_rules?: Json
          name: string
          priority?: number
          target_value?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          bio_page_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          goal_type?: Database["public"]["Enums"]["conversion_goal_type"]
          id?: string
          match_rules?: Json
          name?: string
          priority?: number
          target_value?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_goals_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_goals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          actor_id: string | null
          balance_after: number
          created_at: string
          credit_type: string
          delta: number
          id: string
          metadata: Json
          reason: string
          reference_id: string | null
          reference_type: string | null
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          balance_after: number
          created_at?: string
          credit_type: string
          delta: number
          id?: string
          metadata?: Json
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          balance_after?: number
          created_at?: string
          credit_type?: string
          delta?: number
          id?: string
          metadata?: Json
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      department_members: {
        Row: {
          created_at: string
          department_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          head_user_id: string | null
          id: string
          name: string
          organization_id: string
          parent_id: string | null
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name: string
          organization_id: string
          parent_id?: string | null
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          head_user_id?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_id?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          created_at: string
          host: string
          id: string
          is_primary: boolean
          kind: string
          last_checked_at: string | null
          redirect_to: string | null
          redirect_type: string
          ssl_status: string
          status: string
          target_page_id: string | null
          updated_at: string
          verification_method: string
          verification_token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          host: string
          id?: string
          is_primary?: boolean
          kind?: string
          last_checked_at?: string | null
          redirect_to?: string | null
          redirect_type?: string
          ssl_status?: string
          status?: string
          target_page_id?: string | null
          updated_at?: string
          verification_method?: string
          verification_token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          host?: string
          id?: string
          is_primary?: boolean
          kind?: string
          last_checked_at?: string | null
          redirect_to?: string | null
          redirect_type?: string
          ssl_status?: string
          status?: string
          target_page_id?: string | null
          updated_at?: string
          verification_method?: string
          verification_token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_target_page_id_fkey"
            columns: ["target_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          key: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      governance_policies: {
        Row: {
          allowed_domains: string[]
          api_access_enabled: boolean
          api_ip_allowlist: string[]
          created_at: string
          id: string
          mfa_required: boolean
          organization_id: string
          password_min_length: number
          password_require_numbers: boolean
          password_require_symbols: boolean
          publishing_requires_approval: boolean
          session_timeout_minutes: number
          updated_at: string
          updated_by: string | null
          workspace_creation_role: string
        }
        Insert: {
          allowed_domains?: string[]
          api_access_enabled?: boolean
          api_ip_allowlist?: string[]
          created_at?: string
          id?: string
          mfa_required?: boolean
          organization_id: string
          password_min_length?: number
          password_require_numbers?: boolean
          password_require_symbols?: boolean
          publishing_requires_approval?: boolean
          session_timeout_minutes?: number
          updated_at?: string
          updated_by?: string | null
          workspace_creation_role?: string
        }
        Update: {
          allowed_domains?: string[]
          api_access_enabled?: boolean
          api_ip_allowlist?: string[]
          created_at?: string
          id?: string
          mfa_required?: boolean
          organization_id?: string
          password_min_length?: number
          password_require_numbers?: boolean
          password_require_symbols?: boolean
          publishing_requires_approval?: boolean
          session_timeout_minutes?: number
          updated_at?: string
          updated_by?: string | null
          workspace_creation_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_engine_settings: {
        Row: {
          accent_color: string
          badge_subtext: string
          badge_text: string
          dynamic_industry_cta_enabled: boolean
          floating_badge_enabled: boolean
          footer_cta_enabled: boolean
          footer_cta_label: string
          footer_headline: string
          footer_subtext: string
          id: string
          og_branding_enabled: boolean
          qr_branding_enabled: boolean
          redirect_url: string
          referral_cta_enabled: boolean
          referral_cta_label: string
          referral_headline: string
          referral_subtext: string
          updated_at: string
          upgrade_card_enabled: boolean
        }
        Insert: {
          accent_color?: string
          badge_subtext?: string
          badge_text?: string
          dynamic_industry_cta_enabled?: boolean
          floating_badge_enabled?: boolean
          footer_cta_enabled?: boolean
          footer_cta_label?: string
          footer_headline?: string
          footer_subtext?: string
          id?: string
          og_branding_enabled?: boolean
          qr_branding_enabled?: boolean
          redirect_url?: string
          referral_cta_enabled?: boolean
          referral_cta_label?: string
          referral_headline?: string
          referral_subtext?: string
          updated_at?: string
          upgrade_card_enabled?: boolean
        }
        Update: {
          accent_color?: string
          badge_subtext?: string
          badge_text?: string
          dynamic_industry_cta_enabled?: boolean
          floating_badge_enabled?: boolean
          footer_cta_enabled?: boolean
          footer_cta_label?: string
          footer_headline?: string
          footer_subtext?: string
          id?: string
          og_branding_enabled?: boolean
          qr_branding_enabled?: boolean
          redirect_url?: string
          referral_cta_enabled?: boolean
          referral_cta_label?: string
          referral_headline?: string
          referral_subtext?: string
          updated_at?: string
          upgrade_card_enabled?: boolean
        }
        Relationships: []
      }
      html_library: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string
          created_by: string
          css: string
          description: string | null
          html: string
          id: string
          js: string
          name: string
          page_id: string | null
          preset_key: string | null
          scope: string
          theme_key: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          css?: string
          description?: string | null
          html?: string
          id?: string
          js?: string
          name: string
          page_id?: string | null
          preset_key?: string | null
          scope?: string
          theme_key?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          css?: string
          description?: string | null
          html?: string
          id?: string
          js?: string
          name?: string
          page_id?: string | null
          preset_key?: string | null
          scope?: string
          theme_key?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "html_library_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string | null
          role: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id?: string | null
          role: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string | null
          role?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      license_seats: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignee_type: string
          id: string
          license_id: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignee_type: string
          id?: string
          license_id: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignee_type?: string
          id?: string
          license_id?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_seats_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_seats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          auto_renew: boolean
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          seat_type: string
          starts_at: string
          status: string
          tier: string
          total_seats: number
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          seat_type?: string
          starts_at?: string
          status?: string
          tier?: string
          total_seats?: number
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          seat_type?: string
          starts_at?: string
          status?: string
          tier?: string
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          location: Json | null
          os: string | null
          provider: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          location?: Json | null
          os?: string | null
          provider?: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          location?: Json | null
          os?: string | null
          provider?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      manual_upi_submissions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["manual_upi_status"]
          submitted_by: string
          txn_ref: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["manual_upi_status"]
          submitted_by: string
          txn_ref?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["manual_upi_status"]
          submitted_by?: string
          txn_ref?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_upi_submissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_upi_submissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_asset_versions: {
        Row: {
          asset: Json
          asset_id: string
          changelog: string | null
          created_at: string
          id: string
          published_at: string | null
          tenant_id: string
          version: string
        }
        Insert: {
          asset?: Json
          asset_id: string
          changelog?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          tenant_id: string
          version: string
        }
        Update: {
          asset?: Json
          asset_id?: string
          changelog?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          tenant_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_asset_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "marketplace_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_asset_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_assets: {
        Row: {
          asset: Json
          category_key: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          downloads: number
          featured: boolean
          id: string
          kind: Database["public"]["Enums"]["marketplace_asset_kind"]
          metadata: Json
          preview_url: string | null
          price_cents: number
          published_at: string | null
          rating: number
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["marketplace_asset_status"]
          tags: string[]
          tenant_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          asset?: Json
          category_key?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          downloads?: number
          featured?: boolean
          id?: string
          kind: Database["public"]["Enums"]["marketplace_asset_kind"]
          metadata?: Json
          preview_url?: string | null
          price_cents?: number
          published_at?: string | null
          rating?: number
          review_count?: number
          slug: string
          status?: Database["public"]["Enums"]["marketplace_asset_status"]
          tags?: string[]
          tenant_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          asset?: Json
          category_key?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          downloads?: number
          featured?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["marketplace_asset_kind"]
          metadata?: Json
          preview_url?: string | null
          price_cents?: number
          published_at?: string | null
          rating?: number
          review_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["marketplace_asset_status"]
          tags?: string[]
          tenant_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          kind: Database["public"]["Enums"]["marketplace_asset_kind"]
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          kind: Database["public"]["Enums"]["marketplace_asset_kind"]
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          kind?: Database["public"]["Enums"]["marketplace_asset_kind"]
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "marketplace_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_asset_versions: {
        Row: {
          asset_id: string
          bucket: string
          created_at: string
          created_by: string | null
          file_name: string | null
          height: number | null
          id: string
          mime_type: string | null
          notes: string | null
          path: string
          sha256: string | null
          size_bytes: number | null
          version_number: number
          width: number | null
          workspace_id: string
        }
        Insert: {
          asset_id: string
          bucket: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          path: string
          sha256?: string | null
          size_bytes?: number | null
          version_number: number
          width?: number | null
          workspace_id: string
        }
        Update: {
          asset_id?: string
          bucket?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          path?: string
          sha256?: string | null
          size_bytes?: number | null
          version_number?: number
          width?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_versions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          archived_at: string | null
          blurhash: string | null
          bucket: string
          created_at: string
          current_version: number
          deleted_at: string | null
          duration_seconds: number | null
          file_name: string | null
          folder_id: string | null
          health_score: number | null
          height: number | null
          id: string
          is_favorite: boolean
          kind: Database["public"]["Enums"]["media_kind"]
          last_used_at: string | null
          last_viewed_at: string | null
          metadata: Json
          mime_type: string | null
          optimized_size_bytes: number | null
          original_size_bytes: number | null
          owner_id: string
          path: string
          processed_at: string | null
          processing_error: string | null
          processing_status: Database["public"]["Enums"]["media_processing_status"]
          sha256: string | null
          size_bytes: number | null
          tags: string[]
          thumbnail_path: string | null
          updated_at: string
          usage_count: number
          variants: Json
          video_thumbnail_path: string | null
          view_count: number
          width: number | null
          workspace_id: string | null
        }
        Insert: {
          alt_text?: string | null
          archived_at?: string | null
          blurhash?: string | null
          bucket: string
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          folder_id?: string | null
          health_score?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          last_used_at?: string | null
          last_viewed_at?: string | null
          metadata?: Json
          mime_type?: string | null
          optimized_size_bytes?: number | null
          original_size_bytes?: number | null
          owner_id: string
          path: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["media_processing_status"]
          sha256?: string | null
          size_bytes?: number | null
          tags?: string[]
          thumbnail_path?: string | null
          updated_at?: string
          usage_count?: number
          variants?: Json
          video_thumbnail_path?: string | null
          view_count?: number
          width?: number | null
          workspace_id?: string | null
        }
        Update: {
          alt_text?: string | null
          archived_at?: string | null
          blurhash?: string | null
          bucket?: string
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          folder_id?: string | null
          health_score?: number | null
          height?: number | null
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["media_kind"]
          last_used_at?: string | null
          last_viewed_at?: string | null
          metadata?: Json
          mime_type?: string | null
          optimized_size_bytes?: number | null
          original_size_bytes?: number | null
          owner_id?: string
          path?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: Database["public"]["Enums"]["media_processing_status"]
          sha256?: string | null
          size_bytes?: number | null
          tags?: string[]
          thumbnail_path?: string | null
          updated_at?: string
          usage_count?: number
          variants?: Json
          video_thumbnail_path?: string | null
          view_count?: number
          width?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collection_items: {
        Row: {
          added_by: string | null
          asset_id: string
          collection_id: string
          created_at: string
          position: number
        }
        Insert: {
          added_by?: string | null
          asset_id: string
          collection_id: string
          created_at?: string
          position?: number
        }
        Update: {
          added_by?: string | null
          asset_id?: string
          collection_id?: string
          created_at?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "media_collection_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "media_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      media_collections: {
        Row: {
          cover_asset_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_favorite: boolean
          kind: Database["public"]["Enums"]["media_collection_kind"]
          name: string
          rules: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cover_asset_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["media_collection_kind"]
          name: string
          rules?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cover_asset_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          kind?: Database["public"]["Enums"]["media_collection_kind"]
          name?: string
          rules?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_collections_cover_asset_id_fkey"
            columns: ["cover_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_collections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_id: string | null
          path: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
          path?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
          path?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_tags: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          is_auto: boolean
          name: string
          updated_at: string
          usage_count: number
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_auto?: boolean
          name: string
          updated_at?: string
          usage_count?: number
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_auto?: boolean
          name?: string
          updated_at?: string
          usage_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_usages: {
        Row: {
          asset_id: string
          bio_page_id: string | null
          block_id: string | null
          context: string | null
          created_at: string
          id: string
          workspace_id: string
        }
        Insert: {
          asset_id: string
          bio_page_id?: string | null
          block_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          workspace_id: string
        }
        Update: {
          asset_id?: string
          bio_page_id?: string | null
          block_id?: string | null
          context?: string | null
          created_at?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_usages_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_usages_bio_page_id_fkey"
            columns: ["bio_page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_usages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_system: boolean
          key: string
          name: string
          subject: string | null
          updated_at: string
          variables: Json
          workspace_id: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          is_system?: boolean
          key: string
          name: string
          subject?: string | null
          updated_at?: string
          variables?: Json
          workspace_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          subject?: string | null
          updated_at?: string
          variables?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: Database["public"]["Enums"]["notification_type"]
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled: boolean
          id: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["notification_type"]
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          id?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["notification_type"]
          channel?: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          branding: Json
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["org_plan"]
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          branding?: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["org_plan"]
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          branding?: Json
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ownership_transfers: {
        Row: {
          accepted_at: string | null
          canceled_at: string | null
          created_at: string
          expires_at: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          canceled_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          canceled_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_transfers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_admin_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_admin_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          due_at: string | null
          id: string
          issued_at: string
          line_items: Json
          metadata: Json
          number: string
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["partner_invoice_status"]
          subscription_id: string | null
          tax_cents: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string
          line_items?: Json
          metadata?: Json
          number: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["partner_invoice_status"]
          subscription_id?: string | null
          tax_cents?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_at?: string | null
          id?: string
          issued_at?: string
          line_items?: Json
          metadata?: Json
          number?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["partner_invoice_status"]
          subscription_id?: string | null
          tax_cents?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          metadata: Json
          method: string | null
          paid_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["partner_payment_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          paid_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["partner_payment_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          method?: string | null
          paid_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["partner_payment_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "partner_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_promotions: {
        Row: {
          applies_to: Json
          campaign_key: string | null
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["promotion_discount_type"]
          discount_value: number
          ends_at: string | null
          id: string
          max_redemptions: number | null
          name: string
          redemptions: number
          starts_at: string | null
          status: Database["public"]["Enums"]["promotion_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applies_to?: Json
          campaign_key?: string | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["promotion_discount_type"]
          discount_value?: number
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          name: string
          redemptions?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applies_to?: Json
          campaign_key?: string | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["promotion_discount_type"]
          discount_value?: number
          ends_at?: string | null
          id?: string
          max_redemptions?: number | null
          name?: string
          redemptions?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_promotions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscriptions: {
        Row: {
          billing_interval: string
          cancelled_at: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          outstanding_cents: number
          plan_key: string
          price_cents: number
          renewal_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["partner_subscription_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          outstanding_cents?: number
          plan_key: string
          price_cents?: number
          renewal_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["partner_subscription_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          outstanding_cents?: number
          plan_key?: string
          price_cents?: number
          renewal_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["partner_subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          config: Json
          created_at: string
          credentials: Json
          display_name: string
          enabled: boolean
          health_checked_at: string | null
          health_message: string | null
          health_status: string
          id: string
          mode: Database["public"]["Enums"]["payment_mode"]
          priority: number
          provider: Database["public"]["Enums"]["payment_provider"]
          updated_at: string
          webhook_secret: string | null
          workspace_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          credentials?: Json
          display_name: string
          enabled?: boolean
          health_checked_at?: string | null
          health_message?: string | null
          health_status?: string
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"]
          priority?: number
          provider: Database["public"]["Enums"]["payment_provider"]
          updated_at?: string
          webhook_secret?: string | null
          workspace_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          credentials?: Json
          display_name?: string
          enabled?: boolean
          health_checked_at?: string | null
          health_message?: string | null
          health_status?: string
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"]
          priority?: number
          provider?: Database["public"]["Enums"]["payment_provider"]
          updated_at?: string
          webhook_secret?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          gateway_id: string | null
          id: string
          idempotency_key: string
          meta: Json
          plan_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_order_id: string | null
          status: Database["public"]["Enums"]["payment_order_status"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          gateway_id?: string | null
          id?: string
          idempotency_key: string
          meta?: Json
          plan_id?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          gateway_id?: string | null
          id?: string
          idempotency_key?: string
          meta?: Json
          plan_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_order_id?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string | null
          id: string
          order_id: string | null
          payload: Json
          processed_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string | null
          id?: string
          order_id?: string | null
          payload: Json
          processed_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          method: string | null
          notes: string | null
          paid_at: string | null
          processed_at: string | null
          reference: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          processed_at?: string | null
          reference?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          processed_at?: string | null
          reference?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string
          key: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          key: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          key?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string
          id: string
          is_unlimited: boolean
          limit_value: number
          metric_key: string
          plan_id: string
          soft_limit: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_unlimited?: boolean
          limit_value?: number
          metric_key: string
          plan_id: string
          soft_limit?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_unlimited?: boolean
          limit_value?: number
          metric_key?: string
          plan_id?: string
          soft_limit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          note: string | null
          plan_code: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          note?: string | null
          plan_code: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          note?: string | null
          plan_code?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_waitlist_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          active_workspace_id: string | null
          avatar_url: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string
          id: string
          language: string | null
          last_login_at: string | null
          mfa_enabled: boolean
          onboarding_completed: boolean
          phone: string | null
          recovery_email: string | null
          recovery_phone: string | null
          security_alerts_enabled: boolean
          status: Database["public"]["Enums"]["account_status"]
          subscription_tier: string
          timezone: string | null
          updated_at: string
          username: string | null
          workspace_last_active: Json
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          active_workspace_id?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email: string
          id: string
          language?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          recovery_email?: string | null
          recovery_phone?: string | null
          security_alerts_enabled?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          workspace_last_active?: Json
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          active_workspace_id?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          language?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean
          onboarding_completed?: boolean
          phone?: string | null
          recovery_email?: string | null
          recovery_phone?: string | null
          security_alerts_enabled?: boolean
          status?: Database["public"]["Enums"]["account_status"]
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          workspace_last_active?: Json
        }
        Relationships: []
      }
      qr_designs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_favorite: boolean
          name: string
          page_id: string
          settings: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          name: string
          page_id: string
          settings?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          page_id?: string
          settings?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_designs_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "bio_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_designs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_client_notes: {
        Row: {
          author_id: string | null
          body: string
          client_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reseller_note_kind"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          client_id: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reseller_note_kind"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reseller_note_kind"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "reseller_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_client_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_clients: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          assigned_staff_id: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          id: string
          metadata: Json
          plan_key: string | null
          priority: Database["public"]["Enums"]["reseller_priority"]
          status: Database["public"]["Enums"]["reseller_client_status"]
          subscription_expires_at: string | null
          support_status: Database["public"]["Enums"]["reseller_support_status"]
          suspended_at: string | null
          tags: string[]
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
          usage: Json
          workspace_id: string | null
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          assigned_staff_id?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          id?: string
          metadata?: Json
          plan_key?: string | null
          priority?: Database["public"]["Enums"]["reseller_priority"]
          status?: Database["public"]["Enums"]["reseller_client_status"]
          subscription_expires_at?: string | null
          support_status?: Database["public"]["Enums"]["reseller_support_status"]
          suspended_at?: string | null
          tags?: string[]
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
          usage?: Json
          workspace_id?: string | null
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          assigned_staff_id?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          id?: string
          metadata?: Json
          plan_key?: string | null
          priority?: Database["public"]["Enums"]["reseller_priority"]
          status?: Database["public"]["Enums"]["reseller_client_status"]
          subscription_expires_at?: string | null
          support_status?: Database["public"]["Enums"]["reseller_support_status"]
          suspended_at?: string | null
          tags?: string[]
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          usage?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reseller_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseller_clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reseller_team_members: {
        Row: {
          created_at: string
          custom_role_key: string | null
          id: string
          role: Database["public"]["Enums"]["reseller_team_role"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_key?: string | null
          id?: string
          role?: Database["public"]["Enums"]["reseller_team_role"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_key?: string | null
          id?: string
          role?: Database["public"]["Enums"]["reseller_team_role"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reseller_team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["workspace_role"]
        }
        Insert: {
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["workspace_role"]
        }
        Update: {
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["workspace_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      security_alerts: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string | null
          metadata: Json
          read_at: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          read_at?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json
          read_at?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_resources: {
        Row: {
          agency_workspace_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          payload: Json
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          agency_workspace_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["shared_resource_kind"]
          payload?: Json
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          agency_workspace_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["shared_resource_kind"]
          payload?: Json
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_resources_agency_workspace_id_fkey"
            columns: ["agency_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_configurations: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          domain_allowlist: string[] | null
          entity_id: string | null
          id: string
          metadata_url: string | null
          protocol: string
          provider_name: string
          role_mappings: Json
          scim_enabled: boolean
          scim_token_hash: string | null
          sso_url: string | null
          status: string
          updated_at: string
          workspace_id: string
          x509_cert: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          domain_allowlist?: string[] | null
          entity_id?: string | null
          id?: string
          metadata_url?: string | null
          protocol: string
          provider_name: string
          role_mappings?: Json
          scim_enabled?: boolean
          scim_token_hash?: string | null
          sso_url?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
          x509_cert?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          domain_allowlist?: string[] | null
          entity_id?: string | null
          id?: string
          metadata_url?: string | null
          protocol?: string
          provider_name?: string
          role_mappings?: Json
          scim_enabled?: boolean
          scim_token_hash?: string | null
          sso_url?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
          x509_cert?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_configurations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_change_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_plan_code: string | null
          from_status: string | null
          id: string
          metadata: Json
          subscription_id: string | null
          to_plan_code: string | null
          to_status: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_plan_code?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json
          subscription_id?: string | null
          to_plan_code?: string | null
          to_status?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_plan_code?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json
          subscription_id?: string | null
          to_plan_code?: string | null
          to_status?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_change_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_change_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string
          custom_login_url: string | null
          dns_records: Json
          health: Json
          host: string
          http_redirect_ok: boolean
          id: string
          is_primary: boolean
          is_wildcard: boolean
          kind: Database["public"]["Enums"]["tenant_domain_kind"]
          last_checked_at: string | null
          notes: string | null
          propagation_status: string
          ssl_expires_at: string | null
          ssl_issuer: string | null
          ssl_last_error: string | null
          ssl_status: Database["public"]["Enums"]["ssl_status"]
          status: Database["public"]["Enums"]["tenant_domain_status"]
          tenant_id: string
          updated_at: string
          verification_token: string
          www_redirect_ok: boolean
        }
        Insert: {
          created_at?: string
          custom_login_url?: string | null
          dns_records?: Json
          health?: Json
          host: string
          http_redirect_ok?: boolean
          id?: string
          is_primary?: boolean
          is_wildcard?: boolean
          kind?: Database["public"]["Enums"]["tenant_domain_kind"]
          last_checked_at?: string | null
          notes?: string | null
          propagation_status?: string
          ssl_expires_at?: string | null
          ssl_issuer?: string | null
          ssl_last_error?: string | null
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["tenant_domain_status"]
          tenant_id: string
          updated_at?: string
          verification_token?: string
          www_redirect_ok?: boolean
        }
        Update: {
          created_at?: string
          custom_login_url?: string | null
          dns_records?: Json
          health?: Json
          host?: string
          http_redirect_ok?: boolean
          id?: string
          is_primary?: boolean
          is_wildcard?: boolean
          kind?: Database["public"]["Enums"]["tenant_domain_kind"]
          last_checked_at?: string | null
          notes?: string | null
          propagation_status?: string
          ssl_expires_at?: string | null
          ssl_issuer?: string | null
          ssl_last_error?: string | null
          ssl_status?: Database["public"]["Enums"]["ssl_status"]
          status?: Database["public"]["Enums"]["tenant_domain_status"]
          tenant_id?: string
          updated_at?: string
          verification_token?: string
          www_redirect_ok?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_infra_alerts: {
        Row: {
          category: string
          created_at: string
          details: Json
          domain_id: string | null
          id: string
          message: string
          resolved: boolean
          resolved_at: string | null
          severity: string
          tenant_id: string
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json
          domain_id?: string | null
          id?: string
          message: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          tenant_id: string
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json
          domain_id?: string | null
          id?: string
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_infra_alerts_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "tenant_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_infra_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_member_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_smtp_configs: {
        Row: {
          created_at: string
          footer_html: string | null
          host: string
          id: string
          last_error: string | null
          last_verified_at: string | null
          logo_url: string | null
          password_ciphertext: string | null
          port: number
          provider: string
          reply_to: string | null
          secure: boolean
          sender_email: string
          sender_name: string | null
          status: string
          tenant_id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          footer_html?: string | null
          host: string
          id?: string
          last_error?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          password_ciphertext?: string | null
          port?: number
          provider?: string
          reply_to?: string | null
          secure?: boolean
          sender_email: string
          sender_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          footer_html?: string | null
          host?: string
          id?: string
          last_error?: string | null
          last_verified_at?: string | null
          logo_url?: string | null
          password_ciphertext?: string | null
          port?: number
          provider?: string
          reply_to?: string | null
          secure?: boolean
          sender_email?: string
          sender_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_smtp_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ai_credit_limit: number
          archived_at: string | null
          billing_settings: Json
          brand_kit: Json
          company_name: string
          created_at: string
          default_commission_type: Database["public"]["Enums"]["commission_rule_type"]
          default_commission_value: number
          email_footer_html: string | null
          email_logo_url: string | null
          email_reply_to: string | null
          email_sender_email: string | null
          email_sender_name: string | null
          email_signature: string | null
          favicon_url: string | null
          feature_flags: Json
          forgot_enabled: boolean
          hide_default_branding: boolean
          hide_developer_links: boolean
          hide_powered_by: boolean
          hide_zupix_logo: boolean
          id: string
          loading_screen: Json
          login_background_url: string | null
          login_footer_html: string | null
          login_headline: string | null
          login_subheadline: string | null
          logo_dark_url: string | null
          logo_url: string | null
          owner_id: string
          partner_status: Database["public"]["Enums"]["partner_status"]
          payout_details: Json
          payout_method: string | null
          primary_color: string | null
          register_enabled: boolean
          secondary_color: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          storage_limit_mb: number
          typography: Json
          updated_at: string
          workspace_limit: number
        }
        Insert: {
          ai_credit_limit?: number
          archived_at?: string | null
          billing_settings?: Json
          brand_kit?: Json
          company_name: string
          created_at?: string
          default_commission_type?: Database["public"]["Enums"]["commission_rule_type"]
          default_commission_value?: number
          email_footer_html?: string | null
          email_logo_url?: string | null
          email_reply_to?: string | null
          email_sender_email?: string | null
          email_sender_name?: string | null
          email_signature?: string | null
          favicon_url?: string | null
          feature_flags?: Json
          forgot_enabled?: boolean
          hide_default_branding?: boolean
          hide_developer_links?: boolean
          hide_powered_by?: boolean
          hide_zupix_logo?: boolean
          id?: string
          loading_screen?: Json
          login_background_url?: string | null
          login_footer_html?: string | null
          login_headline?: string | null
          login_subheadline?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          owner_id: string
          partner_status?: Database["public"]["Enums"]["partner_status"]
          payout_details?: Json
          payout_method?: string | null
          primary_color?: string | null
          register_enabled?: boolean
          secondary_color?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          storage_limit_mb?: number
          typography?: Json
          updated_at?: string
          workspace_limit?: number
        }
        Update: {
          ai_credit_limit?: number
          archived_at?: string | null
          billing_settings?: Json
          brand_kit?: Json
          company_name?: string
          created_at?: string
          default_commission_type?: Database["public"]["Enums"]["commission_rule_type"]
          default_commission_value?: number
          email_footer_html?: string | null
          email_logo_url?: string | null
          email_reply_to?: string | null
          email_sender_email?: string | null
          email_sender_name?: string | null
          email_signature?: string | null
          favicon_url?: string | null
          feature_flags?: Json
          forgot_enabled?: boolean
          hide_default_branding?: boolean
          hide_developer_links?: boolean
          hide_powered_by?: boolean
          hide_zupix_logo?: boolean
          id?: string
          loading_screen?: Json
          login_background_url?: string | null
          login_footer_html?: string | null
          login_headline?: string | null
          login_subheadline?: string | null
          logo_dark_url?: string | null
          logo_url?: string | null
          owner_id?: string
          partner_status?: Database["public"]["Enums"]["partner_status"]
          payout_details?: Json
          payout_method?: string | null
          primary_color?: string | null
          register_enabled?: boolean
          secondary_color?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          storage_limit_mb?: number
          typography?: Json
          updated_at?: string
          workspace_limit?: number
        }
        Relationships: []
      }
      trial_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_extensions: {
        Row: {
          created_at: string
          extended_days: number
          granted_by: string | null
          id: string
          new_trial_end: string
          reason: string | null
          subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          extended_days: number
          granted_by?: string | null
          id?: string
          new_trial_end: string
          reason?: string | null
          subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          extended_days?: number
          granted_by?: string | null
          id?: string
          new_trial_end?: string
          reason?: string | null
          subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_extensions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_extensions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_fingerprints: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          kind: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          kind: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          kind?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_fingerprints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_events: {
        Row: {
          amount_minor: number | null
          coupon_code: string | null
          created_at: string
          from_plan: string | null
          id: string
          metadata: Json
          source: string | null
          to_plan: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          amount_minor?: number | null
          coupon_code?: string | null
          created_at?: string
          from_plan?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          to_plan: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          amount_minor?: number | null
          coupon_code?: string | null
          created_at?: string
          from_plan?: string | null
          id?: string
          metadata?: Json
          source?: string | null
          to_plan?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          id: string
          metric_key: string
          period_end: string
          period_start: string
          updated_at: string
          value: number
          workspace_id: string
        }
        Insert: {
          id?: string
          metric_key: string
          period_end?: string
          period_start?: string
          updated_at?: string
          value?: number
          workspace_id: string
        }
        Update: {
          id?: string
          metric_key?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          value?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          id: string
          last_seen_at: string
          name: string | null
          os: string | null
          push_token: string | null
          trusted: boolean
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          last_seen_at?: string
          name?: string | null
          os?: string | null
          push_token?: string | null
          trusted?: boolean
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          last_seen_at?: string
          name?: string | null
          os?: string | null
          push_token?: string | null
          trusted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          date_format: string
          language: string
          marketing_emails: boolean
          notification_preferences: Json
          privacy_preferences: Json
          theme: string
          time_format: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_format?: string
          language?: string
          marketing_emails?: boolean
          notification_preferences?: Json
          privacy_preferences?: Json
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_format?: string
          language?: string
          marketing_emails?: boolean
          notification_preferences?: Json
          privacy_preferences?: Json
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          ip_address: unknown
          last_active_at: string
          location: Json | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string
          location?: Json | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: unknown
          last_active_at?: string
          location?: Json | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          status: string
          status_code: number | null
          webhook_id: string
          workspace_id: string
        }
        Insert: {
          attempt?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id: string
          workspace_id: string
        }
        Update: {
          attempt?: number
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string
          status_code?: number | null
          webhook_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          created_by: string
          events: string[]
          failure_count: number
          headers: Json
          id: string
          last_delivery_at: string | null
          last_status_code: number | null
          name: string
          secret: string
          status: string
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          events?: string[]
          failure_count?: number
          headers?: Json
          id?: string
          last_delivery_at?: string | null
          last_status_code?: number | null
          name: string
          secret: string
          status?: string
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          events?: string[]
          failure_count?: number
          headers?: Json
          id?: string
          last_delivery_at?: string | null
          last_status_code?: number | null
          name?: string
          secret?: string
          status?: string
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_addons: {
        Row: {
          addon_id: string
          created_at: string
          ends_at: string | null
          gateway: string | null
          gateway_reference: string | null
          id: string
          metadata: Json
          quantity: number
          starts_at: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          ends_at?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          quantity?: number
          starts_at?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          ends_at?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          id?: string
          metadata?: Json
          quantity?: number
          starts_at?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_addons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_communications: {
        Row: {
          created_at: string
          health: Json
          notifications: Json
          providers: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          health?: Json
          notifications?: Json
          providers?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          health?: Json
          notifications?: Json
          providers?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_communications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_custom_roles: {
        Row: {
          base_role: Database["public"]["Enums"]["workspace_role"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          permissions: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          base_role?: Database["public"]["Enums"]["workspace_role"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          permissions?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          base_role?: Database["public"]["Enums"]["workspace_role"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          permissions?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_custom_roles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          created_by: string | null
          credentials: Json
          display_name: string
          enabled: boolean
          environment: string
          health_message: string | null
          health_status: string
          id: string
          last_tested_at: string | null
          provider_key: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials?: Json
          display_name: string
          enabled?: boolean
          environment?: string
          health_message?: string | null
          health_status?: string
          id?: string
          last_tested_at?: string | null
          provider_key: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          credentials?: Json
          display_name?: string
          enabled?: boolean
          environment?: string
          health_message?: string | null
          health_status?: string
          id?: string
          last_tested_at?: string | null
          provider_key?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          custom_role_key: string | null
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: string
          suspended_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          custom_role_key?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: string
          suspended_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          custom_role_key?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: string
          suspended_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_role_permissions: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          permission_key: string
          role_key: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key: string
          role_key: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          permission_key?: string
          role_key?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_role_permissions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          allow_custom_js: boolean
          brand_name: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          description: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
          owner_id: string
          parent_agency_id: string | null
          settings: Json
          slug: string
          social_image_url: string | null
          subdomain: string | null
          tracking_settings: Json
          trash_retention_days: number
          updated_at: string
          workspace_type: Database["public"]["Enums"]["workspace_type"]
        }
        Insert: {
          allow_custom_js?: boolean
          brand_name?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          owner_id: string
          parent_agency_id?: string | null
          settings?: Json
          slug: string
          social_image_url?: string | null
          subdomain?: string | null
          tracking_settings?: Json
          trash_retention_days?: number
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["workspace_type"]
        }
        Update: {
          allow_custom_js?: boolean
          brand_name?: string | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          parent_agency_id?: string | null
          settings?: Json
          slug?: string
          social_image_url?: string | null
          subdomain?: string | null
          tracking_settings?: Json
          trash_retention_days?: number
          updated_at?: string
          workspace_type?: Database["public"]["Enums"]["workspace_type"]
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_parent_agency_id_fkey"
            columns: ["parent_agency_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_personal_workspace: {
        Args: never
        Returns: {
          allow_custom_js: boolean
          brand_name: string | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          description: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
          owner_id: string
          parent_agency_id: string | null
          settings: Json
          slug: string
          social_image_url: string | null
          subdomain: string | null
          tracking_settings: Json
          trash_retention_days: number
          updated_at: string
          workspace_type: Database["public"]["Enums"]["workspace_type"]
        }
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_tejas_trial: { Args: { _workspace_id: string }; Returns: Json }
      expire_stale_trials: { Args: never; Returns: number }
      get_public_tracking: { Args: { _workspace_id: string }; Returns: Json }
      has_pending_workspace_invitation: {
        Args: {
          _custom_role_key: string
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_permission: {
        Args: { _permission: string; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_agency_admin: {
        Args: { _agency_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_reserved_username: { Args: { _username: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      next_invoice_number: { Args: never; Returns: string }
      org_role_of: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      public_workspace_plan: {
        Args: { _workspace_id: string }
        Returns: string
      }
      user_owns_workspace: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          _amount_minor: number
          _code: string
          _cycle: string
          _plan_code: string
          _workspace_id: string
        }
        Returns: {
          coupon_id: string
          discount_minor: number
          reason: string
          valid: boolean
        }[]
      }
      workspace_get_limit: {
        Args: { _metric_key: string; _workspace_id: string }
        Returns: {
          is_unlimited: boolean
          limit_value: number
        }[]
      }
      workspace_has_feature: {
        Args: { _feature_key: string; _workspace_id: string }
        Returns: boolean
      }
      workspace_permissions_of: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: string[]
      }
      workspace_role_of: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "deleted"
      account_type: "creator" | "business" | "agency" | "personal"
      activity_type:
        | "auth.login"
        | "auth.logout"
        | "auth.signup"
        | "auth.password_reset"
        | "profile.update"
        | "workspace.create"
        | "workspace.update"
        | "workspace.delete"
        | "workspace.member_add"
        | "workspace.member_remove"
        | "organization.create"
        | "organization.update"
        | "biopage.create"
        | "biopage.update"
        | "biopage.publish"
        | "biopage.delete"
        | "theme.change"
        | "builder.action"
        | "media.upload"
        | "media.delete"
        | "invitation.send"
        | "invitation.accept"
        | "settings.update"
        | "workspace.role_change"
        | "workspace.transfer"
        | "workspace.member_suspend"
        | "workspace.member_reinstate"
        | "workspace.type_change"
      analytics_device_type: "mobile" | "tablet" | "desktop" | "bot" | "unknown"
      analytics_event_type:
        | "page_view"
        | "link_click"
        | "qr_scan"
        | "session_end"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "team_member"
        | "agency_owner"
        | "reseller"
        | "customer"
      approval_kind: "draft" | "content" | "design" | "publishing"
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "revision_requested"
      assignment_role:
        | "project_manager"
        | "designer"
        | "developer"
        | "writer"
        | "seo"
        | "viewer"
      billing_cycle: "monthly" | "quarterly" | "yearly" | "lifetime"
      bio_page_status:
        | "draft"
        | "published"
        | "archived"
        | "scheduled"
        | "unpublished"
      bio_page_visibility: "public" | "private" | "unlisted" | "password"
      campaign_status: "draft" | "active" | "paused" | "completed" | "archived"
      client_status: "trial" | "active" | "suspended" | "archived"
      commission_rule_type: "fixed" | "percentage" | "tiered" | "custom"
      commission_status: "pending" | "approved" | "paid" | "void"
      conversion_goal_type:
        | "whatsapp_click"
        | "phone_call"
        | "email_click"
        | "website_click"
        | "file_download"
        | "form_submit"
        | "booking_click"
        | "qr_scan"
        | "custom_url_click"
      coupon_duration: "one_time" | "recurring" | "forever"
      coupon_kind: "percentage" | "flat"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      invoice_status:
        | "draft"
        | "open"
        | "paid"
        | "void"
        | "uncollectible"
        | "refunded"
      manual_upi_status: "pending" | "approved" | "rejected"
      marketplace_asset_kind:
        | "template"
        | "theme"
        | "component"
        | "prompt_pack"
        | "brand_kit"
        | "plugin"
      marketplace_asset_status:
        | "draft"
        | "published"
        | "unpublished"
        | "archived"
      media_collection_kind: "manual" | "smart" | "dynamic"
      media_kind: "image" | "video" | "audio" | "document" | "other"
      media_processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "skipped"
      notification_channel: "in_app" | "email" | "push" | "sms"
      notification_type:
        | "system"
        | "security"
        | "activity"
        | "marketing"
        | "billing"
        | "collaboration"
      org_plan: "free" | "pro" | "business" | "enterprise"
      org_role: "owner" | "admin" | "manager" | "member"
      partner_invoice_status:
        | "draft"
        | "open"
        | "paid"
        | "overdue"
        | "void"
        | "refunded"
      partner_payment_status: "pending" | "succeeded" | "failed" | "refunded"
      partner_status: "pending" | "approved" | "suspended" | "rejected"
      partner_subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      payment_gateway:
        | "razorpay"
        | "stripe"
        | "paypal"
        | "paddle"
        | "manual"
        | "payu"
        | "cashfree"
        | "manual_upi"
      payment_mode: "sandbox" | "live"
      payment_order_status:
        | "created"
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
        | "manual_review"
      payment_provider: "razorpay" | "payu" | "cashfree" | "manual_upi"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "refunded"
        | "partially_refunded"
      payout_status: "pending" | "processing" | "paid" | "failed" | "cancelled"
      promotion_discount_type: "percentage" | "fixed"
      promotion_status: "scheduled" | "active" | "expired" | "disabled"
      reseller_client_status:
        | "lead"
        | "trial"
        | "active"
        | "suspended"
        | "expired"
        | "archived"
        | "cancelled"
      reseller_note_kind: "internal" | "support"
      reseller_priority: "low" | "normal" | "high" | "urgent"
      reseller_support_status: "none" | "open" | "pending" | "resolved"
      reseller_team_role:
        | "owner"
        | "admin"
        | "sales"
        | "support"
        | "designer"
        | "developer"
        | "viewer"
      shared_resource_kind: "template" | "asset" | "component" | "prompt"
      ssl_status:
        | "pending"
        | "provisioning"
        | "active"
        | "failed"
        | "expiring"
        | "expired"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
        | "expired"
        | "incomplete"
      tenant_domain_kind: "primary" | "portal" | "login" | "other"
      tenant_domain_status: "pending" | "verified" | "failed"
      tenant_member_role: "owner" | "admin"
      tenant_status: "active" | "suspended" | "archived"
      workspace_role: "owner" | "admin" | "member"
      workspace_type: "personal" | "business" | "agency" | "enterprise"
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
      account_status: ["active", "suspended", "deleted"],
      account_type: ["creator", "business", "agency", "personal"],
      activity_type: [
        "auth.login",
        "auth.logout",
        "auth.signup",
        "auth.password_reset",
        "profile.update",
        "workspace.create",
        "workspace.update",
        "workspace.delete",
        "workspace.member_add",
        "workspace.member_remove",
        "organization.create",
        "organization.update",
        "biopage.create",
        "biopage.update",
        "biopage.publish",
        "biopage.delete",
        "theme.change",
        "builder.action",
        "media.upload",
        "media.delete",
        "invitation.send",
        "invitation.accept",
        "settings.update",
        "workspace.role_change",
        "workspace.transfer",
        "workspace.member_suspend",
        "workspace.member_reinstate",
        "workspace.type_change",
      ],
      analytics_device_type: ["mobile", "tablet", "desktop", "bot", "unknown"],
      analytics_event_type: [
        "page_view",
        "link_click",
        "qr_scan",
        "session_end",
      ],
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "team_member",
        "agency_owner",
        "reseller",
        "customer",
      ],
      approval_kind: ["draft", "content", "design", "publishing"],
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "revision_requested",
      ],
      assignment_role: [
        "project_manager",
        "designer",
        "developer",
        "writer",
        "seo",
        "viewer",
      ],
      billing_cycle: ["monthly", "quarterly", "yearly", "lifetime"],
      bio_page_status: [
        "draft",
        "published",
        "archived",
        "scheduled",
        "unpublished",
      ],
      bio_page_visibility: ["public", "private", "unlisted", "password"],
      campaign_status: ["draft", "active", "paused", "completed", "archived"],
      client_status: ["trial", "active", "suspended", "archived"],
      commission_rule_type: ["fixed", "percentage", "tiered", "custom"],
      commission_status: ["pending", "approved", "paid", "void"],
      conversion_goal_type: [
        "whatsapp_click",
        "phone_call",
        "email_click",
        "website_click",
        "file_download",
        "form_submit",
        "booking_click",
        "qr_scan",
        "custom_url_click",
      ],
      coupon_duration: ["one_time", "recurring", "forever"],
      coupon_kind: ["percentage", "flat"],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      invoice_status: [
        "draft",
        "open",
        "paid",
        "void",
        "uncollectible",
        "refunded",
      ],
      manual_upi_status: ["pending", "approved", "rejected"],
      marketplace_asset_kind: [
        "template",
        "theme",
        "component",
        "prompt_pack",
        "brand_kit",
        "plugin",
      ],
      marketplace_asset_status: [
        "draft",
        "published",
        "unpublished",
        "archived",
      ],
      media_collection_kind: ["manual", "smart", "dynamic"],
      media_kind: ["image", "video", "audio", "document", "other"],
      media_processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "skipped",
      ],
      notification_channel: ["in_app", "email", "push", "sms"],
      notification_type: [
        "system",
        "security",
        "activity",
        "marketing",
        "billing",
        "collaboration",
      ],
      org_plan: ["free", "pro", "business", "enterprise"],
      org_role: ["owner", "admin", "manager", "member"],
      partner_invoice_status: [
        "draft",
        "open",
        "paid",
        "overdue",
        "void",
        "refunded",
      ],
      partner_payment_status: ["pending", "succeeded", "failed", "refunded"],
      partner_status: ["pending", "approved", "suspended", "rejected"],
      partner_subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      payment_gateway: [
        "razorpay",
        "stripe",
        "paypal",
        "paddle",
        "manual",
        "payu",
        "cashfree",
        "manual_upi",
      ],
      payment_mode: ["sandbox", "live"],
      payment_order_status: [
        "created",
        "pending",
        "paid",
        "failed",
        "refunded",
        "cancelled",
        "manual_review",
      ],
      payment_provider: ["razorpay", "payu", "cashfree", "manual_upi"],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      payout_status: ["pending", "processing", "paid", "failed", "cancelled"],
      promotion_discount_type: ["percentage", "fixed"],
      promotion_status: ["scheduled", "active", "expired", "disabled"],
      reseller_client_status: [
        "lead",
        "trial",
        "active",
        "suspended",
        "expired",
        "archived",
        "cancelled",
      ],
      reseller_note_kind: ["internal", "support"],
      reseller_priority: ["low", "normal", "high", "urgent"],
      reseller_support_status: ["none", "open", "pending", "resolved"],
      reseller_team_role: [
        "owner",
        "admin",
        "sales",
        "support",
        "designer",
        "developer",
        "viewer",
      ],
      shared_resource_kind: ["template", "asset", "component", "prompt"],
      ssl_status: [
        "pending",
        "provisioning",
        "active",
        "failed",
        "expiring",
        "expired",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
        "expired",
        "incomplete",
      ],
      tenant_domain_kind: ["primary", "portal", "login", "other"],
      tenant_domain_status: ["pending", "verified", "failed"],
      tenant_member_role: ["owner", "admin"],
      tenant_status: ["active", "suspended", "archived"],
      workspace_role: ["owner", "admin", "member"],
      workspace_type: ["personal", "business", "agency", "enterprise"],
    },
  },
} as const
