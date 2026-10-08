-- Phase 5: Browse/Explore Grid RPC Functions
-- Provides paginated, filtered profile browsing with profile view tracking.

-- ============================================================
-- RPC: get_browse_profiles
-- Returns eligible profiles for the Browse grid with filters.
-- Excludes: self, blocked users, users who blocked current user,
--           already passed, already liked, already super-liked,
--           incomplete profiles, profiles without photos.
-- Supports: gender, age range, verified only, online only,
--           interests filter, relationship intention, search by
--           first_name / city, sorting, cursor-based pagination.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_browse_profiles(
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0,
  p_gender TEXT DEFAULT NULL,
  p_min_age INTEGER DEFAULT NULL,
  p_max_age INTEGER DEFAULT NULL,
  p_verified_only BOOLEAN DEFAULT FALSE,
  p_online_only BOOLEAN DEFAULT FALSE,
  p_interest_names TEXT[] DEFAULT NULL,
  p_relationship_intention TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'recommended'
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
  interests JSONB,
  relationship_intention TEXT
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
    ) AS interests,
    dp.relationship_intention
  FROM public.profiles p
  LEFT JOIN public.dating_preferences dp ON dp.user_id = p.id
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

    -- Gender filter
    AND (
      p_gender IS NULL
      OR p_gender = 'everyone'
      OR (p_gender = 'women' AND p.gender = 'woman')
      OR (p_gender = 'men' AND p.gender = 'man')
      OR p.gender = p_gender
    )

    -- Age filter
    AND (
      p_min_age IS NULL
      OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER >= p_min_age
    )
    AND (
      p_max_age IS NULL
      OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER <= p_max_age
    )

    -- Verified only
    AND (NOT p_verified_only OR p.is_verified = TRUE)

    -- Online only
    AND (NOT p_online_only OR p.is_online = TRUE)

    -- Interests filter (profile must have ALL specified interests)
    AND (
      p_interest_names IS NULL
      OR array_length(p_interest_names, 1) = 0
      OR (
        SELECT COUNT(DISTINCT i.name)
        FROM public.user_interests ui
        JOIN public.interests i ON i.id = ui.interest_id
        WHERE ui.user_id = p.id AND i.name = ANY(p_interest_names)
      ) >= array_length(p_interest_names, 1)
    )

    -- Relationship intention filter
    AND (
      p_relationship_intention IS NULL
      OR dp.relationship_intention = p_relationship_intention
    )

    -- Search by first_name or city (case-insensitive prefix/contains)
    AND (
      p_search IS NULL
      OR p.first_name ILIKE '%' || p_search || '%'
      OR p.city ILIKE '%' || p_search || '%'
    )

  ORDER BY
    CASE WHEN p_sort = 'recently_active' THEN p.last_seen_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN p.created_at END DESC NULLS LAST,
    -- recommended / default: online first, verified, then recently active
    CASE WHEN p_sort = 'recommended' OR p_sort IS NULL THEN p.is_online::int END DESC,
    CASE WHEN p_sort = 'recommended' OR p_sort IS NULL THEN p.is_verified::int END DESC,
    CASE WHEN p_sort = 'recommended' OR p_sort IS NULL THEN p.last_seen_at END DESC NULLS LAST,
    p.created_at DESC

  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- RPC: record_profile_view
-- Records that the authenticated user viewed a profile.
-- Prevents self-views and deduplicates within a time window.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_profile_view(
  p_viewed_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer_id UUID;
BEGIN
  v_viewer_id := auth.uid();

  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Prevent self-view
  IF v_viewer_id = p_viewed_user_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'self_view');
  END IF;

  -- Deduplicate: only insert if no view in the last 30 minutes
  IF NOT EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE viewer_id = v_viewer_id
      AND viewed_user_id = p_viewed_user_id
      AND created_at > NOW() - INTERVAL '30 minutes'
  ) THEN
    INSERT INTO public.profile_views (viewer_id, viewed_user_id)
    VALUES (v_viewer_id, p_viewed_user_id);
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: get_browse_profile_count
-- Returns total count of eligible browse profiles for display.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_browse_profile_count()
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
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.profiles p
  WHERE
    p.id != v_user_id
    AND p.first_name IS NOT NULL
    AND p.date_of_birth IS NOT NULL
    AND p.gender IS NOT NULL
    AND p.bio IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.profile_photos pp WHERE pp.user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE b.blocker_id = v_user_id AND b.blocked_user_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM public.blocks b WHERE b.blocker_id = p.id AND b.blocked_user_id = v_user_id);

  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_browse_profiles(INTEGER, INTEGER, TEXT, INTEGER, INTEGER, BOOLEAN, BOOLEAN, TEXT[], TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_browse_profile_count() TO authenticated;
