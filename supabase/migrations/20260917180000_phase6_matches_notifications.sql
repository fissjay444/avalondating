-- ============================================================
-- AVALON DATING — PHASE 6: MATCH CREATION + NOTIFICATIONS
-- Migration: 20260917180000_phase6_matches_notifications.sql
-- ============================================================
-- This migration adds:
-- 1. last_activity_at column to matches (for sorting)
-- 2. get_matches RPC — fetch current user's matches with profile info
-- 3. get_notifications RPC — fetch user's notifications
-- 4. get_unread_notification_count RPC
-- 5. mark_notification_read RPC
-- 6. mark_all_notifications_read RPC
-- 7. Realtime publication for matches + notifications
-- ============================================================

-- ============================================================
-- SECTION 1: SCHEMA ADDITIONS
-- ============================================================

-- Add last_activity_at to matches (for sorting by recent activity)
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- Index for sorting by last_activity_at
CREATE INDEX IF NOT EXISTS idx_matches_last_activity_at
  ON public.matches(last_activity_at DESC);

-- Index for created_at sorting
CREATE INDEX IF NOT EXISTS idx_matches_created_at
  ON public.matches(created_at DESC);

-- Index for notifications created_at
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- ============================================================
-- SECTION 2: RPC — get_matches
-- Returns all active matches for the authenticated user,
-- joined with the matched user's profile and primary photo.
-- Sorted by last_activity_at DESC (most recent first).
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_matches(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  match_id UUID,
  matched_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  status TEXT,
  matched_user_id UUID,
  first_name TEXT,
  date_of_birth DATE,
  age INTEGER,
  city TEXT,
  country TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  primary_photo_path TEXT,
  conversation_id UUID
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
    m.id AS match_id,
    m.matched_at,
    COALESCE(m.last_activity_at, m.matched_at) AS last_activity_at,
    m.status,
    -- The matched user is whichever side is NOT the current user
    CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END AS matched_user_id,
    p.first_name,
    p.date_of_birth,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
    p.city,
    p.country,
    p.bio,
    p.is_verified,
    p.is_online,
    p.last_seen_at,
    -- Primary photo path
    (
      SELECT pp.storage_path
      FROM public.profile_photos pp
      WHERE pp.user_id = (CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END)
        AND pp.is_primary = TRUE
      LIMIT 1
    ) AS primary_photo_path,
    -- Conversation ID for future chat
    c.id AS conversation_id
  FROM public.matches m
  JOIN public.profiles p ON p.id = (CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END)
  LEFT JOIN public.conversations c ON c.match_id = m.id
  WHERE
    (m.user_a_id = v_user_id OR m.user_b_id = v_user_id)
    AND m.status = 'active'
  ORDER BY COALESCE(m.last_activity_at, m.matched_at) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- SECTION 3: RPC — get_notifications
-- Returns notifications for the authenticated user.
-- Includes related user's name and photo for display.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_notifications(
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  notification_id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  related_match_id UUID,
  related_user_id UUID,
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
    n.id AS notification_id,
    n.type,
    n.title,
    n.body,
    n.is_read,
    n.created_at,
    n.related_match_id,
    n.related_user_id,
    p.first_name AS related_user_name,
    (
      SELECT pp.storage_path
      FROM public.profile_photos pp
      WHERE pp.user_id = n.related_user_id
        AND pp.is_primary = TRUE
      LIMIT 1
    ) AS related_user_photo
  FROM public.notifications n
  LEFT JOIN public.profiles p ON p.id = n.related_user_id
  WHERE
    n.user_id = v_user_id
    AND (NOT p_unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- SECTION 4: RPC — get_unread_notification_count
-- Returns the count of unread notifications for the current user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.notifications
  WHERE user_id = v_user_id AND is_read = FALSE;

  RETURN v_count;
END;
$$;

-- ============================================================
-- SECTION 5: RPC — mark_notification_read
-- Marks a single notification as read (only if owned by caller).
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id UUID
)
RETURNS JSONB
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

  UPDATE public.notifications
  SET is_read = TRUE
  WHERE id = p_notification_id
    AND user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- SECTION 6: RPC — mark_all_notifications_read
-- Marks all unread notifications as read for the current user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_id = v_user_id AND is_read = FALSE;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

-- ============================================================
-- SECTION 7: UPDATE record_like to set last_activity_at
-- Enhance existing record_like to update last_activity_at on match
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_like(
  p_to_user_id UUID,
  p_is_super_like BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id UUID;
  v_existing_like UUID;
  v_existing_super_like UUID;
  v_reciprocal_like UUID;
  v_reciprocal_super_like UUID;
  v_match_id UUID;
  v_conversation_id UUID;
  v_existing_match UUID;
  v_matched_profile RECORD;
BEGIN
  -- Get authenticated user
  v_from_user_id := auth.uid();

  -- Validate caller is authenticated
  IF v_from_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent self-like
  IF v_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot like yourself';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_to_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Check for blocks in either direction
  IF EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = v_from_user_id AND blocked_user_id = p_to_user_id)
       OR (blocker_id = p_to_user_id AND blocked_user_id = v_from_user_id)
  ) THEN
    RAISE EXCEPTION 'Blocked user';
  END IF;

  IF p_is_super_like THEN
    -- Check for existing super like
    SELECT id INTO v_existing_super_like
    FROM public.super_likes
    WHERE from_user_id = v_from_user_id AND to_user_id = p_to_user_id;

    IF v_existing_super_like IS NOT NULL THEN
      RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', true);
    END IF;

    INSERT INTO public.super_likes (from_user_id, to_user_id)
    VALUES (v_from_user_id, p_to_user_id)
    ON CONFLICT DO NOTHING;

  ELSE
    -- Check for existing like
    SELECT id INTO v_existing_like
    FROM public.likes
    WHERE from_user_id = v_from_user_id AND to_user_id = p_to_user_id;

    IF v_existing_like IS NOT NULL THEN
      RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', true);
    END IF;

    INSERT INTO public.likes (from_user_id, to_user_id)
    VALUES (v_from_user_id, p_to_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for reciprocal interest
  SELECT id INTO v_reciprocal_like
  FROM public.likes
  WHERE from_user_id = p_to_user_id AND to_user_id = v_from_user_id;

  SELECT id INTO v_reciprocal_super_like
  FROM public.super_likes
  WHERE from_user_id = p_to_user_id AND to_user_id = v_from_user_id;

  -- No reciprocal interest
  IF v_reciprocal_like IS NULL AND v_reciprocal_super_like IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', false);
  END IF;

  -- Check for existing match (order-independent)
  SELECT id INTO v_existing_match
  FROM public.matches
  WHERE (
    user_a_id = LEAST(v_from_user_id, p_to_user_id)
    AND user_b_id = GREATEST(v_from_user_id, p_to_user_id)
  )
  AND status = 'active';

  IF v_existing_match IS NOT NULL THEN
    -- Update last_activity_at on existing match
    UPDATE public.matches
    SET last_activity_at = now()
    WHERE id = v_existing_match;

    RETURN jsonb_build_object('matched', true, 'match_id', v_existing_match, 'already_done', true);
  END IF;

  -- Create match (order-independent: smaller UUID is always user_a)
  INSERT INTO public.matches (user_a_id, user_b_id, status, last_activity_at)
  VALUES (
    LEAST(v_from_user_id, p_to_user_id),
    GREATEST(v_from_user_id, p_to_user_id),
    'active',
    now()
  )
  RETURNING id INTO v_match_id;

  -- Create conversation for this match
  INSERT INTO public.conversations (match_id)
  VALUES (v_match_id)
  ON CONFLICT (match_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Fetch matched user's profile for notification message
  SELECT first_name INTO v_matched_profile
  FROM public.profiles
  WHERE id = p_to_user_id;

  -- Create notification for the other user
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES (
    p_to_user_id,
    'match',
    'It''s a Match! 💜',
    'You and someone liked each other.',
    v_from_user_id,
    v_match_id
  );

  -- Create notification for the current user
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES (
    v_from_user_id,
    'match',
    'It''s a Match! 💜',
    'You and ' || COALESCE(v_matched_profile.first_name, 'someone') || ' liked each other.',
    p_to_user_id,
    v_match_id
  );

  RETURN jsonb_build_object('matched', true, 'match_id', v_match_id, 'already_done', false);

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: match was created concurrently
    SELECT id INTO v_existing_match
    FROM public.matches
    WHERE user_a_id = LEAST(v_from_user_id, p_to_user_id)
      AND user_b_id = GREATEST(v_from_user_id, p_to_user_id);
    RETURN jsonb_build_object('matched', true, 'match_id', v_existing_match, 'already_done', true);
END;
$$;

-- ============================================================
-- SECTION 8: GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_matches(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notifications(INTEGER, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_like(UUID, BOOLEAN) TO authenticated;

-- ============================================================
-- SECTION 9: REALTIME CONFIGURATION
-- Enable Realtime for matches and notifications tables
-- so Phase 7 (Chat) can subscribe to new matches/notifications/messages
-- ============================================================

-- Add matches to Realtime publication (safe — only adds if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add matches to realtime publication: %', SQLERRM;
END $$;

-- Add notifications to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add notifications to realtime publication: %', SQLERRM;
END $$;

-- Add conversations to Realtime publication (for Phase 7 Chat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add conversations to realtime publication: %', SQLERRM;
END $$;

-- Add messages to Realtime publication (for Phase 7 Chat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add messages to realtime publication: %', SQLERRM;
END $$;
