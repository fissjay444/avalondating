'use client';
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, RefreshCw } from 'lucide-react';
import type { ConversationRecord } from '@/hooks/useChat';
import AppImage from '@/components/ui/AppImage';

interface ConversationListProps {
  conversations: ConversationRecord[];
  loading: boolean;
  error: string | null;
  activeConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (conv: ConversationRecord) => void;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function SkeletonConvItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-28 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  currentUserId,
  onClick,
}: {
  conv: ConversationRecord;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const isMyMessage = conv.latestMessageSenderId === currentUserId;
  const hasUnread = conv.unreadCount > 0;

  const previewText = conv.latestMessageContent
    ? (isMyMessage ? `You: ${conv.latestMessageContent}` : conv.latestMessageContent)
    : 'Start a conversation…';

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all relative"
      style={{
        background: isActive
          ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.1))'
          : 'transparent',
        borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
      }}
      whileHover={{ background: isActive ? undefined : 'rgba(255,255,255,0.04)' }}
      onClick={onClick}
      aria-label={`Open conversation with ${conv.firstName}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2"
          style={{ borderColor: conv.isOnline ? '#22c55e' : 'rgba(255,255,255,0.1)' }}
        >
          {conv.primaryPhotoUrl ? (
            <AppImage
              src={conv.primaryPhotoUrl}
              alt={`${conv.firstName}'s photo`}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
            >
              {conv.firstName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {conv.isOnline && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2"
            style={{ borderColor: '#0a051e' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-sm font-semibold truncate ${hasUnread ? 'text-white' : 'text-white/80'}`}>
            {conv.firstName}{conv.age ? `, ${conv.age}` : ''}
          </span>
          <span className="text-white/30 text-xs flex-shrink-0 ml-2">
            {formatTime(conv.latestMessageCreatedAt || conv.updatedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate ${hasUnread ? 'text-white/70' : 'text-white/40'}`}>
            {previewText}
          </p>
          {hasUnread && (
            <span
              className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
            >
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function ConversationList({
  conversations,
  loading,
  error,
  activeConversationId,
  currentUserId,
  onSelectConversation,
  onRefresh,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const filtered = conversations.filter(c =>
    c.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(10,5,30,0.95)' }}>
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="font-display font-bold text-xl"
            style={{
              background: 'linear-gradient(135deg, #FBBF24 0%, #ffffff 60%, #F472B6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Messages
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/70 transition-colors"
            aria-label="Refresh conversations"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search size={14} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-red-400 text-xs" style={{ background: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <div className="flex flex-col pt-2">
            {[1, 2, 3, 4].map(i => <SkeletonConvItem key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence>
            {filtered.map(conv => (
              <ConversationItem
                key={conv.conversationId}
                conv={conv}
                isActive={conv.conversationId === activeConversationId}
                currentUserId={currentUserId}
                onClick={() => onSelectConversation(conv)}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <MessageCircle size={28} style={{ color: '#7C3AED' }} />
            </div>
            <p className="text-white/60 text-sm font-medium mb-1">
              {searchQuery ? 'No results found' : 'No conversations yet'}
            </p>
            <p className="text-white/30 text-xs">
              {searchQuery ? 'Try a different name' : 'Match with someone to start chatting'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
