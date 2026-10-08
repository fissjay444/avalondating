// Avalon Dating — Supabase Database Types
// Auto-generated type definitions matching the Phase 2 schema

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
      profiles: {
        Row: {
          id: string
          first_name: string | null
          date_of_birth: string | null
          gender: 'woman' | 'man' | null
          looking_for: 'men' | 'women' | null
          city: string | null
          country: string | null
          bio: string | null
          is_verified: boolean
          is_online: boolean
          last_seen_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          date_of_birth?: string | null
          gender?: 'woman' | 'man' | 'non-binary' | 'prefer_not_to_say' | null
          looking_for?: 'men' | 'women' | 'everyone' | null
          city?: string | null
          country?: string | null
          bio?: string | null
          is_verified?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string | null
          date_of_birth?: string | null
          gender?: 'woman' | 'man' | 'non-binary' | 'prefer_not_to_say' | null
          looking_for?: 'men' | 'women' | 'everyone' | null
          city?: string | null
          country?: string | null
          bio?: string | null
          is_verified?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          updated_at?: string
        }
      }
      profile_photos: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          display_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          storage_path?: string
          display_order?: number
          is_primary?: boolean
        }
      }
      interests: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      user_interests: {
        Row: {
          user_id: string
          interest_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          interest_id: string
          created_at?: string
        }
        Update: never
      }
      dating_preferences: {
        Row: {
          user_id: string
          min_age: number | null
          max_age: number | null
          max_distance_km: number | null
          preferred_gender: string | null
          relationship_intention: string | null
          show_verified_only: boolean
          show_online_only: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          min_age?: number | null
          max_age?: number | null
          max_distance_km?: number | null
          preferred_gender?: string | null
          relationship_intention?: string | null
          show_verified_only?: boolean
          show_online_only?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          min_age?: number | null
          max_age?: number | null
          max_distance_km?: number | null
          preferred_gender?: string | null
          relationship_intention?: string | null
          show_verified_only?: boolean
          show_online_only?: boolean
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          created_at?: string
        }
        Update: never
      }
      passes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          created_at?: string
        }
        Update: never
      }
      super_likes: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          created_at?: string
        }
        Update: never
      }
      matches: {
        Row: {
          id: string
          user_a_id: string
          user_b_id: string
          matched_at: string
          status: 'active' | 'unmatched' | 'blocked'
          created_at: string
        }
        Insert: {
          id?: string
          user_a_id: string
          user_b_id: string
          matched_at?: string
          status?: 'active' | 'unmatched' | 'blocked'
          created_at?: string
        }
        Update: {
          status?: 'active' | 'unmatched' | 'blocked'
        }
      }
      conversations: {
        Row: {
          id: string
          match_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_type: 'text' | 'image' | 'gif' | 'emoji'
          content: string | null
          attachment_path: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_type?: 'text' | 'image' | 'gif' | 'emoji'
          content?: string | null
          attachment_path?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
          content?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          related_user_id: string | null
          related_match_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body?: string | null
          related_user_id?: string | null
          related_match_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
          body?: string | null
        }
      }
      profile_views: {
        Row: {
          id: string
          viewer_id: string
          viewed_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          viewer_id: string
          viewed_user_id: string
          created_at?: string
        }
        Update: never
      }
      blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_user_id: string
          created_at?: string
        }
        Update: never
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          description?: string | null
        }
      }
      profile_boosts: {
        Row: {
          id: string
          user_id: string
          started_at: string | null
          expires_at: string | null
          status: 'active' | 'expired' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string | null
          expires_at?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          created_at?: string
        }
        Update: {
          status?: 'active' | 'expired' | 'cancelled'
          expires_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'premium' | 'vip'
          status: 'active' | 'cancelled' | 'expired' | 'past_due'
          started_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'free' | 'premium' | 'vip'
          status?: 'active' | 'cancelled' | 'expired' | 'past_due'
          started_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: 'free' | 'premium' | 'vip'
          status?: 'active' | 'cancelled' | 'expired' | 'past_due'
          expires_at?: string | null
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          show_online_status: boolean
          allow_messages: boolean
          show_profile: boolean
          email_notifications: boolean
          push_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          show_online_status?: boolean
          allow_messages?: boolean
          show_profile?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          show_online_status?: boolean
          allow_messages?: boolean
          show_profile?: boolean
          email_notifications?: boolean
          push_notifications?: boolean
          updated_at?: string
        }
      }
    }
    Functions: {
      is_match_member: {
        Args: { match_uuid: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { conversation_uuid: string }
        Returns: boolean
      }
      get_chat_entitlement: {
        Args: { p_conversation_id: string; p_content?: string | null }
        Returns: Json
      }
      send_message: {
        Args: {
          p_conversation_id: string
          p_content: string
          p_message_type?: string
          p_attachment_path?: string | null
          p_client_id?: string | null
        }
        Returns: Json
      }
    }
  }
}
