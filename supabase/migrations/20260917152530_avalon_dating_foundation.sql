-- ============================================================
-- AVALON DATING — DATABASE FOUNDATION (Phase 2)
-- Migration: 20260917152530_avalon_dating_foundation.sql
-- ============================================================

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('woman', 'man', 'non-binary', 'prefer_not_to_say')),
    looking_for TEXT CHECK (looking_for IN ('men', 'women', 'everyone')),
    city TEXT,
    country TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILE PHOTOS
CREATE TABLE IF NOT EXISTS public.profile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INTERESTS (lookup table)
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. USER INTERESTS (junction)
CREATE TABLE IF NOT EXISTS public.user_interests (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, interest_id)
);

-- 5. DATING PREFERENCES
CREATE TABLE IF NOT EXISTS public.dating_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    min_age INTEGER CHECK (min_age >= 18),
    max_age INTEGER CHECK (max_age <= 100),
    max_distance_km INTEGER CHECK (max_distance_km > 0),
    preferred_gender TEXT,
    relationship_intention TEXT,
    show_verified_only BOOLEAN DEFAULT false,
    show_online_only BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LIKES
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT likes_no_self_like CHECK (from_user_id <> to_user_id),
    CONSTRAINT likes_unique_pair UNIQUE (from_user_id, to_user_id)
);

-- 7. PASSES
CREATE TABLE IF NOT EXISTS public.passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT passes_no_self_pass CHECK (from_user_id <> to_user_id),
    CONSTRAINT passes_unique_pair UNIQUE (from_user_id, to_user_id)
);

-- 8. SUPER LIKES
CREATE TABLE IF NOT EXISTS public.super_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT super_likes_no_self CHECK (from_user_id <> to_user_id),
    CONSTRAINT super_likes_unique_pair UNIQUE (from_user_id, to_user_id)
);

-- 9. MATCHES
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT matches_no_self_match CHECK (user_a_id <> user_b_id)
);

-- Prevent duplicate matches regardless of ordering (A+B == B+A)
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_pair
    ON public.matches (LEAST(user_a_id::TEXT, user_b_id::TEXT), GREATEST(user_a_id::TEXT, user_b_id::TEXT));

-- 10. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID UNIQUE NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'gif', 'emoji')),
    content TEXT,
    attachment_path TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    related_match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. PROFILE VIEWS
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT profile_views_no_self_view CHECK (viewer_id <> viewed_user_id)
);

-- 14. BLOCKS
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_user_id),
    CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_user_id)
);

-- 15. REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT reports_no_self_report CHECK (reporter_id <> reported_user_id)
);

-- 16. PROFILE BOOSTS
CREATE TABLE IF NOT EXISTS public.profile_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'vip')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    show_online_status BOOLEAN DEFAULT true,
    allow_messages BOOLEAN DEFAULT true,
    show_profile BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 2: INDEXES
-- ============================================================

-- profile_photos
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_display_order ON public.profile_photos(user_id, display_order);

-- likes
CREATE INDEX IF NOT EXISTS idx_likes_from_user_id ON public.likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user_id ON public.likes(to_user_id);

-- passes
CREATE INDEX IF NOT EXISTS idx_passes_from_user_id ON public.passes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_to_user_id ON public.passes(to_user_id);

-- super_likes
CREATE INDEX IF NOT EXISTS idx_super_likes_from_user_id ON public.super_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_to_user_id ON public.super_likes(to_user_id);

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_user_a_id ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b_id ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_id ON public.profile_views(viewed_user_id);

-- blocks
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_user_id ON public.blocks(blocked_user_id);

-- profiles discovery
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_country_city ON public.profiles(country, city);

-- ============================================================
-- SECTION 3: FUNCTIONS
-- ============================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Auto-create profile + settings + subscription + preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile row
    INSERT INTO public.profiles (id, first_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default subscription (free plan)
    INSERT INTO public.subscriptions (user_id, plan, status, started_at)
    VALUES (NEW.id, 'free', 'active', now())
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default dating preferences
    INSERT INTO public.dating_preferences (user_id, min_age, max_age, max_distance_km)
    VALUES (NEW.id, 18, 50, 100)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Helper: check if a user is a member of a match
CREATE OR REPLACE FUNCTION public.is_match_member(match_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_uuid
          AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    );
$$;

-- Helper: check if a user is a member of a conversation (via match)
CREATE OR REPLACE FUNCTION public.is_conversation_member(conversation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversations c
        JOIN public.matches m ON c.match_id = m.id
        WHERE c.id = conversation_uuid
          AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    );
$$;

-- ============================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 5: RLS POLICIES
-- ============================================================

-- ---- PROFILES ----
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- ---- PROFILE PHOTOS ----
DROP POLICY IF EXISTS "profile_photos_select_authenticated" ON public.profile_photos;
CREATE POLICY "profile_photos_select_authenticated"
ON public.profile_photos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "profile_photos_insert_own" ON public.profile_photos;
CREATE POLICY "profile_photos_insert_own"
ON public.profile_photos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_photos_update_own" ON public.profile_photos;
CREATE POLICY "profile_photos_update_own"
ON public.profile_photos FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_photos_delete_own" ON public.profile_photos;
CREATE POLICY "profile_photos_delete_own"
ON public.profile_photos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ---- INTERESTS (public read, no write for users) ----
DROP POLICY IF EXISTS "interests_select_public" ON public.interests;
CREATE POLICY "interests_select_public"
ON public.interests FOR SELECT
TO public
USING (true);

-- ---- USER INTERESTS ----
DROP POLICY IF EXISTS "user_interests_select_authenticated" ON public.user_interests;
CREATE POLICY "user_interests_select_authenticated"
ON public.user_interests FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "user_interests_insert_own" ON public.user_interests;
CREATE POLICY "user_interests_insert_own"
ON public.user_interests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_interests_delete_own" ON public.user_interests;
CREATE POLICY "user_interests_delete_own"
ON public.user_interests FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ---- DATING PREFERENCES ----
DROP POLICY IF EXISTS "dating_preferences_manage_own" ON public.dating_preferences;
CREATE POLICY "dating_preferences_manage_own"
ON public.dating_preferences FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ---- LIKES ----
DROP POLICY IF EXISTS "likes_select_own" ON public.likes;
CREATE POLICY "likes_select_own"
ON public.likes FOR SELECT
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;
CREATE POLICY "likes_insert_own"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "likes_delete_own" ON public.likes;
CREATE POLICY "likes_delete_own"
ON public.likes FOR DELETE
TO authenticated
USING (from_user_id = auth.uid());

-- ---- PASSES ----
DROP POLICY IF EXISTS "passes_select_own" ON public.passes;
CREATE POLICY "passes_select_own"
ON public.passes FOR SELECT
TO authenticated
USING (from_user_id = auth.uid());

DROP POLICY IF EXISTS "passes_insert_own" ON public.passes;
CREATE POLICY "passes_insert_own"
ON public.passes FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "passes_delete_own" ON public.passes;
CREATE POLICY "passes_delete_own"
ON public.passes FOR DELETE
TO authenticated
USING (from_user_id = auth.uid());

-- ---- SUPER LIKES ----
DROP POLICY IF EXISTS "super_likes_select_own" ON public.super_likes;
CREATE POLICY "super_likes_select_own"
ON public.super_likes FOR SELECT
TO authenticated
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "super_likes_insert_own" ON public.super_likes;
CREATE POLICY "super_likes_insert_own"
ON public.super_likes FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "super_likes_delete_own" ON public.super_likes;
CREATE POLICY "super_likes_delete_own"
ON public.super_likes FOR DELETE
TO authenticated
USING (from_user_id = auth.uid());

-- ---- MATCHES ----
DROP POLICY IF EXISTS "matches_select_members" ON public.matches;
CREATE POLICY "matches_select_members"
ON public.matches FOR SELECT
TO authenticated
USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

DROP POLICY IF EXISTS "matches_insert_authenticated" ON public.matches;
CREATE POLICY "matches_insert_authenticated"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

DROP POLICY IF EXISTS "matches_update_members" ON public.matches;
CREATE POLICY "matches_update_members"
ON public.matches FOR UPDATE
TO authenticated
USING (user_a_id = auth.uid() OR user_b_id = auth.uid())
WITH CHECK (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- ---- CONVERSATIONS ----
DROP POLICY IF EXISTS "conversations_select_members" ON public.conversations;
CREATE POLICY "conversations_select_members"
ON public.conversations FOR SELECT
TO authenticated
USING (public.is_match_member(match_id));

DROP POLICY IF EXISTS "conversations_insert_members" ON public.conversations;
CREATE POLICY "conversations_insert_members"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (public.is_match_member(match_id));

DROP POLICY IF EXISTS "conversations_update_members" ON public.conversations;
CREATE POLICY "conversations_update_members"
ON public.conversations FOR UPDATE
TO authenticated
USING (public.is_match_member(match_id))
WITH CHECK (public.is_match_member(match_id));

-- ---- MESSAGES ----
DROP POLICY IF EXISTS "messages_select_conversation_members" ON public.messages;
CREATE POLICY "messages_select_conversation_members"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "messages_insert_as_sender" ON public.messages;
CREATE POLICY "messages_insert_as_sender"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- ---- NOTIFICATIONS ----
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ---- PROFILE VIEWS ----
DROP POLICY IF EXISTS "profile_views_select_own" ON public.profile_views;
CREATE POLICY "profile_views_select_own"
ON public.profile_views FOR SELECT
TO authenticated
USING (viewer_id = auth.uid() OR viewed_user_id = auth.uid());

DROP POLICY IF EXISTS "profile_views_insert_own" ON public.profile_views;
CREATE POLICY "profile_views_insert_own"
ON public.profile_views FOR INSERT
TO authenticated
WITH CHECK (viewer_id = auth.uid());

-- ---- BLOCKS ----
DROP POLICY IF EXISTS "blocks_select_own" ON public.blocks;
CREATE POLICY "blocks_select_own"
ON public.blocks FOR SELECT
TO authenticated
USING (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_insert_own" ON public.blocks;
CREATE POLICY "blocks_insert_own"
ON public.blocks FOR INSERT
TO authenticated
WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "blocks_delete_own" ON public.blocks;
CREATE POLICY "blocks_delete_own"
ON public.blocks FOR DELETE
TO authenticated
USING (blocker_id = auth.uid());

-- ---- REPORTS ----
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own"
ON public.reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- ---- PROFILE BOOSTS ----
DROP POLICY IF EXISTS "profile_boosts_select_own" ON public.profile_boosts;
CREATE POLICY "profile_boosts_select_own"
ON public.profile_boosts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_boosts_insert_own" ON public.profile_boosts;
CREATE POLICY "profile_boosts_insert_own"
ON public.profile_boosts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ---- SUBSCRIPTIONS ----
-- Users can read their own subscription but CANNOT modify it directly
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
ON public.subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for subscriptions for regular users.
-- Subscription changes must go through server-side/payment logic using service role.

-- ---- USER SETTINGS ----
DROP POLICY IF EXISTS "user_settings_manage_own" ON public.user_settings;
CREATE POLICY "user_settings_manage_own"
ON public.user_settings FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- SECTION 6: TRIGGERS
-- ============================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_dating_preferences ON public.dating_preferences;
CREATE TRIGGER set_updated_at_dating_preferences
    BEFORE UPDATE ON public.dating_preferences
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_conversations ON public.conversations;
CREATE TRIGGER set_updated_at_conversations
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 7: SEED DATA — INTERESTS
-- ============================================================

INSERT INTO public.interests (name) VALUES
    ('Travel'),
    ('Fitness'),
    ('Music'),
    ('Faith'),
    ('Food'),
    ('Business'),
    ('Movies'),
    ('Reading'),
    ('Fashion'),
    ('Photography'),
    ('Gaming'),
    ('Nature'),
    ('Sports'),
    ('Art'),
    ('Entrepreneurship')
ON CONFLICT (name) DO NOTHING;
