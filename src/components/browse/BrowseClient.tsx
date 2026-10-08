'use client';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, RefreshCw, Users, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrowse, DEFAULT_FILTERS, type BrowseFilters } from '@/hooks/useBrowse';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import { createClient } from '@/lib/supabase/client';
import { logActivityEvent } from '@/hooks/useActivity';
import Navbar from '@/components/Navbar';
import MatchModal from '@/components/discovery/MatchModal';
import BrowseProfileCard from '@/components/browse/BrowseProfileCard';
import BrowseFilterPanel, { BrowseSearchBar } from '@/components/browse/BrowseFilterPanel';
import BrowseProfileDetail from '@/components/browse/BrowseProfileDetail';
import { Loader2 } from 'lucide-react';

// Online status update throttle: 60 seconds
const ONLINE_UPDATE_INTERVAL = 60_000;

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="aspect-[3/4]" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="p-2.5 flex gap-1.5">
        <div className="h-9 flex-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-9 w-9 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-9 w-9 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  );
}

// Active filter chips
function FilterChips({ filters, onClear }: { filters: BrowseFilters; onClear: () => void }) {
  const chips: string[] = [];
  if (filters.gender) chips.push(filters.gender === 'women' ? 'Women' : filters.gender === 'men' ? 'Men' : filters.gender);
  if (filters.minAge !== 18 || filters.maxAge !== 60) chips.push(`${filters.minAge}–${filters.maxAge} yrs`);
  if (filters.verifiedOnly) chips.push('Verified only');
  if (filters.onlineOnly) chips.push('Online only');
  if (filters.relationshipIntention) chips.push(filters.relationshipIntention);
  filters.interests.forEach(i => chips.push(i));

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: 'rgba(124,58,237,0.25)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {chip}
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-xs text-white/40 hover:text-white/70 transition-colors underline"
      >
        Clear all
      </button>
    </div>
  );
}

export default function BrowseClient() {
  const { user, loading, isOnboardingComplete, profileLoading, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const {
    profiles,
    loading: profilesLoading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    fetchProfiles,
    fetchCount,
    applyFilters,
    loadMore,
    refresh,
    removeProfile,
    recordLike,
    recordPass,
    recordBlock,
    recordReport,
    recordProfileView,
  } = useBrowse();

  const [matchedProfile, setMatchedProfile] = useState<DiscoveryProfile | null>(null);
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<DiscoveryProfile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);

  const lastOnlineUpdate = useRef<number>(0);
  const onlineIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileViewTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auth guard
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!isOnboardingComplete) { router.replace('/onboarding'); }
  }, [loading, profileLoading, user, isOnboardingComplete, router]);

  // Fetch current user's primary photo for match modal
  useEffect(() => {
    if (!user) return;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    supabase
      .from('profile_photos')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.storage_path) {
          setCurrentUserPhotoUrl(`${SUPABASE_URL}/storage/v1/object/public/profile-photos/${data.storage_path}`);
        }
      });
  }, [user, supabase]);

  // Initial fetch
  useEffect(() => {
    if (user && isOnboardingComplete && !loading && !profileLoading) {
      fetchProfiles(DEFAULT_FILTERS, true);
      fetchCount();
    }
  }, [user, isOnboardingComplete, loading, profileLoading, fetchProfiles, fetchCount]);

  // Online status management
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    const now = Date.now();
    if (isOnline && now - lastOnlineUpdate.current < ONLINE_UPDATE_INTERVAL) return;
    lastOnlineUpdate.current = now;
    await supabase.from('profiles').update({ is_online: isOnline, last_seen_at: new Date().toISOString() }).eq('id', user.id);
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !isOnboardingComplete) return;
    updateOnlineStatus(true);
    onlineIntervalRef.current = setInterval(() => updateOnlineStatus(true), ONLINE_UPDATE_INTERVAL);
    const handleUnload = () => { if (user) supabase.from('profiles').update({ is_online: false }).eq('id', user.id); };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') updateOnlineStatus(false);
      else updateOnlineStatus(true);
    };
    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (onlineIntervalRef.current) clearInterval(onlineIntervalRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (user) supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
    };
  }, [user, isOnboardingComplete, updateOnlineStatus, supabase]);

  // Profile view tracking — throttled, triggered on card open
  const handleOpenProfile = useCallback((p: DiscoveryProfile) => {
    setDetailProfile(p);
    // Debounce profile view recording: record after 2s of viewing
    const existing = profileViewTimers.current.get(p.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      recordProfileView(p.id);
      profileViewTimers.current.delete(p.id);
    }, 2000);
    profileViewTimers.current.set(p.id, timer);
  }, [recordProfileView]);

  // Actions
  const handleLike = useCallback(async (targetProfile: DiscoveryProfile) => {
    setActionError(null);
    removeProfile(targetProfile.id);
    try {
      const result = await recordLike(targetProfile.id, false);
      if (result.matched && !result.already_done) {
        setMatchedProfile(targetProfile);
        setMatchedMatchId(result.match_id ?? null);
        logActivityEvent('match_received', { related_user_id: targetProfile.id, related_user_name: targetProfile.first_name });
      }
      logActivityEvent('liked_user', { related_user_id: targetProfile.id, related_user_name: targetProfile.first_name });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to like profile. Please try again.');
    }
  }, [removeProfile, recordLike]);

  const handlePass = useCallback(async (targetProfile: DiscoveryProfile) => {
    setActionError(null);
    removeProfile(targetProfile.id);
    try {
      await recordPass(targetProfile.id);
      logActivityEvent('passed_user', { related_user_id: targetProfile.id, related_user_name: targetProfile.first_name });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to pass. Please try again.');
    }
  }, [removeProfile, recordPass]);

  const handleSuperLike = useCallback(async (targetProfile: DiscoveryProfile) => {
    setActionError(null);
    removeProfile(targetProfile.id);
    try {
      const result = await recordLike(targetProfile.id, true);
      if (result.matched && !result.already_done) {
        setMatchedProfile(targetProfile);
        setMatchedMatchId(result.match_id ?? null);
        logActivityEvent('match_received', { related_user_id: targetProfile.id, related_user_name: targetProfile.first_name });
      }
      logActivityEvent('super_liked_user', { related_user_id: targetProfile.id, related_user_name: targetProfile.first_name });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to super like. Please try again.');
    }
  }, [removeProfile, recordLike]);

  const handleBlock = useCallback(async (targetProfile: DiscoveryProfile) => {
    await recordBlock(targetProfile.id);
    removeProfile(targetProfile.id);
    setDetailProfile(null);
  }, [recordBlock, removeProfile]);

  const handleReport = useCallback(async (targetProfile: DiscoveryProfile, reason: string, description?: string) => {
    await recordReport(targetProfile.id, reason, description);
    setDetailProfile(null);
  }, [recordReport]);

  const handleSearchSubmit = useCallback(() => {
    applyFilters({ ...filters, search: searchInput.trim() });
  }, [applyFilters, filters, searchInput]);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    applyFilters(DEFAULT_FILTERS);
  }, [applyFilters]);

  const hasActiveFilters = (
    filters.gender !== DEFAULT_FILTERS.gender ||
    filters.minAge !== DEFAULT_FILTERS.minAge ||
    filters.maxAge !== DEFAULT_FILTERS.maxAge ||
    filters.verifiedOnly ||
    filters.onlineOnly ||
    filters.interests.length > 0 ||
    filters.relationshipIntention !== DEFAULT_FILTERS.relationshipIntention ||
    filters.search !== DEFAULT_FILTERS.search
  );

  // Loading state
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

  const currentUserName = profile?.first_name || 'You';
  const currentUserInitial = (profile?.first_name?.[0] || user.email?.[0] || 'U').toUpperCase();

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />

      <main className="pt-20 pb-16 px-4 sm:px-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1
                className="font-display font-bold text-3xl sm:text-4xl mb-1"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #F472B6 50%, #FBBF24 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Discover People
              </h1>
              <p className="text-white/55 text-sm sm:text-base">Meet real people. Find real connections.</p>
              {totalCount !== null && totalCount > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Users size={13} className="text-purple-400" />
                  <span className="text-white/40 text-xs">
                    {totalCount} {totalCount === 1 ? 'person' : 'people'} available
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <BrowseSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={handleSearchSubmit}
              />
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 flex-shrink-0"
                style={{
                  background: hasActiveFilters ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)',
                  border: hasActiveFilters ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.15)',
                  color: hasActiveFilters ? 'white' : 'rgba(255,255,255,0.7)',
                }}
                aria-label="Filter profiles"
              >
                <SlidersHorizontal size={15} />
                Filters
                {hasActiveFilters && (
                  <span
                    className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #7C3AED)' }}
                  >
                    !
                  </span>
                )}
              </button>
              <button
                onClick={refresh}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                aria-label="Refresh profiles"
                disabled={profilesLoading}
              >
                <RefreshCw size={15} className={`text-white/60 ${profilesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-3">
              <FilterChips filters={filters} onClear={handleClearFilters} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {(error || actionError) && (
          <div
            className="mb-6 px-4 py-3 rounded-2xl text-red-400 text-sm flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <span>⚠️</span>
            <span className="flex-1">{error || actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-red-400/60 hover:text-red-400 flex-shrink-0"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Profile Grid */}
        {profilesLoading && profiles.length === 0 ? (
          // Skeleton loading
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              <Search size={32} className="text-purple-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">
              {hasActiveFilters ? 'No matches found' : "You're all caught up"}
            </h2>
            <p className="text-white/50 text-sm max-w-xs mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to discover more people.' :'New connections are arriving all the time. Check back soon!'}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => setFilterOpen(true)}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Adjust Preferences
              </button>
              <button
                onClick={refresh}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white/70 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {profiles.map(p => (
                <BrowseProfileCard
                  key={p.id}
                  profile={p}
                  onLike={() => handleLike(p)}
                  onPass={() => handlePass(p)}
                  onSuperLike={() => handleSuperLike(p)}
                  onOpenProfile={() => handleOpenProfile(p)}
                  onOpenMenu={() => handleOpenProfile(p)}
                />
              ))}

              {/* Loading more skeletons */}
              {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={`skel-more-${i}`} />
              ))}
            </div>

            {/* Load More / End of results */}
            <div className="mt-8 flex justify-center">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-60"
                  style={{
                    background: 'rgba(124,58,237,0.2)',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                >
                  {loadingMore ? (
                    <><Loader2 size={15} className="animate-spin" /> Loading more…</>
                  ) : (
                    'Load More Profiles'
                  )}
                </button>
              ) : profiles.length > 0 ? (
                <p className="text-white/30 text-sm italic">You've seen everyone for now ✨</p>
              ) : null}
            </div>
          </>
        )}
      </main>

      {/* Filter Panel */}
      <BrowseFilterPanel
        filters={filters}
        onApply={applyFilters}
        onClose={() => setFilterOpen(false)}
        isOpen={filterOpen}
      />

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {detailProfile && (
          <BrowseProfileDetail
            key="browse-detail"
            profile={detailProfile}
            onClose={() => setDetailProfile(null)}
            onLike={() => {
              handleLike(detailProfile);
              setDetailProfile(null);
            }}
            onPass={() => {
              handlePass(detailProfile);
              setDetailProfile(null);
            }}
            onSuperLike={() => {
              handleSuperLike(detailProfile);
              setDetailProfile(null);
            }}
            onBlock={() => handleBlock(detailProfile)}
            onReport={(reason, desc) => handleReport(detailProfile, reason, desc)}
          />
        )}
      </AnimatePresence>

      {/* Match Modal */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchModal
            key="browse-match-modal"
            matchedProfile={matchedProfile}
            currentUserName={currentUserName}
            currentUserInitial={currentUserInitial}
            currentUserPhotoUrl={currentUserPhotoUrl}
            matchId={matchedMatchId}
            onSendMessage={() => {
              const mid = matchedMatchId;
              setMatchedProfile(null);
              setMatchedMatchId(null);
              if (mid) {
                router.push(`/chat?match_id=${mid}`);
              } else {
                router.push('/chat');
              }
            }}
            onKeepDiscovering={() => {
              setMatchedProfile(null);
              setMatchedMatchId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
