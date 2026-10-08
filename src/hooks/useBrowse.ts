// Browse profile hook — Phase 5
// Shares DiscoveryProfile type and action RPCs from useDiscovery.
// Adds browse-specific: filters, pagination, profile view tracking.
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';

export type { DiscoveryProfile };

export interface BrowseFilters {
  gender: string;
  minAge: number;
  maxAge: number;
  verifiedOnly: boolean;
  onlineOnly: boolean;
  interests: string[];
  relationshipIntention: string;
  search: string;
  sort: 'recommended' | 'recently_active' | 'newest';
}

export const DEFAULT_FILTERS: BrowseFilters = {
  gender: '',
  minAge: 18,
  maxAge: 60,
  verifiedOnly: false,
  onlineOnly: false,
  interests: [],
  relationshipIntention: '',
  search: '',
  sort: 'recommended',
};

const PAGE_SIZE = 12;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPhotoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

export interface LikeResult {
  matched: boolean;
  match_id: string | null;
  already_done: boolean;
}

export function useBrowse() {
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);

  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);
  const supabase = createClient();

  const buildRpcParams = useCallback((f: BrowseFilters, offset: number) => ({
    p_limit: PAGE_SIZE,
    p_offset: offset,
    p_gender: f.gender || null,
    p_min_age: f.minAge !== 18 ? f.minAge : null,
    p_max_age: f.maxAge !== 60 ? f.maxAge : null,
    p_verified_only: f.verifiedOnly,
    p_online_only: f.onlineOnly,
    p_interest_names: f.interests.length > 0 ? f.interests : null,
    p_relationship_intention: f.relationshipIntention || null,
    p_search: f.search.trim() || null,
    p_sort: f.sort,
  }), []);

  const fetchProfiles = useCallback(async (newFilters?: BrowseFilters, reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const activeFilters = newFilters ?? filters;
    const offset = reset ? 0 : offsetRef.current;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = buildRpcParams(activeFilters, offset);
      const { data, error: rpcError } = await (supabase as any).rpc('get_browse_profiles', params);

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const rows = (data as unknown as DiscoveryProfile[]) || [];
      const newOffset = offset + rows.length;
      offsetRef.current = newOffset;
      setHasMore(rows.length === PAGE_SIZE);

      if (reset) {
        setProfiles(rows);
      } else {
        setProfiles(prev => {
          // Deduplicate by id
          const existingIds = new Set(prev.map(p => p.id));
          const unique = rows.filter(r => !existingIds.has(r.id));
          return [...prev, ...unique];
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [filters, buildRpcParams, supabase]);

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await (supabase as any).rpc('get_browse_profile_count');
      if (typeof data === 'number') setTotalCount(data);
    } catch {
      // non-critical
    }
  }, [supabase]);

  const applyFilters = useCallback((newFilters: BrowseFilters) => {
    setFilters(newFilters);
    offsetRef.current = 0;
    setHasMore(true);
    fetchProfiles(newFilters, true);
  }, [fetchProfiles]);

  const loadMore = useCallback(() => {
    if (!fetchingRef.current && hasMore) {
      fetchProfiles(undefined, false);
    }
  }, [fetchProfiles, hasMore]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setHasMore(true);
    fetchProfiles(filters, true);
    fetchCount();
  }, [fetchProfiles, fetchCount, filters]);

  const removeProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  }, []);

  // Shared action RPCs (same as Phase 4 — no duplication)
  const recordLike = useCallback(async (toUserId: string, isSuperLike = false): Promise<LikeResult> => {
    const { data, error: rpcError } = await (supabase as any).rpc('record_like', {
      p_to_user_id: toUserId,
      p_is_super_like: isSuperLike,
    });
    if (rpcError) throw new Error(rpcError.message);
    return data as unknown as LikeResult;
  }, [supabase]);

  const recordPass = useCallback(async (toUserId: string): Promise<void> => {
    const { error: rpcError } = await (supabase as any).rpc('record_pass', {
      p_to_user_id: toUserId,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  const recordBlock = useCallback(async (blockedUserId: string): Promise<void> => {
    const { error: rpcError } = await (supabase as any).rpc('record_block', {
      p_blocked_user_id: blockedUserId,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  const recordReport = useCallback(async (reportedUserId: string, reason: string, description?: string): Promise<void> => {
    const { error: rpcError } = await (supabase as any).rpc('record_report', {
      p_reported_user_id: reportedUserId,
      p_reason: reason,
      p_description: description ?? null,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  const recordProfileView = useCallback(async (viewedUserId: string): Promise<void> => {
    try {
      await (supabase as any).rpc('record_profile_view', { p_viewed_user_id: viewedUserId });
    } catch {
      // non-critical — don't surface to user
    }
  }, [supabase]);

  return {
    profiles,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    fetchProfiles,
    fetchCount,
    applyFilters,
    loadMore,
    refresh,
    removeProfile,
    recordLike,
    recordPass,
    recordBlock,
    recordReport,
    recordProfileView,
  };
}
