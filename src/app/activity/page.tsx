'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BarChart3, Heart, Star, MessageCircle, Eye, Users, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { useActivity, getActivityLabel, formatLastActive } from '@/hooks/useActivity';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import ProfileCompletenessWidget from '@/components/profile/ProfileCompletenessWidget';
import type { ActivityEventType } from '@/hooks/useActivity';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-white font-bold text-2xl leading-none">{value}</p>
        <p className="text-white/50 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

function ActivityItem({ event }: { event: { activity_id: string; event_type: ActivityEventType; metadata: Record<string, unknown>; created_at: string; related_user_name: string | null; related_user_photo: string | null } }) {
  const { emoji, label } = getActivityLabel(event.event_type, event.metadata);
  const photoPath = event.related_user_photo;
  const photoUrl = photoPath ? `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${photoPath}` : null;

  const timeAgo = (() => {
    const now = new Date();
    const then = new Date(event.created_at);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/8 last:border-0">
      {/* Avatar or emoji */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={event.related_user_name || ''} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{emoji}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm leading-snug">{label}</p>
      </div>
      <span className="text-white/35 text-xs flex-shrink-0">{timeAgo}</span>
    </div>
  );
}

export default function ActivityPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    events,
    stats,
    loading,
    statsLoading,
    error,
    hasMore,
    fetchActivity,
    fetchStats,
    loadMore,
  } = useActivity();
  const { data: completeness } = useProfileCompleteness(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchActivity(true);
      fetchStats();
    }
  }, [user, fetchActivity, fetchStats]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchActivity(true), fetchStats()]);
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-white text-2xl md:text-3xl">Your Activity</h1>
            <p className="text-white/50 text-sm mt-1">
              {profile.first_name ? `Hey ${profile.first_name}!` : 'Hey!'} Here&apos;s your dating journey.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 glass rounded-xl text-white/60 hover:text-white transition-colors"
            aria-label="Refresh activity"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Profile Completeness */}
        <div className="mb-6">
          <ProfileCompletenessWidget />
        </div>

        {/* Stats Grid */}
        <div className="mb-6">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 size={14} />
            Your Statistics
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-4 animate-pulse h-24" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                icon={<Eye size={18} className="text-white" />}
                label="Profile Views"
                value={stats.profile_views}
                color="bg-purple-500/30"
              />
              <StatCard
                icon={<Heart size={18} className="text-white" />}
                label="Likes Sent"
                value={stats.likes_sent}
                color="bg-pink-500/30"
              />
              <StatCard
                icon={<Heart size={18} className="text-white" />}
                label="Likes Received"
                value={stats.likes_received}
                color="bg-accent/30"
              />
              <StatCard
                icon={<Star size={18} className="text-white" />}
                label="Super Likes"
                value={stats.super_likes_sent}
                color="bg-gold/20"
              />
              <StatCard
                icon={<Users size={18} className="text-white" />}
                label="Matches"
                value={stats.matches}
                color="bg-violet-500/30"
              />
              <StatCard
                icon={<MessageCircle size={18} className="text-white" />}
                label="Messages Sent"
                value={stats.messages_sent}
                color="bg-indigo-500/30"
              />
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center text-white/50 text-sm">
              Could not load statistics. Please try again.
            </div>
          )}
        </div>

        {/* Profile Completion Score in Stats */}
        {completeness && (
          <div className="mb-6">
            <div className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{completeness.score}%</span>
              </div>
              <div>
                <p className="text-white font-bold text-2xl leading-none">{completeness.score}%</p>
                <p className="text-white/50 text-xs mt-1">Profile Completion</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div>
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⚡</span>
            Recent Activity
          </h2>

          {loading && events.length === 0 ? (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 text-white/50">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Loading your activity...</span>
              </div>
            </div>
          ) : error ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-white/60 text-sm">We couldn&apos;t load your activity. Please try again.</p>
              <button
                onClick={() => fetchActivity(true)}
                className="mt-3 text-accent text-sm hover:underline"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-white font-semibold mb-1">No activity yet</p>
              <p className="text-white/50 text-sm">
                Start discovering people and your activity will appear here.
              </p>
              <a href="/discover" className="inline-block mt-4 btn-primary px-6 py-2.5 text-sm font-semibold">
                Start Discovering
              </a>
            </div>
          ) : (
            <div className="glass rounded-2xl px-4 py-2">
              {events.map(event => (
                <ActivityItem key={event.activity_id} event={event} />
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="pt-3 pb-1 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors py-2 px-4"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Last Active */}
        {profile.last_seen_at && (
          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              {formatLastActive(profile.last_seen_at)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
