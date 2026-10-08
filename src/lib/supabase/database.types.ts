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
 get_or_create_conversation: {
 Args: { p_match_id: string }
 Returns: { conversation_id?: string | null } | null
 }
 get_conversations: {
 Args: { p_limit?: number; p_offset?: number }
 Returns: Array<{ conversation_id: string; match_id: string; match_status: string; updated_at: string; matched_user_id: string; first_name: string | null; age: number | null; city: string | null; country: string | null; is_verified: boolean; is_online: boolean; last_seen_at: string | null; primary_photo_path: string | null; latest_message_id: string | null; latest_message_content: string | null; latest_message_sender_id: string | null; latest_message_type: string | null; latest_message_created_at: string | null; unread_count: number }>
 }
 get_messages: {
 Args: { p_conversation_id: string; p_limit?: number; p_before_id?: string | null }
 Returns: Array<{ message_id: string; conversation_id: string; sender_id: string; sender_name: string | null; sender_photo_path: string | null; message_type: string; content: string | null; attachment_path: string | null; is_read: boolean; deleted_at: string | null; created_at: string }>
 }
 mark_messages_read: {
 Args: { p_conversation_id: string }
 Returns: Json
 }
 soft_delete_message: {
 Args: { p_message_id: string }
 Returns: Json
 }
 get_matches: {
 Args: { p_limit?: number; p_offset?: number }
 Returns: Array<{ match_id: string; matched_at: string; last_activity_at: string | null; status: string; matched_user_id: string; first_name: string | null; date_of_birth: string | null; age: number | null; city: string | null; country: string | null; bio: string | null; is_verified: boolean; is_online: boolean; last_seen_at: string | null; primary_photo_path: string | null; conversation_id: string | null }>
 }
 get_notifications: {
 Args: { p_limit?: number; p_offset?: number; p_unread_only?: boolean }
 Returns: Array<{ notification_id: string; type: string; title: string | null; body: string | null; is_read: boolean; created_at: string; related_match_id: string | null; related_user_id: string | null; related_user_name: string | null; related_user_photo: string | null }>
 }
 get_unread_notification_count: {
 Args: Record<PropertyKey, never>
 Returns: number
 }
 mark_notification_read: {
 Args: { p_notification_id: string }
 Returns: Json
 }
 mark_all_notifications_read: {
 Args: Record<PropertyKey, never>
 Returns: Json
 }
 get_discovery_profiles: {
 Args: { p_limit?: number; p_offset?: number }
 Returns: Array<{ id: string; first_name: string | null; date_of_birth: string | null; gender: string | null; city: string | null; country: string | null; bio: string | null; is_verified: boolean; is_online: boolean; last_seen_at: string | null; age: number | null; photos: Json; interests: Json }>
 }
 get_browse_profiles: {
 Args: { p_limit?: number; p_offset?: number; p_gender?: string | null; p_min_age?: number | null; p_max_age?: number | null; p_verified_only?: boolean; p_online_only?: boolean; p_interest_names?: string[] | null; p_relationship_intention?: string | null; p_search?: string | null; p_sort?: string }
 Returns: Array<{ id: string; first_name: string | null; date_of_birth: string | null; gender: string | null; city: string | null; country: string | null; bio: string | null; is_verified: boolean; is_online: boolean; last_seen_at: string | null; age: number | null; photos: Json; interests: Json; relationship_intention: string | null }>
 }
 get_browse_profile_count: {
 Args: Record<PropertyKey, never>
 Returns: number
 }
 record_like: {
 Args: { p_to_user_id: string; p_is_super_like?: boolean }
 Returns: Json
 }
 record_pass: {
 Args: { p_to_user_id: string }
 Returns: Json
 }
 record_block: {
 Args: { p_blocked_user_id: string }
 Returns: Json
 }
 record_report: {
 Args: { p_reported_user_id: string; p_reason: string; p_description?: string | null }
 Returns: Json
 }
 record_profile_view: {
 Args: { p_viewed_user_id: string }
 Returns: Json
 }
 get_my_activity: {
 Args: { p_limit?: number; p_offset?: number }
 Returns: Array<{ activity_id: string; event_type: string; metadata: Json; created_at: string; related_user_name: string | null; related_user_photo: string | null }>
 }
 get_activity_stats: {
 Args: Record<PropertyKey, never>
 Returns: Json
 }
 get_profile_completeness: {
 Args: Record<PropertyKey, never>
 Returns: Json
 }
 log_activity: {
 Args: { p_event_type: string; p_metadata?: Record<string, unknown> }
 Returns: undefined
 }
 update_last_active: {
 Args: Record<PropertyKey, never>
 Returns: undefined
 }
    }
  }
}
