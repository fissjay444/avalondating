// Matches data layer — Phase 6
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPhotoUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

export interface MatchRecord {
  matchId: string;
  matchedAt: string;
  lastActivityAt: string;
  status: string;
  matchedUserId: string;
  firstName: string;
  dateOfBirth: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  primaryPhotoPath: string | null;
  primaryPhotoUrl: string | null;
  conversationId: string | null;
}

export interface NotificationRecord {
  notificationId: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  relatedMatchId: string | null;
  relatedUserId: string | null;
  relatedUserName: string | null;
  relatedUserPhoto: string | null;
  relatedUserPhotoUrl: string | null;
}

// Raw RPC row shape
interface RawMatchRow {
  match_id: string;
  matched_at: string;
  last_activity_at: string;
  status: string;
  matched_user_id: string;
  first_name: string;
  date_of_birth: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  primary_photo_path: string | null;
  conversation_id: string | null;
}

interface RawNotificationRow {
  notification_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  related_match_id: string | null;
  related_user_id: string | null;
  related_user_name: string | null;
  related_user_photo: string | null;
}

function mapMatch(row: RawMatchRow): MatchRecord {
  return {
    matchId: row.match_id,
    matchedAt: row.matched_at,
    lastActivityAt: row.last_activity_at,
    status: row.status,
    matchedUserId: row.matched_user_id,
    firstName: row.first_name,
    dateOfBirth: row.date_of_birth,
    age: row.age,
    city: row.city,
    country: row.country,
    bio: row.bio,
    isVerified: row.is_verified,
    isOnline: row.is_online,
    lastSeenAt: row.last_seen_at,
    primaryPhotoPath: row.primary_photo_path,
    primaryPhotoUrl: getPhotoUrl(row.primary_photo_path),
    conversationId: row.conversation_id,
  };
}

function mapNotification(row: RawNotificationRow): NotificationRecord {
  return {
    notificationId: row.notification_id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
    relatedMatchId: row.related_match_id,
    relatedUserId: row.related_user_id,
    relatedUserName: row.related_user_name,
    relatedUserPhoto: row.related_user_photo,
    relatedUserPhotoUrl: getPhotoUrl(row.related_user_photo),
  };
}

export function useMatches() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_matches', {
        p_limit: 50,
        p_offset: 0,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const rows = (data as RawMatchRow[]) || [];
      setMatches(rows.map(mapMatch));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return { matches, loading, error, fetchMatches };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_notifications', {
        p_limit: 30,
        p_offset: 0,
        p_unread_only: unreadOnly,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const rows = (data as RawNotificationRow[]) || [];
      const mapped = rows.map(mapNotification);
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.isRead).length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_unread_notification_count');
      if (!rpcError && typeof data === 'number') {
        setUnreadCount(data);
      }
    } catch {
      // Silently fail for count fetch
    }
  }, [supabase]);

  const markRead = useCallback(async (notificationId: string) => {
    try {
      await supabase.rpc('mark_notification_read', { p_notification_id: notificationId });
      setNotifications(prev =>
        prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, [supabase]);

  const markAllRead = useCallback(async () => {
    try {
      await supabase.rpc('mark_all_notifications_read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, [supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
  };
}
