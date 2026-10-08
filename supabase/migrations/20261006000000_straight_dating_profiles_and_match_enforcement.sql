-- Avalon Dating: straight-only profile and matching enforcement
-- Applied to production through Supabase migration tooling.

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_gender_check,
  DROP CONSTRAINT IF EXISTS profiles_looking_for_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR gender IN ('woman','man')),
  ADD CONSTRAINT profiles_looking_for_check CHECK (looking_for IS NULL OR looking_for IN ('men','women')),
  ADD CONSTRAINT profiles_straight_pairing_check CHECK (
    gender IS NULL OR looking_for IS NULL OR
    (gender='woman' AND looking_for='men') OR (gender='man' AND looking_for='women')
  );

ALTER TABLE public.dating_preferences
  DROP CONSTRAINT IF EXISTS dating_preferences_preferred_gender_check;

ALTER TABLE public.dating_preferences
  ADD CONSTRAINT dating_preferences_preferred_gender_check CHECK (preferred_gender IS NULL OR preferred_gender IN ('men','women'));

CREATE OR REPLACE FUNCTION public.validate_avalon_straight_preferences()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_gender text; v_preferred text;
BEGIN
  IF TG_TABLE_NAME='profiles' THEN
    IF NEW.gender IS NOT NULL AND NEW.looking_for IS NOT NULL AND NOT (
      (NEW.gender='woman' AND NEW.looking_for='men') OR (NEW.gender='man' AND NEW.looking_for='women')
    ) THEN
      RAISE EXCEPTION 'Avalon currently supports straight dating only: women match with men and men match with women';
    END IF;
  ELSIF TG_TABLE_NAME='dating_preferences' THEN
    v_preferred:=NEW.preferred_gender;
    IF v_preferred IS NOT NULL THEN
      SELECT gender INTO v_gender FROM public.profiles WHERE id=NEW.user_id;
      IF v_gender='woman' AND v_preferred<>'men' THEN
        RAISE EXCEPTION 'Women on Avalon can only set men as their preferred gender';
      ELSIF v_gender='man' AND v_preferred<>'women' THEN
        RAISE EXCEPTION 'Men on Avalon can only set women as their preferred gender';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS validate_avalon_straight_profile ON public.profiles;
CREATE TRIGGER validate_avalon_straight_profile
BEFORE INSERT OR UPDATE OF gender,looking_for ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_avalon_straight_preferences();

DROP TRIGGER IF EXISTS validate_avalon_straight_preferences ON public.dating_preferences;
CREATE TRIGGER validate_avalon_straight_preferences
BEFORE INSERT OR UPDATE OF preferred_gender ON public.dating_preferences
FOR EACH ROW EXECUTE FUNCTION public.validate_avalon_straight_preferences();

CREATE OR REPLACE FUNCTION public.record_like(p_to_user_id UUID,p_is_super_like BOOLEAN DEFAULT FALSE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_from_user_id UUID; v_from_gender TEXT; v_to_gender TEXT;
  v_existing_like UUID; v_existing_super_like UUID; v_reciprocal_like UUID; v_reciprocal_super_like UUID;
  v_match_id UUID; v_conversation_id UUID; v_existing_match UUID;
BEGIN
  v_from_user_id:=auth.uid(); IF v_from_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_from_user_id=p_to_user_id THEN RAISE EXCEPTION 'Cannot like yourself'; END IF;
  SELECT gender INTO v_from_gender FROM public.profiles WHERE id=v_from_user_id;
  SELECT gender INTO v_to_gender FROM public.profiles WHERE id=p_to_user_id;
  IF v_to_gender IS NULL THEN RAISE EXCEPTION 'Target user not found'; END IF;
  IF v_from_gender NOT IN ('woman','man') OR v_to_gender NOT IN ('woman','man') THEN RAISE EXCEPTION 'Avalon currently supports straight dating only'; END IF;
  IF v_from_gender=v_to_gender THEN RAISE EXCEPTION 'Avalon currently matches women with men and men with women'; END IF;
  IF EXISTS (SELECT 1 FROM public.blocks WHERE (blocker_id=v_from_user_id AND blocked_user_id=p_to_user_id) OR (blocker_id=p_to_user_id AND blocked_user_id=v_from_user_id)) THEN RAISE EXCEPTION 'Blocked user'; END IF;
  IF p_is_super_like THEN
    SELECT id INTO v_existing_super_like FROM public.super_likes WHERE from_user_id=v_from_user_id AND to_user_id=p_to_user_id;
    IF v_existing_super_like IS NOT NULL THEN RETURN jsonb_build_object('matched',false,'match_id',null,'already_done',true); END IF;
    INSERT INTO public.super_likes(from_user_id,to_user_id) VALUES(v_from_user_id,p_to_user_id) ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_existing_like FROM public.likes WHERE from_user_id=v_from_user_id AND to_user_id=p_to_user_id;
    IF v_existing_like IS NOT NULL THEN RETURN jsonb_build_object('matched',false,'match_id',null,'already_done',true); END IF;
    INSERT INTO public.likes(from_user_id,to_user_id) VALUES(v_from_user_id,p_to_user_id) ON CONFLICT DO NOTHING;
  END IF;
  SELECT id INTO v_reciprocal_like FROM public.likes WHERE from_user_id=p_to_user_id AND to_user_id=v_from_user_id;
  SELECT id INTO v_reciprocal_super_like FROM public.super_likes WHERE from_user_id=p_to_user_id AND to_user_id=v_from_user_id;
  IF v_reciprocal_like IS NULL AND v_reciprocal_super_like IS NULL THEN RETURN jsonb_build_object('matched',false,'match_id',null,'already_done',false); END IF;
  SELECT id INTO v_existing_match FROM public.matches WHERE user_a_id=LEAST(v_from_user_id,p_to_user_id) AND user_b_id=GREATEST(v_from_user_id,p_to_user_id) AND status='active';
  IF v_existing_match IS NOT NULL THEN RETURN jsonb_build_object('matched',true,'match_id',v_existing_match,'already_done',true); END IF;
  INSERT INTO public.matches(user_a_id,user_b_id,status) VALUES(LEAST(v_from_user_id,p_to_user_id),GREATEST(v_from_user_id,p_to_user_id),'active') RETURNING id INTO v_match_id;
  INSERT INTO public.conversations(match_id) VALUES(v_match_id) ON CONFLICT(match_id) DO NOTHING RETURNING id INTO v_conversation_id;
  INSERT INTO public.notifications(user_id,type,title,body,related_user_id,related_match_id) VALUES(p_to_user_id,'match','New Match! 💜','You have a new match on Avalon Dating!',v_from_user_id,v_match_id);
  INSERT INTO public.notifications(user_id,type,title,body,related_user_id,related_match_id) VALUES(v_from_user_id,'match','New Match! 💜','You have a new match on Avalon Dating!',p_to_user_id,v_match_id);
  RETURN jsonb_build_object('matched',true,'match_id',v_match_id,'already_done',false);
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO v_existing_match FROM public.matches WHERE user_a_id=LEAST(v_from_user_id,p_to_user_id) AND user_b_id=GREATEST(v_from_user_id,p_to_user_id);
  RETURN jsonb_build_object('matched',true,'match_id',v_existing_match,'already_done',true);
END; $$;

CREATE OR REPLACE FUNCTION public.get_discovery_profiles(p_limit INTEGER DEFAULT 10,p_offset INTEGER DEFAULT 0)
RETURNS TABLE(id UUID,first_name TEXT,date_of_birth DATE,gender TEXT,city TEXT,country TEXT,bio TEXT,is_verified BOOLEAN,is_online BOOLEAN,last_seen_at TIMESTAMPTZ,age INTEGER,photos JSONB,interests JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user_id UUID; v_prefs RECORD; v_gender TEXT;
BEGIN
  v_user_id:=auth.uid(); IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT gender INTO v_gender FROM public.profiles WHERE id=v_user_id;
  SELECT * INTO v_prefs FROM public.dating_preferences WHERE user_id=v_user_id;
  RETURN QUERY
  SELECT p.id,p.first_name,p.date_of_birth,p.gender,p.city,p.country,p.bio,p.is_verified,p.is_online,p.last_seen_at,
    EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',pp.id,'storage_path',pp.storage_path,'display_order',pp.display_order,'is_primary',pp.is_primary) ORDER BY pp.display_order) FROM public.profile_photos pp WHERE pp.user_id=p.id),'[]'::jsonb),
    COALESCE((SELECT jsonb_agg(i.name ORDER BY i.name) FROM public.user_interests ui JOIN public.interests i ON i.id=ui.interest_id WHERE ui.user_id=p.id),'[]'::jsonb)
  FROM public.profiles p
  WHERE p.id<>v_user_id AND p.first_name IS NOT NULL AND p.date_of_birth IS NOT NULL AND p.gender IN ('woman','man')
    AND p.bio IS NOT NULL AND EXISTS(SELECT 1 FROM public.profile_photos pp WHERE pp.user_id=p.id)
    AND v_gender IN ('woman','man') AND p.gender=CASE WHEN v_gender='woman' THEN 'man' ELSE 'woman' END
    AND NOT EXISTS(SELECT 1 FROM public.likes l WHERE l.from_user_id=v_user_id AND l.to_user_id=p.id)
    AND NOT EXISTS(SELECT 1 FROM public.passes pa WHERE pa.from_user_id=v_user_id AND pa.to_user_id=p.id)
    AND NOT EXISTS(SELECT 1 FROM public.super_likes sl WHERE sl.from_user_id=v_user_id AND sl.to_user_id=p.id)
    AND NOT EXISTS(SELECT 1 FROM public.blocks b WHERE b.blocker_id=v_user_id AND b.blocked_user_id=p.id)
    AND NOT EXISTS(SELECT 1 FROM public.blocks b WHERE b.blocker_id=p.id AND b.blocked_user_id=v_user_id)
    AND (v_prefs IS NULL OR v_prefs.min_age IS NULL OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER>=v_prefs.min_age)
    AND (v_prefs IS NULL OR v_prefs.max_age IS NULL OR EXTRACT(YEAR FROM AGE(p.date_of_birth))::INTEGER<=v_prefs.max_age)
    AND (v_prefs IS NULL OR NOT v_prefs.show_verified_only OR p.is_verified=TRUE)
    AND (v_prefs IS NULL OR NOT v_prefs.show_online_only OR p.is_online=TRUE)
  ORDER BY p.is_online DESC,p.created_at DESC
  LIMIT GREATEST(p_limit,1) OFFSET GREATEST(p_offset,0);
END; $$;

GRANT EXECUTE ON FUNCTION public.record_like(UUID,BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discovery_profiles(INTEGER,INTEGER) TO authenticated;
