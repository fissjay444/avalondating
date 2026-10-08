-- Phase 4: Swipe Engine RPC Functions
-- Atomic like/super-like with match detection

-- ============================================================
-- RPC: record_like
-- Atomically records a like, checks for mutual match,
-- creates match + conversation + notification if matched.
-- Returns: { matched: boolean, match_id: uuid | null }
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
      -- Already super liked, idempotent return
      RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', true);
    END IF;

    -- Insert super like
    INSERT INTO public.super_likes (from_user_id, to_user_id)
    VALUES (v_from_user_id, p_to_user_id)
    ON CONFLICT DO NOTHING;

  ELSE
    -- Check for existing like
    SELECT id INTO v_existing_like
    FROM public.likes
    WHERE from_user_id = v_from_user_id AND to_user_id = p_to_user_id;

    IF v_existing_like IS NOT NULL THEN
      -- Already liked, idempotent return
      RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', true);
    END IF;

    -- Insert like
    INSERT INTO public.likes (from_user_id, to_user_id)
    VALUES (v_from_user_id, p_to_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for reciprocal interest (like or super_like from target to us)
  SELECT id INTO v_reciprocal_like
  FROM public.likes
  WHERE from_user_id = p_to_user_id AND to_user_id = v_from_user_id;

  SELECT id INTO v_reciprocal_super_like
  FROM public.super_likes
  WHERE from_user_id = p_to_user_id AND to_user_id = v_from_user_id;

  -- If no reciprocal interest, return no match
  IF v_reciprocal_like IS NULL AND v_reciprocal_super_like IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'match_id', null, 'already_done', false);
  END IF;

  -- Check for existing match (order-independent)
  SELECT id INTO v_existing_match
  FROM public.matches
  WHERE (
    (user_a_id = LEAST(v_from_user_id, p_to_user_id) AND user_b_id = GREATEST(v_from_user_id, p_to_user_id))
  )
  AND status = 'active';

  IF v_existing_match IS NOT NULL THEN
    -- Match already exists, return it
    RETURN jsonb_build_object('matched', true, 'match_id', v_existing_match, 'already_done', true);
  END IF;

  -- Create match (order-independent: smaller UUID is always user_a)
  INSERT INTO public.matches (user_a_id, user_b_id, status)
  VALUES (
    LEAST(v_from_user_id, p_to_user_id),
    GREATEST(v_from_user_id, p_to_user_id),
    'active'
  )
  RETURNING id INTO v_match_id;

  -- Create conversation for this match
  INSERT INTO public.conversations (match_id)
  VALUES (v_match_id)
  ON CONFLICT (match_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Create notification for the other user (they got a match)
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES (
    p_to_user_id,
    'match',
    'New Match! 💜',
    'You have a new match on Avalon Dating!',
    v_from_user_id,
    v_match_id
  );

  -- Create notification for the current user too
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_match_id)
  VALUES (
    v_from_user_id,
    'match',
    'New Match! 💜',
    'You have a new match on Avalon Dating!',
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
-- RPC: record_pass
-- Records a pass for the authenticated user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_pass(
  p_to_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_user_id UUID;
BEGIN
  v_from_user_id := auth.uid();

  IF v_from_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Cannot pass yourself';
  END IF;

  INSERT INTO public.passes (from_user_id, to_user_id)
  VALUES (v_from_user_id, p_to_user_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: record_block
-- Blocks a user and removes them from discovery.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_block(
  p_blocked_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocker_id UUID;
BEGIN
  v_blocker_id := auth.uid();

  IF v_blocker_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_blocker_id = p_blocked_user_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  INSERT INTO public.blocks (blocker_id, blocked_user_id)
  VALUES (v_blocker_id, p_blocked_user_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: record_report
-- Reports a user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_report(
  p_reported_user_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporter_id UUID;
BEGIN
  v_reporter_id := auth.uid();

  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_reporter_id = p_reported_user_id THEN
    RAISE EXCEPTION 'Cannot report yourself';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  INSERT INTO public.reports (reporter_id, reported_user_id, reason, description)
  VALUES (v_reporter_id, p_reported_user_id, p_reason, p_description)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: get_discovery_profiles
-- Returns eligible profiles for discovery with filtering.
-- Excludes: self, blocked, already liked/passed/super-liked.
-- Applies dating preferences filters.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  city TEXT,
  country TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  is_online BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  age INTEGER,
  photos JSONB,
  interests JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_prefs RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch user's dating preferences
  SELECT * INTO v_prefs
  FROM public.dating_preferences
  WHERE user_id = v_user_id;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.date_of_birth,
    p.gender,
    p.city,
    p.country,
    p.bio,
    p.is_verified,
    p.is_online,
    p.last_seen_at,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER AS age,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pp.id,
            'storage_path', pp.storage_path,
            'display_order', pp.display_order,
            'is_primary', pp.is_primary
          ) ORDER BY pp.display_order ASC
        )
        FROM public.profile_photos pp
        WHERE pp.user_id = p.id
      ),
      '[]'::jsonb
    ) AS photos,
    COALESCE(
      (
        SELECT jsonb_agg(i.name ORDER BY i.name)
        FROM public.user_interests ui
        JOIN public.interests i ON i.id = ui.interest_id
        WHERE ui.user_id = p.id
      ),
      '[]'::jsonb
    ) AS interests
  FROM public.profiles p
  WHERE
    -- Not self
    p.id != v_user_id

    -- Has required profile info
    AND p.first_name IS NOT NULL
    AND p.date_of_birth IS NOT NULL
    AND p.gender IS NOT NULL
    AND p.bio IS NOT NULL

    -- Has at least one photo
    AND EXISTS (
      SELECT 1 FROM public.profile_photos pp WHERE pp.user_id = p.id
    )

    -- Not already liked
    AND NOT EXISTS (
      SELECT 1 FROM public.likes l
      WHERE l.from_user_id = v_user_id AND l.to_user_id = p.id
    )

    -- Not already passed
    AND NOT EXISTS (
      SELECT 1 FROM public.passes pa
      WHERE pa.from_user_id = v_user_id AND pa.to_user_id = p.id
    )

    -- Not already super liked
    AND NOT EXISTS (
      SELECT 1 FROM public.super_likes sl
      WHERE sl.from_user_id = v_user_id AND sl.to_user_id = p.id
    )

    -- Not blocked by current user
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE b.blocker_id = v_user_id AND b.blocked_user_id = p.id
    )

    -- Not blocking current user
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE b.blocker_id = p.id AND b.blocked_user_id = v_user_id
    )

    -- Gender preference filter
    AND (
      v_prefs IS NULL
      OR v_prefs.preferred_gender IS NULL
      OR v_prefs.preferred_gender = 'everyone'
      OR (v_prefs.preferred_gender = 'women' AND p.gender = 'woman')
      OR (v_prefs.preferred_gender = 'men' AND p.gender = 'man')
      OR (v_prefs.preferred_gender = p.gender)
    )

    -- Age filter
    AND (
      v_prefs IS NULL
      OR v_prefs.min_age IS NULL
      OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER >= v_prefs.min_age
    )
    AND (
      v_prefs IS NULL
      OR v_prefs.max_age IS NULL
      OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER <= v_prefs.max_age
    )

    -- Verified only filter
    AND (
      v_prefs IS NULL
      OR NOT v_prefs.show_verified_only
      OR p.is_verified = TRUE
    )

    -- Online only filter
    AND (
      v_prefs IS NULL
      OR NOT v_prefs.show_online_only
      OR p.is_online = TRUE
    )

  ORDER BY
    -- Prioritize: online first, then verified, then recently active
    p.is_online DESC,
    p.is_verified DESC,
    p.last_seen_at DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.record_like(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_pass(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_block(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discovery_profiles(INTEGER, INTEGER) TO authenticated;

-- Unique constraint on passes to prevent duplicates (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'passes_from_to_unique'
  ) THEN
    ALTER TABLE public.passes ADD CONSTRAINT passes_from_to_unique UNIQUE (from_user_id, to_user_id);
  END IF;
END $$;

-- Unique constraint on likes to prevent duplicates (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_from_to_unique'
  ) THEN
    ALTER TABLE public.likes ADD CONSTRAINT likes_from_to_unique UNIQUE (from_user_id, to_user_id);
  END IF;
END $$;

-- Unique constraint on super_likes to prevent duplicates (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'super_likes_from_to_unique'
  ) THEN
    ALTER TABLE public.super_likes ADD CONSTRAINT super_likes_from_to_unique UNIQUE (from_user_id, to_user_id);
  END IF;
END $$;

-- Unique constraint on blocks to prevent duplicates (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blocks_blocker_blocked_unique'
  ) THEN
    ALTER TABLE public.blocks ADD CONSTRAINT blocks_blocker_blocked_unique UNIQUE (blocker_id, blocked_user_id);
  END IF;
END $$;

-- Unique index on matches (order-independent pair) if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'matches_unique_pair_idx'
  ) THEN
    CREATE UNIQUE INDEX matches_unique_pair_idx
    ON public.matches (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));
  END IF;
END $$;
