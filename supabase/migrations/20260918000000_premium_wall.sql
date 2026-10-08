-- AVALON DATING — PREMIUM WALL / SERVER-AUTHORITATIVE CHAT ENTITLEMENTS
-- Free: 20 messages sent by the free user per conversation + contact sharing blocked.
-- Premium/VIP: unlimited chat and contact sharing.
-- This migration intentionally does not grant paid access; a verified payment
-- provider must activate subscriptions.plan/status server-side.

CREATE OR REPLACE FUNCTION public.get_chat_entitlement(
  p_conversation_id UUID,
  p_content TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan TEXT := 'free';
  v_status TEXT := 'active';
  v_message_count INTEGER := 0;
  v_contact_detected BOOLEAN := FALSE;
  v_blocked_reason TEXT := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  SELECT COALESCE(s.plan, 'free'), COALESCE(s.status, 'active')
    INTO v_plan, v_status
  FROM public.subscriptions AS s
  WHERE s.user_id = v_user_id
  LIMIT 1;

  IF v_status <> 'active' THEN
    v_plan := 'free';
  END IF;

  SELECT COUNT(*)::INTEGER
    INTO v_message_count
  FROM public.messages AS m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id = v_user_id;

  IF COALESCE(p_content, '') <> '' THEN
    v_contact_detected :=
      COALESCE(p_content, '') ~* '(^|[^0-9])(?:\+?[0-9][-.[:space:]()]?){7,15}([^0-9]|$)'
      OR p_content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
      OR p_content ~* 'instagram\.com/[A-Z0-9_.]+|ig:[[:space:]]*[A-Z0-9_.]+|(^|[[:space:]])@[A-Z0-9_.]{2,}'
      OR p_content ~* 'facebook\.com/[A-Z0-9_.]+|fb\.com/[A-Z0-9_.]+'
      OR p_content ~* 't\.me/[A-Z0-9_.]+|telegram'
      OR p_content ~* 'wa\.me/[A-Z0-9]+|whatsapp(?:\.com)?/|(^|[[:space:]])whatsapp([[:space:]]|$)';
  END IF;

  IF v_plan = 'free' AND v_message_count >= 20 THEN
    v_blocked_reason := 'message_limit';
  ELSIF v_plan = 'free' AND v_contact_detected THEN
    v_blocked_reason := 'contact';
  END IF;

  RETURN jsonb_build_object(
    'plan', v_plan,
    'message_count', v_message_count,
    'contact_detected', v_contact_detected,
    'blocked_reason', v_blocked_reason,
    'can_send', v_blocked_reason IS NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_chat_entitlement(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chat_entitlement(UUID, TEXT) TO authenticated;

-- Replace the Phase 7 RPC while preserving its public signature and return shape.
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
  v_user_id UUID := auth.uid();
  v_message_id UUID;
  v_match_status TEXT;
  v_trimmed_content TEXT;
  v_plan TEXT := 'free';
  v_status TEXT := 'active';
  v_message_count INTEGER := 0;
  v_contact_detected BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_conversation_member(p_conversation_id) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  SELECT m.status
    INTO v_match_status
  FROM public.conversations AS c
  JOIN public.matches AS m ON m.id = c.match_id
  WHERE c.id = p_conversation_id;

  IF v_match_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Match is no longer active';
  END IF;

  SELECT COALESCE(s.plan, 'free'), COALESCE(s.status, 'active')
    INTO v_plan, v_status
  FROM public.subscriptions AS s
  WHERE s.user_id = v_user_id
  LIMIT 1;

  IF v_status <> 'active' THEN
    v_plan := 'free';
  END IF;

  IF p_message_type NOT IN ('text', 'image', 'gif', 'emoji') THEN
    RAISE EXCEPTION 'Invalid message type';
  END IF;

  IF p_message_type = 'text' THEN
    v_trimmed_content := TRIM(COALESCE(p_content, ''));
    IF v_trimmed_content = '' THEN
      RAISE EXCEPTION 'Message cannot be empty';
    END IF;
    IF LENGTH(v_trimmed_content) > 2000 THEN
      RAISE EXCEPTION 'Message exceeds maximum length of 2000 characters';
    END IF;

    v_contact_detected :=
      v_trimmed_content ~* '(^|[^0-9])(?:\+?[0-9][-.[:space:]()]?){7,15}([^0-9]|$)'
      OR v_trimmed_content ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}'
      OR v_trimmed_content ~* 'instagram\.com/[A-Z0-9_.]+|ig:[[:space:]]*[A-Z0-9_.]+|(^|[[:space:]])@[A-Z0-9_.]{2,}'
      OR v_trimmed_content ~* 'facebook\.com/[A-Z0-9_.]+|fb\.com/[A-Z0-9_.]+'
      OR v_trimmed_content ~* 't\.me/[A-Z0-9_.]+|telegram'
      OR v_trimmed_content ~* 'wa\.me/[A-Z0-9]+|whatsapp(?:\.com)?/|(^|[[:space:]])whatsapp([[:space:]]|$)';
  ELSE
    v_trimmed_content := p_content;
  END IF;

  -- Serialize sends for a conversation so concurrent free-user sends cannot
  -- race through the 20-message ceiling.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_conversation_id::TEXT, 0));

  SELECT COUNT(*)::INTEGER
    INTO v_message_count
  FROM public.messages AS m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id = v_user_id;

  IF v_plan = 'free' AND v_message_count >= 20 THEN
    RAISE EXCEPTION 'FREE_MESSAGE_LIMIT_REACHED';
  END IF;

  IF v_plan = 'free' AND v_contact_detected THEN
    RAISE EXCEPTION 'CONTACT_SHARING_BLOCKED';
  END IF;

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

REVOKE ALL ON FUNCTION public.send_message(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_message(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
