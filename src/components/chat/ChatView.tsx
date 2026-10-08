'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, Phone, Video, Loader2, RefreshCw, Trash2, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import type { MessageRecord, ConversationRecord } from '@/hooks/useChat';
import AppImage from '@/components/ui/AppImage';
import { usePremiumPaywall } from '@/contexts/PremiumPaywallContext';

interface ChatViewProps {
  conversation: ConversationRecord;
  messages: MessageRecord[];
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  currentUserId: string;
  typingUsers: string[];
  isMatchedUserOnline: boolean;
  onBack: () => void;
  onFetchOlder: () => void;
  onDeleteMessage: (id: string) => void;
  onRetryMessage: (clientId: string) => void;
  onViewProfile?: () => void;
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateSeparator(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowDateSeparator(messages: MessageRecord[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt);
  const prev = new Date(messages[index - 1].createdAt);
  return curr.toDateString() !== prev.toDateString();
}

interface MessageBubbleProps {
  message: MessageRecord;
  isOwn: boolean;
  showAvatar: boolean;
  onDelete: (id: string) => void;
  onRetry: (clientId: string) => void;
}

function MessageBubble({ message, isOwn, showAvatar, onDelete, onRetry }: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  const isDeleted = !!message.deletedAt;
  const isFailed = message.isFailed;
  const isOptimistic = message.isOptimistic;

  return (
    <motion.div
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-1`}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Avatar (other user only) */}
      {!isOwn && (
        <div className="flex-shrink-0 w-7 h-7">
          {showAvatar && (
            <div
              className="w-7 h-7 rounded-full overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {message.senderPhotoUrl ? (
                <AppImage
                  src={message.senderPhotoUrl}
                  alt={message.senderName || 'User'}
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
                >
                  {message.senderName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bubble + meta */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="relative group">
          {/* Bubble */}
          <div
            className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
            style={
              isDeleted
                ? { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', border: '1px solid rgba(255,255,255,0.08)' }
                : isOwn
                ? {
                    background: isFailed
                      ? 'rgba(239,68,68,0.3)'
                      : isOptimistic
                      ? 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(236,72,153,0.7))'
                      : 'linear-gradient(135deg, #7C3AED, #EC4899)',
                    color: '#fff',
                    opacity: isOptimistic ? 0.8 : 1,
                  }
                : {
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }
            }
          >
            {isDeleted ? 'This message was deleted' : (message.content || '')}
          </div>

          {/* Context menu trigger (own messages only, not deleted/optimistic) */}
          {isOwn && !isDeleted && !isOptimistic && !isFailed && (
            <div ref={menuRef} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-full text-white/30 hover:text-white/60 transition-colors"
                aria-label="Message options"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 bottom-full mb-1 w-36 rounded-xl overflow-hidden shadow-2xl z-10"
                  style={{ background: 'rgba(20,10,50,0.98)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <button
                    onClick={() => { onDelete(message.messageId); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete message
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time + status */}
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-white/25 text-[10px]">
            {isOptimistic ? 'Sending…' : isFailed ? 'Failed' : formatMessageTime(message.createdAt)}
          </span>
          {isOwn && !isOptimistic && !isFailed && !isDeleted && (
            <CheckCheck
              size={12}
              className={message.isRead ? 'text-purple-400' : 'text-white/25'}
            />
          )}
          {isFailed && message.clientId && (
            <button
              onClick={() => onRetry(message.clientId!)}
              className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-0.5 transition-colors"
            >
              <RefreshCw size={10} />
              Retry
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatView({
  conversation,
  messages,
  loading,
  loadingOlder,
  hasMore,
  currentUserId,
  typingUsers,
  isMatchedUserOnline,
  onBack,
  onFetchOlder,
  onDeleteMessage,
  onRetryMessage,
  onViewProfile,
}: ChatViewProps) {
  const { openPremiumPaywall } = usePremiumPaywall();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isNearBottomRef = useRef(true);

  // Auto-scroll to bottom on new messages (only if near bottom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    isNearBottomRef.current = isNearBottom;

    const newMessageCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (newMessageCount > prevCount) {
      const lastMessage = messages[messages.length - 1];
      // Scroll to bottom if: first load, own message, or was near bottom
      if (prevCount === 0 || lastMessage?.senderId === currentUserId || isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'auto' : 'smooth' });
      }
    }

    prevMessageCountRef.current = newMessageCount;
  }, [messages, currentUserId]);

  // Handle scroll to load older messages
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 80 && hasMore && !loadingOlder) {
      onFetchOlder();
    }
  }, [hasMore, loadingOlder, onFetchOlder]);

  const location = [conversation.city, conversation.country].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(8,4,24,0.98)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(10,5,30,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-1 rounded-xl text-white/60 hover:text-white transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Avatar */}
        <button
          onClick={onViewProfile}
          className="relative flex-shrink-0"
          aria-label={`View ${conversation.firstName}'s profile`}
        >
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2"
            style={{ borderColor: (isMatchedUserOnline || conversation.isOnline) ? '#22c55e' : 'rgba(255,255,255,0.15)' }}
          >
            {conversation.primaryPhotoUrl ? (
              <AppImage
                src={conversation.primaryPhotoUrl}
                alt={`${conversation.firstName}'s photo`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-bold"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              >
                {conversation.firstName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {(isMatchedUserOnline || conversation.isOnline) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: '#0a051e' }} />
          )}
        </button>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {conversation.firstName}{conversation.age ? `, ${conversation.age}` : ''}
          </p>
          <p className="text-xs truncate" style={{ color: (isMatchedUserOnline || conversation.isOnline) ? '#22c55e' : 'rgba(255,255,255,0.35)' }}>
            {(isMatchedUserOnline || conversation.isOnline) ? '● Online' : location || 'Offline'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openPremiumPaywall({ reason: 'feature' })} className="p-2 rounded-xl text-amber-300/70 hover:text-amber-200 transition-colors" aria-label="Voice calling is a Premium feature" title="Premium feature → Unlock">
            <Phone size={17} />
          </button>
          <button type="button" onClick={() => openPremiumPaywall({ reason: 'feature' })} className="p-2 rounded-xl text-amber-300/70 hover:text-amber-200 transition-colors" aria-label="Video calling is a Premium feature" title="Premium feature → Unlock">
            <Video size={17} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={handleScroll}
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Load older button */}
        {hasMore && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onFetchOlder}
              disabled={loadingOlder}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white/50 hover:text-white/80 text-xs transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {loadingOlder ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Load older messages
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-white/30" />
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <span className="text-3xl">💜</span>
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">You matched with {conversation.firstName}!</p>
            <p className="text-white/30 text-xs">Send a message to start the conversation</p>
          </div>
        )}

        {/* Message list */}
        {!loading && messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showDateSep = shouldShowDateSeparator(messages, index);
          const nextMessage = messages[index + 1];
          const showAvatar = !isOwn && (!nextMessage || nextMessage.senderId !== message.senderId);

          return (
            <React.Fragment key={message.messageId}>
              {showDateSep && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-white/25 text-[11px] font-medium px-2">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onDelete={onDeleteMessage}
                onRetry={onRetryMessage}
              />
            </React.Fragment>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              className="flex items-end gap-2 mb-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <div className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {conversation.firstName?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.4)' }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span className="text-white/30 text-xs">{conversation.firstName} is typing…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
