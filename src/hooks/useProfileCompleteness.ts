// Profile Completeness Hook — calculates real completion from Supabase
import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CompletenessItem {
  key: string;
  label: string;
  completed: boolean;
  weight: number;
  action_href: string;
}

export interface ProfileCompleteness {
  score: number;
  items: CompletenessItem[];
}

export function useProfileCompleteness(autoFetch = true) {
  const [data, setData] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: rpcError } = await supabase.rpc('get_profile_completeness');
      if (rpcError) throw new Error(rpcError.message);
      setData(result as ProfileCompleteness);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile completeness');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (autoFetch) refetch();
  }, [autoFetch, refetch]);

  return { data, loading, error, refetch };
}
