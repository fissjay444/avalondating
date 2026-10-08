-- ============================================================
-- AVALON DATING — PHASE 8: PROFILE COMPLETENESS + ACTIVITY SYSTEM
-- Migration: 20260917200000_phase8_activity_completeness.sql
-- ============================================================
-- This migration adds:
-- 1. user_activity table — centralized event/activity log
-- 2. last_active_at column on profiles (for online status)
-- 3. Indexes for performance
-- 4. RLS policies for privacy
-- 5. RPCs: log_activity, get_my_activity, get_activity_stats,
--          get_profile_completeness, update_last_active
-- ============================================================

-- ============================================================
-- SECTION 1: ADD last_active_at TO PROFILES
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- Index for last_active_at (online status queries)
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
  ON public.profiles(last_active_at DESC);

-- ============================================================
-- SECTION 2: USER ACTIVITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- event_type values:
  -- 'signed_in', 'profile_updated', 'photo_uploaded',
  -- 'discovery_viewed', 'liked_user', 'passed_user',
  -- 'super_liked_user', 'match_received', 'match_opened',
  -- 'message_sent', 'message_received', 'preferences_updated'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id
  ON public.user_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_created_at
  ON public.user_activity(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_event_type
  ON public.user_activity(user_id, event_type);

-- ============================================================
-- SECTION 3: RLS POLICIES
-- ============================================================

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only read their own activity
DROP POLICY IF EXISTS "user_activity_select_own" ON public.user_activity;
CREATE POLICY "user_activity_select_own"
  ON public.user_activity
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own activity (enforced via RPC, but belt+suspenders)
DROP POLICY IF EXISTS "user_activity_insert_own" ON public.user_activity;
CREATE POLICY "user_activity_insert_own"
  ON public.user_activity
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No direct updates or deletes by users
DROP POLICY IF EXISTS "user_activity_no_update" ON public.user_activity;
CREATE POLICY "user_activity_no_update"
  ON public.user_activity
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "user_activity_no_delete" ON public.user_activity;
CREATE POLICY "user_activity_no_delete"
  ON public.user_activity
  FOR DELETE
  USING (false);

-- ============================================================
-- SECTION 4: RPC — update_last_active
-- Updates the authenticated user's last_active_at timestamp.
-- Called on meaningful authenticated activity.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  UPDATE public.profiles
  SET
    last_active_at = now(),
    is_online = true,
    last_seen_at = now()
  WHERE id = v_user_id;
END;
$$;

-- ============================================================
-- SECTION 5: RPC — log_activity
-- Logs a user activity event. Always uses auth.uid() as user_id.
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_activity(
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Validate event type
  IF p_event_type NOT IN (
    'signed_in', 'profile_updated', 'photo_uploaded',
    'discovery_viewed', 'liked_user', 'passed_user',
    'super_liked_user', 'match_received', 'match_opened',
    'message_sent', 'message_received', 'preferences_updated'
  ) THEN
    RETURN; -- Silently ignore unknown event types
  END IF;

  INSERT INTO public.user_activity (user_id, event_type, metadata)
  VALUES (v_user_id, p_event_type, COALESCE(p_metadata, '{}'));

  -- Also update last_active_at
  UPDATE public.profiles
  SET
    last_active_at = now(),
    is_online = true,
    last_seen_at = now()
  WHERE id = v_user_id;
END;
$$;

-- ============================================================
-- SECTION 6: RPC — get_my_activity
-- Returns paginated activity for the authenticated user.
-- Includes human-readable labels for display.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_activity(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  activity_id UUID,
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  related_user_name TEXT,
  related_user_photo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    ua.id AS activity_id,
    ua.event_type,
    ua.metadata,
    ua.created_at,
    p.first_name AS related_user_name,
    (
      SELECT pp.storage_path
      FROM public.profile_photos pp
      WHERE pp.user_id = (ua.metadata->>'related_user_id')::UUID
        AND pp.is_primary = TRUE
      LIMIT 1
    ) AS related_user_photo
  FROM public.user_activity ua
  LEFT JOIN public.profiles p ON p.id = (ua.metadata->>'related_user_id')::UUID
  WHERE ua.user_id = v_user_id
  ORDER BY ua.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- SECTION 7: RPC — get_activity_stats
-- Returns aggregate statistics for the authenticated user.
-- Uses actual database counts — no fabrication.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_activity_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_views INTEGER;
  v_likes_sent INTEGER;
  v_likes_received INTEGER;
  v_super_likes_sent INTEGER;
  v_matches INTEGER;
  v_messages_sent INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Profile views received
  SELECT COUNT(*)::INTEGER INTO v_profile_views
  FROM public.profile_views
  WHERE viewed_user_id = v_user_id;

  -- Likes sent
  SELECT COUNT(*)::INTEGER INTO v_likes_sent
  FROM public.likes
  WHERE from_user_id = v_user_id;

  -- Likes received
  SELECT COUNT(*)::INTEGER INTO v_likes_received
  FROM public.likes
  WHERE to_user_id = v_user_id;

  -- Super likes sent
  SELECT COUNT(*)::INTEGER INTO v_super_likes_sent
  FROM public.super_likes
  WHERE from_user_id = v_user_id;

  -- Active matches
  SELECT COUNT(*)::INTEGER INTO v_matches
  FROM public.matches
  WHERE (user_a_id = v_user_id OR user_b_id = v_user_id)
    AND status = 'active';

  -- Messages sent
  SELECT COUNT(*)::INTEGER INTO v_messages_sent
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  JOIN public.matches mt ON mt.id = c.match_id
  WHERE m.sender_id = v_user_id
    AND m.deleted_at IS NULL
    AND (mt.user_a_id = v_user_id OR mt.user_b_id = v_user_id);

  RETURN jsonb_build_object(
    'profile_views', v_profile_views,
    'likes_sent', v_likes_sent,
    'likes_received', v_likes_received,
    'super_likes_sent', v_super_likes_sent,
    'matches', v_matches,
    'messages_sent', v_messages_sent
  );
END;
$$;

-- ============================================================
-- SECTION 8: RPC — get_profile_completeness
-- Calculates profile completion percentage from real data.
-- Returns score + breakdown of completed/incomplete items.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_profile_completeness()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_photo_count INTEGER;
  v_additional_photo_count INTEGER;
  v_interest_count INTEGER;
  v_has_dating_prefs BOOLEAN;
  v_total_score INTEGER := 0;
  v_items JSONB := '[]'::JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Count photos
  SELECT COUNT(*)::INTEGER INTO v_photo_count
  FROM public.profile_photos
  WHERE user_id = v_user_id AND is_primary = TRUE;

  SELECT COUNT(*)::INTEGER INTO v_additional_photo_count
  FROM public.profile_photos
  WHERE user_id = v_user_id AND is_primary = FALSE;

  -- Count interests
  SELECT COUNT(*)::INTEGER INTO v_interest_count
  FROM public.user_interests
  WHERE user_id = v_user_id;

  -- Check dating preferences
  SELECT EXISTS(
    SELECT 1 FROM public.dating_preferences WHERE user_id = v_user_id
  ) INTO v_has_dating_prefs;

  -- ---- SCORING ----

  -- Profile name (10%)
  IF v_profile.first_name IS NOT NULL AND length(trim(v_profile.first_name)) > 0 THEN
    v_total_score := v_total_score + 10;
    v_items := v_items || jsonb_build_object('key', 'name', 'label', 'Profile name', 'completed', true, 'weight', 10, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'name', 'label', 'Add your name', 'completed', false, 'weight', 10, 'action_href', '/onboarding');
  END IF;

  -- Age / date of birth (10%)
  IF v_profile.date_of_birth IS NOT NULL THEN
    v_total_score := v_total_score + 10;
    v_items := v_items || jsonb_build_object('key', 'dob', 'label', 'Date of birth', 'completed', true, 'weight', 10, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'dob', 'label', 'Add your date of birth', 'completed', false, 'weight', 10, 'action_href', '/onboarding');
  END IF;

  -- Gender (5%)
  IF v_profile.gender IS NOT NULL THEN
    v_total_score := v_total_score + 5;
    v_items := v_items || jsonb_build_object('key', 'gender', 'label', 'Gender', 'completed', true, 'weight', 5, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'gender', 'label', 'Add your gender', 'completed', false, 'weight', 5, 'action_href', '/onboarding');
  END IF;

  -- Looking for (5%)
  IF v_profile.looking_for IS NOT NULL THEN
    v_total_score := v_total_score + 5;
    v_items := v_items || jsonb_build_object('key', 'looking_for', 'label', 'Looking for', 'completed', true, 'weight', 5, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'looking_for', 'label', 'Who are you looking for?', 'completed', false, 'weight', 5, 'action_href', '/onboarding');
  END IF;

  -- Location (10%)
  IF v_profile.city IS NOT NULL AND v_profile.country IS NOT NULL THEN
    v_total_score := v_total_score + 10;
    v_items := v_items || jsonb_build_object('key', 'location', 'label', 'Location', 'completed', true, 'weight', 10, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'location', 'label', 'Add your location', 'completed', false, 'weight', 10, 'action_href', '/onboarding');
  END IF;

  -- Bio (15%)
  IF v_profile.bio IS NOT NULL AND length(trim(v_profile.bio)) >= 20 THEN
    v_total_score := v_total_score + 15;
    v_items := v_items || jsonb_build_object('key', 'bio', 'label', 'Profile bio', 'completed', true, 'weight', 15, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'bio', 'label', 'Tell people about yourself', 'completed', false, 'weight', 15, 'action_href', '/onboarding');
  END IF;

  -- Primary photo (15%)
  IF v_photo_count > 0 THEN
    v_total_score := v_total_score + 15;
    v_items := v_items || jsonb_build_object('key', 'primary_photo', 'label', 'Profile photo', 'completed', true, 'weight', 15, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'primary_photo', 'label', 'Add a profile photo', 'completed', false, 'weight', 15, 'action_href', '/onboarding');
  END IF;

  -- Additional photos (10%)
  IF v_additional_photo_count >= 2 THEN
    v_total_score := v_total_score + 10;
    v_items := v_items || jsonb_build_object('key', 'more_photos', 'label', 'Additional photos', 'completed', true, 'weight', 10, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'more_photos', 'label', 'Add more photos', 'completed', false, 'weight', 10, 'action_href', '/onboarding');
  END IF;

  -- Interests (10%)
  IF v_interest_count >= 3 THEN
    v_total_score := v_total_score + 10;
    v_items := v_items || jsonb_build_object('key', 'interests', 'label', 'Interests', 'completed', true, 'weight', 10, 'action_href', '/onboarding');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'interests', 'label', 'Add your interests', 'completed', false, 'weight', 10, 'action_href', '/onboarding');
  END IF;

  -- Dating preferences (5%)
  IF v_has_dating_prefs THEN
    v_total_score := v_total_score + 5;
    v_items := v_items || jsonb_build_object('key', 'dating_prefs', 'label', 'Dating preferences', 'completed', true, 'weight', 5, 'action_href', '/settings');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'dating_prefs', 'label', 'Complete dating preferences', 'completed', false, 'weight', 5, 'action_href', '/settings');
  END IF;

  -- Verification (5%)
  IF v_profile.is_verified = TRUE THEN
    v_total_score := v_total_score + 5;
    v_items := v_items || jsonb_build_object('key', 'verified', 'label', 'Profile verified', 'completed', true, 'weight', 5, 'action_href', '/settings');
  ELSE
    v_items := v_items || jsonb_build_object('key', 'verified', 'label', 'Verify your profile', 'completed', false, 'weight', 5, 'action_href', '/settings');
  END IF;

  RETURN jsonb_build_object(
    'score', v_total_score,
    'items', v_items
  );
END;
$$;

-- ============================================================
-- SECTION 9: Add user_activity to Realtime publication
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'user_activity'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ============================================================
-- SECTION 10: Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.update_last_active() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_activity(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_completeness() TO authenticated;
