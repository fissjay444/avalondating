-- ============================================================
-- AVALON DATING — PHASE 7: CHAT SYSTEM RPCs
-- Migration: 20260917190000_phase7_chat_system.sql
-- ============================================================
-- This migration adds:
-- 1. deleted_at column to messages (soft delete)
-- 2. Trigger to update conversations.updated_at on new message
-- 3. get_or_create_conversation RPC
-- 4. get_conversations RPC (inbox with latest message + unread count)
-- 5. get_messages RPC (paginated message history)
-- 6. send_message RPC (validated, secure message insert)
-- 7. mark_messages_read RPC (batch read receipts)
-- 8. soft_delete_message RPC
-- 9. get_unread_message_count RPC
-- ============================================================

-- ============================================================
-- SECTION 1: SCHEMA ADDITIONS
-- ============================================================

-- Add soft-delete support to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for unread messages lookup
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON public.messages(conversation_id, is_read)
  WHERE is_read = false AND deleted_at IS NULL;

-- Index for pagination (cursor-based)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at DESC);

-- Index for conversations updated_at (inbox sorting)
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON public.conversations(updated_at DESC);

-- ============================================================
-- SECTION 2: TRIGGER — update conversations.updated_at on new message
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Also update match last_activity_at
  UPDATE public.matches m
  SET last_activity_at = NEW.created_at
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id
    AND m.id = c.match_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ============================================================
-- SECTION 3: RPC — get_or_create_conversation
-- Safely retrieves or creates a conversation for a given match.
-- Only works if the caller is a member of the match.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_match_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_conversation_id UUID;
  v_match_status TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is a member of this match and match is active
  SELECT status INTO v_match_status
  FROM public.matches
  WHERE id = p_match_id
    AND (user_a_id = v_user_id OR user_b_id = v_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or access denied';
  END IF;

  IF v_match_status != 'active' THEN
    RAISE EXCEPTION 'Match is no longer active';
  END IF;

  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE match_id = p_match_id;

  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (match_id)
    VALUES (p_match_id)
    ON CONFLICT (match_id) DO NOTHING
    RETURNING id INTO v_conversation_id;

    -- Handle race condition
    IF v_conversation_id IS NULL THEN
      SELECT id INTO v_conversation_id
      FROM public.conversations
      WHERE match_id = p_match_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('conversation_id', v_conversation_id);
END;
$$;

-- ============================================================
-- SECTION 4: RPC — get_conversations
-- Returns the authenticated user's conversation inbox.
-- Each row includes: matched user info, latest message, unread count.
-- Sorted by conversations.updated_at DESC.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_conversations(
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  match_id UUID,
  match_status TEXT,
  updated_at TIMESTAMPTZ,
  matched_user_id UUID,
  first_name TEXT,
  age INTEGER,
  city TEXT,
  country TEXT,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  primary_photo_path TEXT,
  latest_message_id UUID,
  latest_message_content TEXT,
  latest_message_sender_id UUID,
  latest_message_type TEXT,
  latest_message_created_at TIMESTAMPTZ,
  unread_count BIGINT
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
    c.id AS conversation_id,
    c.match_id,
    m.status AS match_status,
    c.updated_at,
    -- Matched user is the other side of the match
    CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END AS matched_user_id,
    p.first_name,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
    p.city,
    p.country,
    p.is_verified,
    p.is_online,
    p.last_seen_at,
    -- Primary photo
    (
      SELECT pp.storage_path
      FROM public.profile_photos pp
      WHERE pp.user_id = (CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END)
        AND pp.is_primary = TRUE
      LIMIT 1
    ) AS primary_photo_path,
    -- Latest message
    lm.id AS latest_message_id,
    CASE
      WHEN lm.deleted_at IS NOT NULL THEN 'This message was deleted'
      ELSE lm.content
    END AS latest_message_content,
    lm.sender_id AS latest_message_sender_id,
    lm.message_type AS latest_message_type,
    lm.created_at AS latest_message_created_at,
    -- Unread count (messages not sent by current user and not read)
    (
      SELECT COUNT(*)
      FROM public.messages msg
      WHERE msg.conversation_id = c.id
        AND msg.sender_id != v_user_id
        AND msg.is_read = FALSE
        AND msg.deleted_at IS NULL
    ) AS unread_count
  FROM public.conversations c
  JOIN public.matches m ON m.id = c.match_id
  JOIN public.profiles p ON p.id = (CASE WHEN m.user_a_id = v_user_id THEN m.user_b_id ELSE m.user_a_id END)
  -- Latest message via lateral join
  LEFT JOIN LATERAL (
    SELECT msg.id, msg.content, msg.sender_id, msg.message_type, msg.created_at, msg.deleted_at
    FROM public.messages msg
    WHERE msg.conversation_id = c.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) lm ON TRUE
  WHERE
    (m.user_a_id = v_user_id OR m.user_b_id = v_user_id)
    AND m.status = 'active'
  ORDER BY c.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- SECTION 5: RPC — get_messages
-- Returns paginated messages for a conversation.
-- Uses cursor-based pagination (before_id for loading older messages).
-- Only accessible to conversation members.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 30,
  p_before_id UUID DEFAULT NULL
)
RETURNS TABLE (
  message_id UUID,
  conversation_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_photo_path TEXT,
  message_type TEXT,
  content TEXT,
  attachment_path TEXT,
  is_read BOOLEAN,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_before_created_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is a member of this conversation
  IF NOT public.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  -- Get cursor timestamp if before_id provided
  IF p_before_id IS NOT NULL THEN
    SELECT msg.created_at INTO v_before_created_at
    FROM public.messages msg
    WHERE msg.id = p_before_id
      AND msg.conversation_id = p_conversation_id;
  END IF;

  RETURN QUERY
  SELECT
    msg.id AS message_id,
    msg.conversation_id,
    msg.sender_id,
    p.first_name AS sender_name,
    (
      SELECT pp.storage_path
      FROM public.profile_photos pp
      WHERE pp.user_id = msg.sender_id
        AND pp.is_primary = TRUE
      LIMIT 1
    ) AS sender_photo_path,
    msg.message_type,
    CASE
      WHEN msg.deleted_at IS NOT NULL THEN NULL
      ELSE msg.content
    END AS content,
    CASE
      WHEN msg.deleted_at IS NOT NULL THEN NULL
      ELSE msg.attachment_path
    END AS attachment_path,
    msg.is_read,
    msg.deleted_at,
    msg.created_at
  FROM public.messages msg
  JOIN public.profiles p ON p.id = msg.sender_id
  WHERE
    msg.conversation_id = p_conversation_id
    AND (
      p_before_id IS NULL
      OR (msg.created_at < v_before_created_at)
      OR (msg.created_at = v_before_created_at AND msg.id < p_before_id)
    )
  ORDER BY msg.created_at DESC, msg.id DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- SECTION 6: RPC — send_message
-- Validates and inserts a message into a conversation.
-- Enforces: authenticated sender, conversation membership,
-- active match, non-empty body, max length.
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id UUID,
  p_content TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_attachment_path TEXT DEFAULT NULL,
  p_client_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_message_id UUID;
  v_match_status TEXT;
  v_trimmed_content TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify conversation membership
  IF NOT public.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  -- Verify match is still active
  SELECT m.status INTO v_match_status
  FROM public.conversations c
  JOIN public.matches m ON m.id = c.match_id
  WHERE c.id = p_conversation_id;

  IF v_match_status != 'active' THEN
    RAISE EXCEPTION 'Match is no longer active';
  END IF;

  -- Validate message type
  IF p_message_type NOT IN ('text', 'image', 'gif', 'emoji') THEN
    RAISE EXCEPTION 'Invalid message type';
  END IF;

  -- Validate content for text messages
  IF p_message_type = 'text' THEN
    v_trimmed_content := TRIM(p_content);

    IF v_trimmed_content IS NULL OR v_trimmed_content = '' THEN
      RAISE EXCEPTION 'Message cannot be empty';
    END IF;

    IF LENGTH(v_trimmed_content) > 2000 THEN
      RAISE EXCEPTION 'Message exceeds maximum length of 2000 characters';
    END IF;
  ELSE
    v_trimmed_content := p_content;
  END IF;

  -- Insert message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    content,
    attachment_path,
    is_read
  )
  VALUES (
    p_conversation_id,
    v_user_id,
    p_message_type,
    v_trimmed_content,
    p_attachment_path,
    FALSE
  )
  RETURNING id INTO v_message_id;

  RETURN jsonb_build_object(
    'message_id', v_message_id,
    'client_id', p_client_id,
    'created_at', now()
  );
END;
$$;

-- ============================================================
-- SECTION 7: RPC — mark_messages_read
-- Marks all unread messages in a conversation as read,
-- where the sender is NOT the current user.
-- Batched for efficiency.
-- ============================================================
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID
)
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

  -- Verify conversation membership
  IF NOT public.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  -- Mark all unread messages from the other user as read
  UPDATE public.messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != v_user_id
    AND is_read = FALSE
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'marked_read', v_updated);
END;
$$;

-- ============================================================
-- SECTION 8: RPC — soft_delete_message
-- Soft-deletes a message (sets deleted_at).
-- Only the sender can delete their own message.
-- ============================================================
CREATE OR REPLACE FUNCTION public.soft_delete_message(
  p_message_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_sender_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get message sender
  SELECT sender_id INTO v_sender_id
  FROM public.messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF v_sender_id != v_user_id THEN
    RAISE EXCEPTION 'Cannot delete another user''s message';
  END IF;

  UPDATE public.messages
  SET deleted_at = now()
  WHERE id = p_message_id
    AND sender_id = v_user_id
    AND deleted_at IS NULL;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- SECTION 9: RPC — get_unread_message_count
-- Returns total unread message count across all conversations.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
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
  FROM public.messages msg
  JOIN public.conversations c ON c.id = msg.conversation_id
  JOIN public.matches m ON m.id = c.match_id
  WHERE
    (m.user_a_id = v_user_id OR m.user_b_id = v_user_id)
    AND msg.sender_id != v_user_id
    AND msg.is_read = FALSE
    AND msg.deleted_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================
-- SECTION 10: GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_messages(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;
