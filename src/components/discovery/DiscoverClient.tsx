'use client';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDiscovery, type DiscoveryProfile } from '@/hooks/useDiscovery';
import { createClient } from '@/lib/supabase/client';
import { logActivityEvent } from '@/hooks/useActivity';
import Navbar from '@/components/Navbar';
import SwipeStack from '@/components/discovery/SwipeStack';
import MatchModal from '@/components/discovery/MatchModal';
import ProfileDetailModal from '@/components/discovery/ProfileDetailModal';
import ProfileMenu from '@/components/discovery/ProfileMenu';
import { Loader2 } from 'lucide-react';

// Online status update throttle: 60 seconds
const ONLINE_UPDATE_INTERVAL = 60_000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getPhotoUrlFromPath(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${path}`;
}

export default function DiscoverClient() {
  const { user, loading, isOnboardingComplete, profileLoading, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const {
    profiles,
    loading: profilesLoading,
    error,
    exhausted,
    fetchBatch,
    refresh,
    removeProfile,
    recordLike,
    recordPass,
    recordBlock,
    recordReport,
  } = useDiscovery();

  const [matchedProfile, setMatchedProfile] = useState<DiscoveryProfile | null>(null);
  const [matchedMatchId, setMatchedMatchId] = useState<string | null>(null);
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<DiscoveryProfile | null>(null);
  const [menuProfile, setMenuProfile] = useState<DiscoveryProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const lastOnlineUpdate = useRef<number>(0);
  const onlineIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auth guard
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isOnboardingComplete) {
      router.replace('/onboarding');
    }
  }, [loading, profileLoading, user, isOnboardingComplete, router]);

  // Fetch current user's primary photo for match modal
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profile_photos')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.storage_path) {
          setCurrentUserPhotoUrl(getPhotoUrlFromPath(data.storage_path));
        }
      });
  }, [user, supabase]);

  // Initial profile fetch
  useEffect(() => {
    if (user && isOnboardingComplete && !loading && !profileLoading) {
      fetchBatch(true);
    }
  }, [user, isOnboardingComplete, loading, profileLoading, fetchBatch]);

  // Online status management
  const updateOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    const now = Date.now();
    if (isOnline && now - lastOnlineUpdate.current < ONLINE_UPDATE_INTERVAL) return;
    lastOnlineUpdate.current = now;

    await supabase
      .from('profiles')
      .update({
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !isOnboardingComplete) return;

    // Mark online immediately
    updateOnlineStatus(true);

    // Refresh online status periodically
    onlineIntervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, ONLINE_UPDATE_INTERVAL);

    // Mark offline on page unload
    const handleUnload = () => {
      if (user) {
        supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (onlineIntervalRef.current) clearInterval(onlineIntervalRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark offline on unmount
      if (user) {
        supabase.from('profiles').update({ is_online: false }).eq('id', user.id);
      }
    };
  }, [user, isOnboardingComplete, updateOnlineStatus, supabase]);

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
      setActionError(err instanceof Error ? err.message : 'Failed to pass profile. Please try again.');
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
    setMenuProfile(null);
  }, [recordBlock, removeProfile]);

  const handleReport = useCallback(async (targetProfile: DiscoveryProfile, reason: string, description?: string) => {
    await recordReport(targetProfile.id, reason, description);
    setMenuProfile(null);
  }, [recordReport]);

  // Loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-white" />
          <p className="text-white/60 text-sm">Loading Avalon Dating...</p>
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

      <div className="flex pt-20 min-h-screen">
        {/* Main discovery area */}
        <main className="flex-1 flex flex-col items-center justify-start py-6 px-4 overflow-y-auto">
          {/* Error banner */}
          {(error || actionError) && (
            <div
              className="mb-4 px-4 py-3 rounded-2xl text-red-400 text-sm flex items-center gap-2 max-w-md w-full"
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

          <SwipeStack
            profiles={profiles}
            loading={profilesLoading}
            exhausted={exhausted}
            onLike={handleLike}
            onPass={handlePass}
            onSuperLike={handleSuperLike}
            onOpenProfile={setDetailProfile}
            onOpenMenu={setMenuProfile}
            onRefresh={refresh}
          />
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchModal
            key="match-modal"
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

      <AnimatePresence>
        {detailProfile && (
          <ProfileDetailModal
            key="detail-modal"
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
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuProfile && (
          <ProfileMenu
            key="menu-modal"
            profile={menuProfile}
            onClose={() => setMenuProfile(null)}
            onBlock={() => handleBlock(menuProfile)}
            onReport={(reason, description) => handleReport(menuProfile, reason, description)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
