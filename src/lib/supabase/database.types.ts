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
 created_at?: string | null
 }
 Update: {
 id?: string
 blocker_id?: string
 blocked_user_id?: string
 created_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 updated_at?: string | null
 }
 Update: {
 id?: string
 match_id?: string
 created_at?: string | null
 updated_at?: string | null
 }
 Relationships: []
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
 show_verified_only?: boolean | null
 show_online_only?: boolean | null
 created_at?: string | null
 updated_at?: string | null
 }
 Update: {
 user_id?: string
 min_age?: number | null
 max_age?: number | null
 max_distance_km?: number | null
 preferred_gender?: string | null
 relationship_intention?: string | null
 show_verified_only?: boolean | null
 show_online_only?: boolean | null
 created_at?: string | null
 updated_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 id?: string
 name?: string
 created_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 id?: string
 from_user_id?: string
 to_user_id?: string
 created_at?: string | null
 }
 Relationships: []
 }
 matches: {
 Row: {
 id: string
 user_a_id: string
 user_b_id: string
 matched_at: string
 status: string
 created_at: string
 last_activity_at: string
 }
 Insert: {
 id?: string
 user_a_id: string
 user_b_id: string
 matched_at?: string | null
 status?: string | null
 created_at?: string | null
 last_activity_at?: string | null
 }
 Update: {
 id?: string
 user_a_id?: string
 user_b_id?: string
 matched_at?: string | null
 status?: string | null
 created_at?: string | null
 last_activity_at?: string | null
 }
 Relationships: []
 }
 messages: {
 Row: {
 id: string
 conversation_id: string
 sender_id: string
 message_type: string
 content: string | null
 attachment_path: string | null
 is_read: boolean
 created_at: string
 deleted_at: string | null
 }
 Insert: {
 id?: string
 conversation_id: string
 sender_id: string
 message_type?: string | null
 content?: string | null
 attachment_path?: string | null
 is_read?: boolean | null
 created_at?: string | null
 deleted_at?: string | null
 }
 Update: {
 id?: string
 conversation_id?: string
 sender_id?: string
 message_type?: string | null
 content?: string | null
 attachment_path?: string | null
 is_read?: boolean | null
 created_at?: string | null
 deleted_at?: string | null
 }
 Relationships: []
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
 is_read?: boolean | null
 created_at?: string | null
 }
 Update: {
 id?: string
 user_id?: string
 type?: string
 title?: string
 body?: string | null
 related_user_id?: string | null
 related_match_id?: string | null
 is_read?: boolean | null
 created_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 id?: string
 from_user_id?: string
 to_user_id?: string
 created_at?: string | null
 }
 Relationships: []
 }
 profile_boosts: {
 Row: {
 id: string
 user_id: string
 started_at: string | null
 expires_at: string | null
 status: string
 created_at: string
 }
 Insert: {
 id?: string
 user_id: string
 started_at?: string | null
 expires_at?: string | null
 status?: string | null
 created_at?: string | null
 }
 Update: {
 id?: string
 user_id?: string
 started_at?: string | null
 expires_at?: string | null
 status?: string | null
 created_at?: string | null
 }
 Relationships: []
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
 display_order?: number | null
 is_primary?: boolean | null
 created_at?: string | null
 }
 Update: {
 id?: string
 user_id?: string
 storage_path?: string
 display_order?: number | null
 is_primary?: boolean | null
 created_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 id?: string
 viewer_id?: string
 viewed_user_id?: string
 created_at?: string | null
 }
 Relationships: []
 }
 profiles: {
 Row: {
 id: string
 first_name: string | null
 date_of_birth: string | null
 gender: string | null
 looking_for: string | null
 city: string | null
 country: string | null
 bio: string | null
 is_verified: boolean
 is_online: boolean
 last_seen_at: string | null
 created_at: string
 updated_at: string
 last_active_at: string
 }
 Insert: {
 id: string
 first_name?: string | null
 date_of_birth?: string | null
 gender?: string | null
 looking_for?: string | null
 city?: string | null
 country?: string | null
 bio?: string | null
 is_verified?: boolean | null
 is_online?: boolean | null
 last_seen_at?: string | null
 created_at?: string | null
 updated_at?: string | null
 last_active_at?: string | null
 }
 Update: {
 id?: string
 first_name?: string | null
 date_of_birth?: string | null
 gender?: string | null
 looking_for?: string | null
 city?: string | null
 country?: string | null
 bio?: string | null
 is_verified?: boolean | null
 is_online?: boolean | null
 last_seen_at?: string | null
 created_at?: string | null
 updated_at?: string | null
 last_active_at?: string | null
 }
 Relationships: []
 }
 reports: {
 Row: {
 id: string
 reporter_id: string
 reported_user_id: string
 reason: string
 description: string | null
 status: string
 created_at: string
 }
 Insert: {
 id?: string
 reporter_id: string
 reported_user_id: string
 reason: string
 description?: string | null
 status?: string | null
 created_at?: string | null
 }
 Update: {
 id?: string
 reporter_id?: string
 reported_user_id?: string
 reason?: string
 description?: string | null
 status?: string | null
 created_at?: string | null
 }
 Relationships: []
 }
 subscriptions: {
 Row: {
 id: string
 user_id: string
 plan: string
 status: string
 started_at: string | null
 expires_at: string | null
 created_at: string
 updated_at: string
 }
 Insert: {
 id?: string
 user_id: string
 plan?: string | null
 status?: string | null
 started_at?: string | null
 expires_at?: string | null
 created_at?: string | null
 updated_at?: string | null
 }
 Update: {
 id?: string
 user_id?: string
 plan?: string | null
 status?: string | null
 started_at?: string | null
 expires_at?: string | null
 created_at?: string | null
 updated_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 id?: string
 from_user_id?: string
 to_user_id?: string
 created_at?: string | null
 }
 Relationships: []
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
 created_at?: string | null
 }
 Update: {
 user_id?: string
 interest_id?: string
 created_at?: string | null
 }
 Relationships: []
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
 show_online_status?: boolean | null
 allow_messages?: boolean | null
 show_profile?: boolean | null
 email_notifications?: boolean | null
 push_notifications?: boolean | null
 created_at?: string | null
 updated_at?: string | null
 }
 Update: {
 user_id?: string
 show_online_status?: boolean | null
 allow_messages?: boolean | null
 show_profile?: boolean | null
 email_notifications?: boolean | null
 push_notifications?: boolean | null
 created_at?: string | null
 updated_at?: string | null
 }
 Relationships: []
 }
 }
 Views: {}
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
 Enums: {}
 CompositeTypes: {}
 }
}