// Phase 7 — Chat system hooks
// useConversations, useMessages, useTypingIndicator, usePresence
import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logActivityEvent } from '@/hooks/useActivity';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPhotoUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ConversationRecord {
  conversationId: string;
  matchId: string;
  matchStatus: string;
  updatedAt: string;
  matchedUserId: string;
  firstName: string;
  age: number | null;
  city: string | null;
  country: string | null;
  isVerified: boolean;
  isOnline: boolean;
  lastSeenAt: string | null;
  primaryPhotoPath: string | null;
  primaryPhotoUrl: string | null;
  latestMessageId: string | null;
  latestMessageContent: string | null;
  latestMessageSenderId: string | null;
  latestMessageType: string | null;
  latestMessageCreatedAt: string | null;
  unreadCount: number;
}

export interface MessageRecord {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderPhotoPath: string | null;
  senderPhotoUrl: string | null;
  messageType: string;
  content: string | null;
  attachmentPath: string | null;
  isRead: boolean;
  deletedAt: string | null;
  createdAt: string;
  // Optimistic UI fields
  isOptimistic?: boolean;
  isFailed?: boolean;
  clientId?: string;
}

// ─────────────────────────────────────────────────────────────
// Raw RPC row shapes
// ─────────────────────────────────────────────────────────────

interface RawConversationRow {
  conversation_id: string;
  match_id: string;
  match_status: string;
  updated_at: string;
  matched_user_id: string;
  first_name: string;
  age: number | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  primary_photo_path: string | null;
  latest_message_id: string | null;
  latest_message_content: string | null;
  latest_message_sender_id: string | null;
  latest_message_type: string | null;
  latest_message_created_at: string | null;
  unread_count: number;
}

interface RawMessageRow {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_photo_path: string | null;
  message_type: string;
  content: string | null;
  attachment_path: string | null;
  is_read: boolean;
  deleted_at: string | null;
  created_at: string;
}

function mapConversation(row: RawConversationRow): ConversationRecord {
  return {
    conversationId: row.conversation_id,
    matchId: row.match_id,
    matchStatus: row.match_status,
    updatedAt: row.updated_at,
    matchedUserId: row.matched_user_id,
    firstName: row.first_name,
    age: row.age,
    city: row.city,
    country: row.country,
    isVerified: row.is_verified,
    isOnline: row.is_online,
    lastSeenAt: row.last_seen_at,
    primaryPhotoPath: row.primary_photo_path,
    primaryPhotoUrl: getPhotoUrl(row.primary_photo_path),
    latestMessageId: row.latest_message_id,
    latestMessageContent: row.latest_message_content,
    latestMessageSenderId: row.latest_message_sender_id,
    latestMessageType: row.latest_message_type,
    latestMessageCreatedAt: row.latest_message_created_at,
    unreadCount: Number(row.unread_count) || 0,
  };
}

function mapMessage(row: RawMessageRow): MessageRecord {
  return {
    messageId: row.message_id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderPhotoPath: row.sender_photo_path,
    senderPhotoUrl: getPhotoUrl(row.sender_photo_path),
    messageType: row.message_type,
    content: row.content,
    attachmentPath: row.attachment_path,
    isRead: row.is_read,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────
// useConversations
// ─────────────────────────────────────────────────────────────

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc('get_conversations', {
        p_limit: 50,
        p_offset: 0,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const rows = (data as unknown as RawConversationRow[]) || [];
      setConversations(rows.map(mapConversation));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Subscribe to new messages to update conversation list in realtime
  const subscribeToUpdates = useCallback((userId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`conversations-inbox-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh conversations when any new message arrives
          fetchConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [supabase, fetchConversations]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  // Update a single conversation's unread count locally
  const markConversationRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(c =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    subscribeToUpdates,
    unsubscribe,
    markConversationRead,
  };
}

// ─────────────────────────────────────────────────────────────
// useMessages
// ─────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const PAGE_SIZE = 30;

  const fetchMessages = useCallback(async (convId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc('get_messages', {
        p_conversation_id: convId,
        p_limit: PAGE_SIZE,
        p_before_id: null,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const rows = (data as unknown as RawMessageRow[]) || [];
      const mapped = rows.map(mapMessage).reverse(); // oldest first
      setMessages(mapped);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchOlderMessages = useCallback(async () => {
    if (!conversationId || messages.length === 0 || loadingOlder || !hasMore) return;

    const oldestMessage = messages[0];
    setLoadingOlder(true);
    try {
      const { data, error: rpcError } = await (supabase as any).rpc('get_messages', {
        p_conversation_id: conversationId,
        p_limit: PAGE_SIZE,
        p_before_id: oldestMessage.messageId,
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const rows = (data as unknown as RawMessageRow[]) || [];
      const mapped = rows.map(mapMessage).reverse();
      setMessages(prev => [...mapped, ...prev]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load older messages');
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, messages, loadingOlder, hasMore, supabase]);

  // Optimistic send
  const sendMessage = useCallback(async (
    content: string,
    messageType: string = 'text'
  ): Promise<boolean> => {
    if (!conversationId || !currentUserId) return false;

    const clientId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: MessageRecord = {
      messageId: clientId,
      conversationId,
      senderId: currentUserId,
      senderName: null,
      senderPhotoPath: null,
      senderPhotoUrl: null,
      messageType,
      content,
      attachmentPath: null,
      isRead: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      clientId,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error: rpcError } = await (supabase as any).rpc('send_message', {
        p_conversation_id: conversationId,
        p_content: content,
        p_message_type: messageType,
        p_attachment_path: null,
        p_client_id: clientId,
      });

      if (rpcError) {
        // Paywall/security rejections should not leave a fake failed bubble
        // in the conversation. Other transient errors retain the retry UI.
        const isPremiumBlock = /FREE_MESSAGE_LIMIT_REACHED|CONTACT_SHARING_BLOCKED|PREMIUM_WALL/i.test(rpcError.message || '');
        if (isPremiumBlock) {
          setMessages(prev => prev.filter(m => m.clientId !== clientId));
        } else {
          setMessages(prev =>
            prev.map(m => m.clientId === clientId ? { ...m, isFailed: true, isOptimistic: false } : m)
          );
        }
        return false;
      }

      // Replace optimistic with real message
      const real = data as unknown as MessageRecord;
      setMessages(prev =>
        prev.map(m => m.clientId === clientId ? { ...real, isOptimistic: false } : m)
      );
      // Log activity (fire-and-forget)
      logActivityEvent('message_sent', {});
      return true;
    } catch {
      setMessages(prev =>
        prev.map(m => m.clientId === clientId ? { ...m, isFailed: true, isOptimistic: false } : m)
      );
      return false;
    }
  }, [conversationId, currentUserId, supabase]);

  const retryMessage = useCallback(async (clientId: string) => {
    const failedMsg = messages.find(m => m.clientId === clientId);
    if (!failedMsg || !conversationId) return;

    // Remove failed message and resend
    setMessages(prev => prev.filter(m => m.clientId !== clientId));
    await sendMessage(failedMsg.content || '', failedMsg.messageType);
  }, [messages, conversationId, sendMessage]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await (supabase as any).rpc('soft_delete_message', { p_message_id: messageId });
      setMessages(prev =>
        prev.map(m =>
          m.messageId === messageId
            ? { ...m, deletedAt: new Date().toISOString(), content: null }
            : m
        )
      );
    } catch {
      // Silently fail
    }
  }, [supabase]);

  const markRead = useCallback(async (convId: string) => {
    try {
      await (supabase as any).rpc('mark_messages_read', { p_conversation_id: convId });
      setMessages(prev =>
        prev.map(m =>
          m.senderId !== currentUserId ? { ...m, isRead: true } : m
        )
      );
    } catch {
      // Silently fail
    }
  }, [supabase, currentUserId]);

  // Subscribe to realtime messages
  const subscribeToMessages = useCallback((convId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    const channel = supabase
      .channel(`messages-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            message_type: string;
            content: string | null;
            attachment_path: string | null;
            is_read: boolean;
            deleted_at: string | null;
            created_at: string;
          };

          // Skip if this is our own optimistic message (already in state)
          if (newRow.sender_id === currentUserId) {
            // Replace optimistic message if it exists, otherwise add
            setMessages(prev => {
              const hasOptimistic = prev.some(m => m.isOptimistic && m.senderId === currentUserId);
              if (hasOptimistic) {
                // Replace the first optimistic message from current user
                let replaced = false;
                return prev.map(m => {
                  if (!replaced && m.isOptimistic && m.senderId === currentUserId) {
                    replaced = true;
                    return {
                      ...m,
                      messageId: newRow.id,
                      isOptimistic: false,
                      isRead: newRow.is_read,
                      createdAt: newRow.created_at,
                    };
                  }
                  return m;
                });
              }
              // No optimistic — check for duplicate
              if (prev.some(m => m.messageId === newRow.id)) return prev;
              return [...prev, {
                messageId: newRow.id,
                conversationId: newRow.conversation_id,
                senderId: newRow.sender_id,
                senderName: null,
                senderPhotoPath: null,
                senderPhotoUrl: null,
                messageType: newRow.message_type,
                content: newRow.content,
                attachmentPath: newRow.attachment_path,
                isRead: newRow.is_read,
                deletedAt: newRow.deleted_at,
                createdAt: newRow.created_at,
              }];
            });
            return;
          }

          // Message from the other user — add if not duplicate
          setMessages(prev => {
            if (prev.some(m => m.messageId === newRow.id)) return prev;
            return [...prev, {
              messageId: newRow.id,
              conversationId: newRow.conversation_id,
              senderId: newRow.sender_id,
              senderName: null,
              senderPhotoPath: null,
              senderPhotoUrl: null,
              messageType: newRow.message_type,
              content: newRow.content,
              attachmentPath: newRow.attachment_path,
              isRead: newRow.is_read,
              deletedAt: newRow.deleted_at,
              createdAt: newRow.created_at,
            }];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const updated = payload.new as { id: string; is_read: boolean; deleted_at: string | null; content: string | null };
          setMessages(prev =>
            prev.map(m =>
              m.messageId === updated.id
                ? { ...m, isRead: updated.is_read, deletedAt: updated.deleted_at, content: updated.deleted_at ? null : updated.content }
                : m
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [supabase, currentUserId]);

  const unsubscribeMessages = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetchMessages(conversationId);
    subscribeToMessages(conversationId);

    return () => {
      unsubscribeMessages();
    };
  }, [conversationId, fetchMessages, subscribeToMessages, unsubscribeMessages]);

  return {
    messages,
    loading,
    loadingOlder,
    hasMore,
    error,
    fetchMessages,
    fetchOlderMessages,
    sendMessage,
    retryMessage,
    deleteMessage,
    markRead,
    subscribeToMessages,
    unsubscribeMessages,
  };
}

// ─────────────────────────────────────────────────────────────
// useTypingIndicator
// Uses Supabase Realtime broadcast (ephemeral, not stored in DB)
// ─────────────────────────────────────────────────────────────

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null
) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, is_typing } = payload.payload as { user_id: string; is_typing: boolean };
        if (user_id === currentUserId) return;

        setTypingUsers(prev => {
          if (is_typing && !prev.includes(user_id)) return [...prev, user_id];
          if (!is_typing) return prev.filter(id => id !== user_id);
          return prev;
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, supabase]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !currentUserId) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, is_typing: isTyping },
    });
  }, [currentUserId]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  }, [sendTyping]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
    }
  }, [sendTyping]);

  return { typingUsers, handleTyping, stopTyping };
}

// ─────────────────────────────────────────────────────────────
// usePresence
// Uses Supabase Realtime presence for online status
// ─────────────────────────────────────────────────────────────

export function usePresence(
  conversationId: string | null,
  currentUserId: string | null,
  matchedUserId: string | null
) {
  const [isMatchedUserOnline, setIsMatchedUserOnline] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId || !matchedUserId) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOnline = Object.keys(state).some(key => key === matchedUserId);
        setIsMatchedUserOnline(isOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === matchedUserId) setIsMatchedUserOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === matchedUserId) setIsMatchedUserOnline(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, matchedUserId, supabase]);

  return { isMatchedUserOnline };
}
