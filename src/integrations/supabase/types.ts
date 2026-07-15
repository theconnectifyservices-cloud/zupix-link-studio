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
      media_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          created_at: string
          deleted_at: string | null
          duration_seconds: number | null
          file_name: string | null
          folder_id: string | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          last_used_at: string | null
          metadata: Json
          mime_type: string | null
          owner_id: string
          path: string
          sha256: string | null
          size_bytes: number | null
          tags: string[]
          thumbnail_path: string | null
          updated_at: string
          usage_count: number
          width: number | null
          workspace_id: string | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          last_used_at?: string | null
          metadata?: Json
          mime_type?: string | null
          owner_id: string
          path: string
          sha256?: string | null
          size_bytes?: number | null
          tags?: string[]
          thumbnail_path?: string | null
          updated_at?: string
          usage_count?: number
          width?: number | null
          workspace_id?: string | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          last_used_at?: string | null
          metadata?: Json
          mime_type?: string | null
          owner_id?: string
          path?: string
          sha256?: string | null
          size_bytes?: number | null
          tags?: string[]
          thumbnail_path?: string | null
          updated_at?: string
          usage_count?: number
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
          created_at: string
          deleted_at: string | null
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
          created_at?: string
          deleted_at?: string | null
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
          created_at?: string
          deleted_at?: string | null
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
          onboarding_completed: boolean
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          subscription_tier: string
          timezone: string | null
          updated_at: string
          username: string | null
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
          onboarding_completed?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
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
          onboarding_completed?: boolean
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
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
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
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
      workspaces: {
        Row: {
          brand_name: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
          owner_id: string
          settings: Json
          slug: string
          social_image_url: string | null
          subdomain: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          owner_id: string
          settings?: Json
          slug: string
          social_image_url?: string | null
          subdomain?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          settings?: Json
          slug?: string
          social_image_url?: string | null
          subdomain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_reserved_username: { Args: { _username: string }; Returns: boolean }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      org_role_of: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
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
      analytics_device_type: "mobile" | "tablet" | "desktop" | "bot" | "unknown"
      analytics_event_type:
        | "page_view"
        | "link_click"
        | "qr_scan"
        | "session_end"
      app_role: "admin" | "moderator" | "user"
      bio_page_status:
        | "draft"
        | "published"
        | "archived"
        | "scheduled"
        | "unpublished"
      bio_page_visibility: "public" | "private" | "unlisted" | "password"
      campaign_status: "draft" | "active" | "paused" | "completed" | "archived"
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
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      media_kind: "image" | "video" | "audio" | "document" | "other"
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
      workspace_role: "owner" | "admin" | "member"
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
      ],
      analytics_device_type: ["mobile", "tablet", "desktop", "bot", "unknown"],
      analytics_event_type: [
        "page_view",
        "link_click",
        "qr_scan",
        "session_end",
      ],
      app_role: ["admin", "moderator", "user"],
      bio_page_status: [
        "draft",
        "published",
        "archived",
        "scheduled",
        "unpublished",
      ],
      bio_page_visibility: ["public", "private", "unlisted", "password"],
      campaign_status: ["draft", "active", "paused", "completed", "archived"],
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
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      media_kind: ["image", "video", "audio", "document", "other"],
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
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
