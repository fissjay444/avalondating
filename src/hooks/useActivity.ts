// Activity tracking hook — log events, fetch history, get stats
import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ActivityEventType =
  | 'signed_in' |'profile_updated' |'photo_uploaded' |'discovery_viewed' |'liked_user' |'passed_user' |'super_liked_user' |'match_received' |'match_opened' |'message_sent' |'message_received' |'preferences_updated';

export interface ActivityEvent {
  activity_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  created_at: string;
  related_user_name: string | null;
  related_user_photo: string | null;
}

export interface ActivityStats {
  profile_views: number;
  likes_sent: number;
  likes_received: number;
  super_likes_sent: number;
  matches: number;
  messages_sent: number;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPhotoUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

export function useActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  // Use a ref for offset to avoid stale closure issues in loadMore
  const offsetRef = useRef(0);
  const PAGE_SIZE = 20;
  const supabase = createClient();

  const logActivity = useCallback(async (
    eventType: ActivityEventType,
    metadata: Record<string, unknown> = {}
  ) => {
    try {
      await supabase.rpc('log_activity', {
        p_event_type: eventType,
        p_metadata: metadata,
      });
    } catch {
      // Silently fail — activity logging should never break the main UX
    }
  }, [supabase]);

  const updateLastActive = useCallback(async () => {
    try {
      await supabase.rpc('update_last_active');
    } catch {
      // Silently fail
    }
  }, [supabase]);

  const fetchActivity = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    const currentOffset = reset ? 0 : offsetRef.current;
    try {
      const { data, error: rpcError } = await supabase.rpc('get_my_activity', {
        p_limit: PAGE_SIZE,
        p_offset: currentOffset,
      });
      if (rpcError) throw new Error(rpcError.message);
      const rows = (data as ActivityEvent[]) || [];
      if (reset) {
        setEvents(rows);
        offsetRef.current = rows.length;
      } else {
        setEvents(prev => [...prev, ...rows]);
        offsetRef.current = currentOffset + rows.length;
      }
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_activity_stats');
      if (rpcError) throw new Error(rpcError.message);
      setStats(data as ActivityStats);
    } catch {
      // Stats failure is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, [supabase]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchActivity(false);
  }, [loading, hasMore, fetchActivity]);

  return {
    events,
    stats,
    loading,
    statsLoading,
    error,
    hasMore,
    logActivity,
    updateLastActive,
    fetchActivity,
    fetchStats,
    loadMore,
  };
}

// Standalone log helper — import anywhere without hook overhead
export async function logActivityEvent(
  eventType: ActivityEventType,
  metadata: Record<string, unknown> = {}
) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.rpc('log_activity', {
      p_event_type: eventType,
      p_metadata: metadata,
    });
  } catch {
    // Silently fail
  }
}

// Format last-active timestamp into human-readable string
export function formatLastActive(lastActiveAt: string | null): string {
  if (!lastActiveAt) return 'Offline';
  const now = new Date();
  const last = new Date(lastActiveAt);
  const diffMs = now.getTime() - last.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 5) return 'Online';
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  if (diffDays === 1) return 'Active yesterday';
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return 'Active a while ago';
}

// Get emoji + label for each event type
export function getActivityLabel(eventType: ActivityEventType, metadata: Record<string, unknown>): { emoji: string; label: string } {
  const name = (metadata?.related_user_name as string) || 'someone';
  switch (eventType) {
    case 'signed_in': return { emoji: '👋', label: 'You signed in' };
    case 'profile_updated': return { emoji: '📝', label: 'You updated your profile' };
    case 'photo_uploaded': return { emoji: '📸', label: 'You uploaded a photo' };
    case 'discovery_viewed': return { emoji: '🔍', label: 'You browsed Discovery' };
    case 'liked_user': return { emoji: '❤️', label: `You liked ${name}` };
    case 'passed_user': return { emoji: '👋', label: `You passed on ${name}` };
    case 'super_liked_user': return { emoji: '⭐', label: `You sent a Super Like to ${name}` };
    case 'match_received': return { emoji: '💜', label: `You matched with ${name}` };
    case 'match_opened': return { emoji: '💌', label: `You opened a match with ${name}` };
    case 'message_sent': return { emoji: '💬', label: `You sent a message to ${name}` };
    case 'message_received': return { emoji: '📩', label: `You received a message from ${name}` };
    case 'preferences_updated': return { emoji: '⚙️', label: 'You updated your preferences' };
    default: return { emoji: '✨', label: 'Activity' };
  }
}
