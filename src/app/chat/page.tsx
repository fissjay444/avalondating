'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, useMessages, useTypingIndicator, usePresence, type ConversationRecord } from '@/hooks/useChat';
import { createClient } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ConversationList from '@/components/chat/ConversationList';
import ChatView from '@/components/chat/ChatView';
import MessageComposer from '@/components/chat/MessageComposer';
import { usePremiumPaywall } from '@/contexts/PremiumPaywallContext';

// ─────────────────────────────────────────────────────────────
// ChatContent — the actual chat UI
// ─────────────────────────────────────────────────────────────

function ChatContent() {
  const { user, loading, isOnboardingComplete, profileLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeConversation, setActiveConversation] = useState<ConversationRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [chatEntitlement, setChatEntitlement] = useState<{ plan: 'free' | 'premium' | 'vip'; messageCount: number; contactDetected: boolean } | null>(null);
  const { openPremiumPaywall, closePremiumPaywall } = usePremiumPaywall();

  const supabase = useMemo(() => createClient(), []);

  const {
    conversations,
    loading: convsLoading,
    error: convsError,
    fetchConversations,
    subscribeToUpdates,
    unsubscribe: unsubscribeConvs,
    markConversationRead,
  } = useConversations();

  const {
    messages,
    loading: msgsLoading,
    loadingOlder,
    hasMore,
    sendMessage,
    retryMessage,
    deleteMessage,
    markRead,
    fetchOlderMessages,
  } = useMessages(activeConversation?.conversationId ?? null, user?.id ?? null);

  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(
    activeConversation?.conversationId ?? null,
    user?.id ?? null
  );

  const { isMatchedUserOnline } = usePresence(
    activeConversation?.conversationId ?? null,
    user?.id ?? null,
    activeConversation?.matchedUserId ?? null
  );

  // Auth guard
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOnboardingComplete) { router.replace('/onboarding'); }
  }, [loading, profileLoading, user, isOnboardingComplete, router]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user && isOnboardingComplete && !loading && !profileLoading) {
      fetchConversations();
      subscribeToUpdates(user.id);
    }
    return () => unsubscribeConvs();
  }, [user, isOnboardingComplete, loading, profileLoading, fetchConversations, subscribeToUpdates, unsubscribeConvs]);

  // Handle deep-link: ?match_id=xxx or ?conversation_id=xxx
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    const matchId = searchParams.get('match_id');
    const convId = searchParams.get('conversation_id');

    if (convId) {
      const conv = conversations.find(c => c.conversationId === convId);
      if (conv) {
        setActiveConversation(conv);
        setMobileView('chat');
        return;
      }
    }

    if (matchId) {
      const conv = conversations.find(c => c.matchId === matchId);
      if (conv) {
        setActiveConversation(conv);
        setMobileView('chat');
        return;
      }
      // Conversation doesn't exist yet — create it
      (async () => {
        try {
          const { data } = await supabase.rpc('get_or_create_conversation', { p_match_id: matchId });
          if (data?.conversation_id) {
            await fetchConversations();
          }
        } catch {
          // Silently fail
        }
      })();
    }
  }, [user, conversations, searchParams, supabase, fetchConversations]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!activeConversation) return;
    markRead(activeConversation.conversationId);
    markConversationRead(activeConversation.conversationId);
  }, [activeConversation, markRead, markConversationRead]);

  // Server-authoritative entitlement check for the active conversation.
  useEffect(() => {
    let cancelled = false;
    const loadEntitlement = async () => {
      if (!activeConversation || !user) {
        setChatEntitlement(null);
        return;
      }
      const { data, error } = await supabase.rpc('get_chat_entitlement', {
        p_conversation_id: activeConversation.conversationId,
        p_content: null,
      });
      if (!cancelled && !error && data) {
        const result = data as { plan?: 'free' | 'premium' | 'vip'; message_count?: number; contact_detected?: boolean };
        setChatEntitlement({
          plan: result.plan || 'free',
          messageCount: Number(result.message_count || 0),
          contactDetected: Boolean(result.contact_detected),
        });
        if (result.plan === 'free' && Number(result.message_count || 0) >= 20) {
          openPremiumPaywall({ reason: 'message_limit', userName: activeConversation.firstName, messageCount: Number(result.message_count || 0) });
        } else {
          closePremiumPaywall();
        }
      }
    };
    loadEntitlement();
    return () => { cancelled = true; };
  }, [activeConversation, user, supabase, messages.length, openPremiumPaywall, closePremiumPaywall]);

  const handleSelectConversation = useCallback((conv: ConversationRecord) => {
    setActiveConversation(conv);
    setMobileView('chat');
    stopTyping();
  }, [stopTyping]);

  const handleBack = useCallback(() => {
    setMobileView('list');
    setActiveConversation(null);
    stopTyping();
    fetchConversations(); // Refresh to update unread counts
  }, [stopTyping, fetchConversations]);

  const handleSend = useCallback(async (content: string, type?: string) => {
    if (!activeConversation || !user) return false;

    const { data, error } = await supabase.rpc('get_chat_entitlement', {
      p_conversation_id: activeConversation.conversationId,
      p_content: content,
    });

    if (!error && data) {
      const result = data as { plan?: 'free' | 'premium' | 'vip'; message_count?: number; contact_detected?: boolean; blocked_reason?: string | null };
      const plan = result.plan || 'free';
      const count = Number(result.message_count || 0);
      const contactDetected = Boolean(result.contact_detected);
      setChatEntitlement({ plan, messageCount: count, contactDetected });
      if (plan === 'free' && count >= 20) {
        openPremiumPaywall({ reason: 'message_limit', userName: activeConversation.firstName, messageCount: count });
        return false;
      }
      if (plan === 'free' && contactDetected) {
        openPremiumPaywall({ reason: 'contact', userName: activeConversation.firstName, messageCount: count });
        return false;
      }
    }

    const success = await sendMessage(content, type);
    if (success) {
      setChatEntitlement(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : prev);
      return true;
    }

    // Server-side enforcement is authoritative. Refresh entitlement so a
    // race at the 20-message boundary or a concurrent contact check still
    // results in the correct Premium Wall rather than a generic send error.
    const { data: refreshed } = await supabase.rpc('get_chat_entitlement', {
      p_conversation_id: activeConversation.conversationId,
      p_content: content,
    });
    if (refreshed) {
      const latest = refreshed as { plan?: 'free' | 'premium' | 'vip'; message_count?: number; contact_detected?: boolean; blocked_reason?: string | null };
      const latestPlan = latest.plan || 'free';
      const latestCount = Number(latest.message_count || 0);
      setChatEntitlement({
        plan: latestPlan,
        messageCount: latestCount,
        contactDetected: Boolean(latest.contact_detected),
      });
      if (latestPlan === 'free' && latestCount >= 20) {
        openPremiumPaywall({ reason: 'message_limit', userName: activeConversation.firstName, messageCount: latestCount });
      } else if (latestPlan === 'free' && latest.contact_detected) {
        openPremiumPaywall({ reason: 'contact', userName: activeConversation.firstName, messageCount: latestCount });
      }
    }
    return false;
  }, [activeConversation, user, supabase, sendMessage, openPremiumPaywall]);

  const handleFetchOlder = useCallback(() => {
    fetchOlderMessages();
  }, [fetchOlderMessages]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
          <p className="text-white/40 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !isOnboardingComplete) return null;

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <Navbar />

      {/* Chat layout */}
      <div className="flex-1 flex pt-16" style={{ height: 'calc(100vh - 0px)' }}>
        {/* ── DESKTOP: Two-panel layout ── */}
        <div className="hidden md:flex w-full max-w-6xl mx-auto" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Left panel — conversation list */}
          <div
            className="w-80 flex-shrink-0 flex flex-col"
            style={{
              borderRight: '1px solid rgba(255,255,255,0.06)',
              height: '100%',
            }}
          >
            <ConversationList
              conversations={conversations}
              loading={convsLoading}
              error={convsError}
              activeConversationId={activeConversation?.conversationId ?? null}
              currentUserId={user.id}
              onSelectConversation={handleSelectConversation}
              onRefresh={fetchConversations}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Right panel — chat or empty state */}
          <div className="flex-1 flex flex-col" style={{ height: '100%' }}>
            {activeConversation ? (
              <>
                <ChatView
                  conversation={activeConversation}
                  messages={messages}
                  loading={msgsLoading}
                  loadingOlder={loadingOlder}
                  hasMore={hasMore}
                  currentUserId={user.id}
                  typingUsers={typingUsers}
                  isMatchedUserOnline={isMatchedUserOnline}
                  onBack={handleBack}
                  onFetchOlder={handleFetchOlder}
                  onDeleteMessage={deleteMessage}
                  onRetryMessage={retryMessage}
                />
                <MessageComposer
                  onSend={handleSend}
                  onTyping={handleTyping}
                  onStopTyping={stopTyping}
                  disabled={msgsLoading}
                  premiumBlocked={chatEntitlement?.plan === 'free' && (chatEntitlement.messageCount >= 20)}
                  onContactDetected={() => {
                    if (chatEntitlement?.plan === 'free') {
                      openPremiumPaywall({ reason: 'contact', userName: activeConversation.firstName, messageCount: chatEntitlement.messageCount });
                    }
                  }}
                  placeholder={`Message ${activeConversation.firstName}…`}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
                >
                  <MessageCircle size={36} style={{ color: '#7C3AED' }} />
                </div>
                <h3
                  className="font-display font-bold text-2xl mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #FBBF24 0%, #ffffff 60%, #F472B6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Your Messages
                </h3>
                <p className="text-white/40 text-sm max-w-xs">
                  Select a conversation to start chatting with your matches
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE: Full-screen panels ── */}
        <div className="md:hidden w-full relative overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          <AnimatePresence initial={false}>
            {mobileView === 'list' ? (
              <motion.div
                key="list"
                className="absolute inset-0"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
              >
                <ConversationList
                  conversations={conversations}
                  loading={convsLoading}
                  error={convsError}
                  activeConversationId={activeConversation?.conversationId ?? null}
                  currentUserId={user.id}
                  onSelectConversation={handleSelectConversation}
                  onRefresh={fetchConversations}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                className="absolute inset-0 flex flex-col"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
              >
                {activeConversation ? (
                  <>
                    <ChatView
                      conversation={activeConversation}
                      messages={messages}
                      loading={msgsLoading}
                      loadingOlder={loadingOlder}
                      hasMore={hasMore}
                      currentUserId={user.id}
                      typingUsers={typingUsers}
                      isMatchedUserOnline={isMatchedUserOnline}
                      onBack={handleBack}
                      onFetchOlder={handleFetchOlder}
                      onDeleteMessage={deleteMessage}
                      onRetryMessage={retryMessage}
                    />
                    <MessageComposer
                      onSend={handleSend}
                      onTyping={handleTyping}
                      onStopTyping={stopTyping}
                      disabled={msgsLoading}
                      premiumBlocked={chatEntitlement?.plan === 'free' && (chatEntitlement?.messageCount || 0) >= 20}
                      onContactDetected={() => {
                    if (chatEntitlement?.plan === 'free') {
                      openPremiumPaywall({ reason: 'contact', userName: activeConversation.firstName, messageCount: chatEntitlement.messageCount });
                    }
                  }}
                      placeholder={`Message ${activeConversation.firstName}…`}
                    />
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <React.Suspense fallback={
        <div className="min-h-screen gradient-hero flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      }>
        <ChatContent />
      </React.Suspense>
    </ProtectedRoute>
  );
}
