'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Browser Supabase client.
 *
 * @supabase/ssr (0.6.x) and @supabase/supabase-js (2.x, newer) disagree on the
 * order of SupabaseClient's generic parameters, which collapses every table
 * query type to `never`. Re-typing the returned client with supabase-js's own
 * SupabaseClient<Database> uses the correct generics. Runtime is unchanged.
 */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as SupabaseClient<Database>;
}
