'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MapPin, CheckCircle, RefreshCw, Loader2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMatches, useNotifications, type MatchRecord, type NotificationRecord } from '@/hooks/useMatches';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AppImage from '@/components/ui/AppImage';

// ---- Skeleton card ----
function SkeletonMatchCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse flex gap-4 p-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="w-16 h-16 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-4 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="h-3 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}

// ---- Match card ----
function MatchCard({ match, onClick }: { match: MatchRecord; onClick: () => void }) {
  const location = [match.city, match.country].filter(Boolean).join(', ');
  const timeAgo = formatTimeAgo(match.lastActivityAt);

  return (
    <motion.button
      className="w-full text-left rounded-2xl overflow-hidden flex gap-4 p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      whileHover={{ borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.08)' }}
      onClick={onClick}
      aria-label={`Open conversation with ${match.firstName}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-16 h-16 rounded-full overflow-hidden border-2"
          style={{ borderColor: match.isOnline ? '#22c55e' : 'rgba(255,255,255,0.1)' }}
        >
          {match.primaryPhotoUrl ? (
            <AppImage
              src={match.primaryPhotoUrl}
              alt={`${match.firstName}'s photo`}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
            >
              {match.firstName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        {match.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2"
            style={{ borderColor: 'rgba(10,5,30,1)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-white font-semibold text-base truncate">
            {match.firstName}{match.age ? `, ${match.age}` : ''}
          </span>
          {match.isVerified && (
            <CheckCircle size={14} className="flex-shrink-0" style={{ color: '#FBBF24' }} />
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={11} className="text-white/30 flex-shrink-0" />
            <span className="text-white/40 text-xs truncate">{location}</span>
          </div>
        )}
        <p className="text-white/50 text-xs truncate">{match.bio || 'Start a conversation…'}</p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <span className="text-white/30 text-xs">{timeAgo}</span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
        >
          <MessageCircle size={14} className="text-white" />
        </div>
      </div>
    </motion.button>
  );
}

// ---- Notification item ----
function NotificationItem({ notification, onMarkRead }: { notification: NotificationRecord; onMarkRead: (id: string) => void }) {
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <motion.div
      className="flex gap-3 p-3 rounded-xl transition-all"
      style={{
        background: notification.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(124,58,237,0.1)',
        border: `1px solid ${notification.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.25)'}`,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Avatar / icon */}
      <div className="flex-shrink-0">
        {notification.relatedUserPhotoUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <AppImage
              src={notification.relatedUserPhotoUrl}
              alt={notification.relatedUserName || 'User'}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
          >
            {notification.type === 'match' ? '💜' : '🔔'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-snug">{notification.title}</p>
        {notification.body && (
          <p className="text-white/50 text-xs mt-0.5 leading-snug">{notification.body}</p>
        )}
        <p className="text-white/30 text-xs mt-1">{timeAgo}</p>
      </div>

      {/* Unread dot + mark read */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {!notification.isRead && (
          <>
            <div className="w-2 h-2 rounded-full" style={{ background: '#7C3AED' }} />
            <button
              onClick={() => onMarkRead(notification.notificationId)}
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
              aria-label="Mark as read"
            >
              ✓
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ---- Time formatter ----
function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

// ---- Tab type ----
type Tab = 'matches' | 'notifications';

// ---- Main page ----
function MatchesContent() {
  const { user, loading, isOnboardingComplete, profileLoading, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('matches');

  const { matches, loading: matchesLoading, error: matchesError, fetchMatches } = useMatches();
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  // Auth guard
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOnboardingComplete) { router.replace('/onboarding'); }
  }, [loading, profileLoading, user, isOnboardingComplete, router]);

  // Fetch data on mount
  useEffect(() => {
    if (user && isOnboardingComplete && !loading && !profileLoading) {
      fetchMatches();
      fetchNotifications();
    }
  }, [user, isOnboardingComplete, loading, profileLoading, fetchMatches, fetchNotifications]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-white" />
          <p className="text-white/60 text-sm">Loading Avalon Dating…</p>
        </div>
      </div>
    );
  }

  if (!user || !isOnboardingComplete) return null;

  const handleMatchClick = (match: MatchRecord) => {
    if (match.conversationId) {
      router.push(`/chat?conversation_id=${match.conversationId}`);
    } else {
      router.push(`/chat?match_id=${match.matchId}`);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <div className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 pt-6">
          <h1
            className="font-display font-bold text-3xl mb-1"
            style={{
              background: 'linear-gradient(135deg, #FBBF24 0%, #ffffff 60%, #F472B6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your Matches
          </h1>
          <p className="text-white/50 text-sm">
            {matches.length > 0
              ? `${matches.length} connection${matches.length !== 1 ? 's' : ''} waiting`
              : 'Keep swiping to find your match'}
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex rounded-2xl p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['matches', 'notifications'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={
                activeTab === tab
                  ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: '#fff' }
                  : { color: 'rgba(255,255,255,0.5)' }
              }
            >
              {tab === 'matches' ? (
                <>
                  <Heart size={15} />
                  Matches
                  {matches.length > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      {matches.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Bell size={15} />
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'matches' ? (
            <motion.div
              key="matches-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Refresh button */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={fetchMatches}
                  disabled={matchesLoading}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
                  aria-label="Refresh matches"
                >
                  <RefreshCw size={13} className={matchesLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* Error */}
              {matchesError && (
                <div
                  className="mb-4 px-4 py-3 rounded-2xl text-red-400 text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  ⚠️ {matchesError}
                </div>
              )}

              {/* Loading skeletons */}
              {matchesLoading && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => <SkeletonMatchCard key={i} />)}
                </div>
              )}

              {/* Match list */}
              {!matchesLoading && matches.length > 0 && (
                <div className="flex flex-col gap-3">
                  {matches.map(match => (
                    <MatchCard
                      key={match.matchId}
                      match={match}
                      onClick={() => handleMatchClick(match)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!matchesLoading && matches.length === 0 && !matchesError && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <Heart size={32} style={{ color: '#7C3AED' }} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">No matches yet</h3>
                  <p className="text-white/40 text-sm max-w-xs mb-6">
                    Keep swiping and liking profiles. When someone likes you back, they&apos;ll appear here.
                  </p>
                  <button
                    onClick={() => router.push('/discover')}
                    className="px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
                  >
                    Start Discovering
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="notifications-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mark all read */}
              {notifications.some(n => !n.isRead) && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
                  >
                    <BellOff size={13} />
                    Mark all read
                  </button>
                </div>
              )}

              {/* Loading */}
              {notifLoading && (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-16 rounded-xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  ))}
                </div>
              )}

              {/* Notification list */}
              {!notifLoading && notifications.length > 0 && (
                <div className="flex flex-col gap-2">
                  {notifications.map(notif => (
                    <NotificationItem
                      key={notif.notificationId}
                      notification={notif}
                      onMarkRead={markRead}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!notifLoading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <Bell size={32} style={{ color: '#7C3AED' }} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">No notifications yet</h3>
                  <p className="text-white/40 text-sm max-w-xs">
                    You&apos;ll be notified when someone likes you back or when you get a new match.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <ProtectedRoute>
      <MatchesContent />
    </ProtectedRoute>
  );
}
