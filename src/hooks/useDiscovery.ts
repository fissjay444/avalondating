// Discovery profile types and Supabase query hook
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DiscoveryPhoto {
  id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
}

export interface DiscoveryProfile {
  id: string;
  first_name: string;
  date_of_birth: string;
  gender: string;
  city: string | null;
  country: string | null;
  bio: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  age: number;
  photos: DiscoveryPhoto[];
  interests: string[];
}

export interface LikeResult {
  matched: boolean;
  match_id: string | null;
  already_done: boolean;
}

const BATCH_SIZE = 8;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPhotoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

export function useDiscovery() {
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const offsetRef = useRef(0);
  const fetchingRef = useRef(false);
  const supabase = createClient();

  const fetchBatch = useCallback(async (reset = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    const offset = reset ? 0 : offsetRef.current;

    try {
      const { data, error: rpcError } = await supabase.rpc('get_discovery_profiles', {
        p_limit: BATCH_SIZE,
        p_offset: offset,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      const rows = (data as DiscoveryProfile[]) || [];

      if (rows.length === 0) {
        setExhausted(true);
        if (reset) setProfiles([]);
        return;
      }

      offsetRef.current = offset + rows.length;
      setExhausted(rows.length < BATCH_SIZE);

      if (reset) {
        setProfiles(rows);
      } else {
        setProfiles(prev => [...prev, ...rows]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [supabase]);

  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setExhausted(false);
    fetchBatch(true);
  }, [fetchBatch]);

  const removeProfile = useCallback((profileId: string) => {
    setProfiles(prev => {
      const next = prev.filter(p => p.id !== profileId);
      // Prefetch next batch when queue is running low
      if (next.length <= 2 && !fetchingRef.current) {
        fetchBatch(false);
      }
      return next;
    });
  }, [fetchBatch]);

  const recordLike = useCallback(async (toUserId: string, isSuperLike = false): Promise<LikeResult> => {
    const { data, error: rpcError } = await supabase.rpc('record_like', {
      p_to_user_id: toUserId,
      p_is_super_like: isSuperLike,
    });
    if (rpcError) throw new Error(rpcError.message);
    return data as LikeResult;
  }, [supabase]);

  const recordPass = useCallback(async (toUserId: string): Promise<void> => {
    const { error: rpcError } = await supabase.rpc('record_pass', {
      p_to_user_id: toUserId,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  const recordBlock = useCallback(async (blockedUserId: string): Promise<void> => {
    const { error: rpcError } = await supabase.rpc('record_block', {
      p_blocked_user_id: blockedUserId,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  const recordReport = useCallback(async (reportedUserId: string, reason: string, description?: string): Promise<void> => {
    const { error: rpcError } = await supabase.rpc('record_report', {
      p_reported_user_id: reportedUserId,
      p_reason: reason,
      p_description: description ?? null,
    });
    if (rpcError) throw new Error(rpcError.message);
  }, [supabase]);

  return {
    profiles,
    loading,
    error,
    exhausted,
    fetchBatch,
    refresh,
    removeProfile,
    recordLike,
    recordPass,
    recordBlock,
    recordReport,
  };
}
