-- OPTIONAL hardening (NOT applied automatically). RLS already blocks client writes
-- to public.subscriptions (only a SELECT policy exists); this removes the write
-- privileges too, as defense in depth. service_role (payment webhook) is unaffected.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.subscriptions FROM anon, authenticated;
REVOKE ALL ON public.subscriptions FROM anon;
