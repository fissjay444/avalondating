# Avalon Dating – audit notes (Oct 8, 2026)

Verified: 62 TS/TSX files parse with no syntax errors; all `@/` and relative imports resolve;
every frontend `.rpc()`/`.from()` name exists in the live Supabase project's schema/migrations;
live DB enforces 18+ (handle_new_user + profile trigger), locked DOB, straight-only pairing, RLS on all public tables.

NOT verified (sandbox has no network): `npm install`, `tsc`, `eslint`, `next build`. Run them locally or let Vercel build.

Fixed: dead links (/sign-up-login-screen -> /signup, /discovery-page -> /discover); stale pricing text
($199/mo, "Elite $199", $299 VIP); removed unused PricingCard.tsx and tsconfig.tsbuildinfo;
.gitignore no longer ignores package-lock.json; premium page shows the "checkout not configured" notice;
.env.example lists only variables the code uses.

Optional: supabase/migrations/20261008000000_harden_subscriptions_grants.sql (not applied).
