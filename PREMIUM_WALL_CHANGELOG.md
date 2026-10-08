# Avalon Premium Paywall — Integration Changelog

## Final Tinder-style paywall integration

- Added `src/components/premium/PremiumPaywallModal.tsx` with the approved black/gold Avalon Premium UI.
- African launch pricing: $30/week, $199/month (default + Most Popular), $399/3 months.
- Updated the 1-week Selar checkout to `https://selar.com/u3vn137281?currency=USD`.
- Added responsive slide-up animation and dark blurred backdrop so the page behind the paywall is visibly blurred and non-interactive.
- Added global `PremiumPaywallProvider` so chat, contact sharing, locked likes, and other premium triggers can open the same paywall.
- Added immediate client-side contact detection plus server-side contact enforcement.
- Enforced the 20 free messages per conversation **per sender** before message #21 can be inserted.
- Preserved server-authoritative `send_message()` enforcement and subscription `plan` column.
- Added Selar checkout environment variables:
  - `NEXT_PUBLIC_SELAR_WEEK_URL`
  - `NEXT_PUBLIC_SELAR_MONTH_URL`
  - `NEXT_PUBLIC_SELAR_3MONTHS_URL`
- Checkout navigation appends `user_id`, `email`, and `plan` without granting Premium on button click.
- Added a locked "See who likes you" preview trigger in the discovery sidebar.
- Premium-only voice/video/attachment/emoji actions now open the Premium paywall instead of navigating to a generic page.
- No `.env` file is included in the final project archive.

## Payment activation

The project intentionally does **not** fake successful payment or automatically set `subscriptions.plan = 'premium'` from the browser. A verified Selar payment confirmation/webhook must be wired to Supabase before paid access can be activated automatically.
