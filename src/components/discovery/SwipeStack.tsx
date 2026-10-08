'use client';
import React, { useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, RefreshCw, Settings } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import ProfileCard from './ProfileCard';

interface SwipeStackProps {
  profiles: DiscoveryProfile[];
  loading: boolean;
  exhausted: boolean;
  onLike: (profile: DiscoveryProfile) => Promise<void>;
  onPass: (profile: DiscoveryProfile) => Promise<void>;
  onSuperLike: (profile: DiscoveryProfile) => Promise<void>;
  onOpenProfile: (profile: DiscoveryProfile) => void;
  onOpenMenu: (profile: DiscoveryProfile) => void;
  onRefresh: () => void;
}

interface DraggableCardProps {
  profile: DiscoveryProfile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  stackIndex: number;
}

function DraggableCard({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onOpenProfile,
  onOpenMenu,
  stackIndex,
}: DraggableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [40, 130], [0, 1]);
  const passOpacity = useTransform(x, [-130, -40], [1, 0]);
  const superLikeOpacity = useTransform(y, [-130, -40], [1, 0]);
  const [swiping, setSwiping] = useState<'left' | 'right' | 'up' | null>(null);
  const isDragging = useRef(false);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number; y: number } }) => {
    const { x: ox, y: oy } = info.offset;
    isDragging.current = false;

    if (oy < -110 && Math.abs(ox) < 90) {
      setSwiping('up');
      setTimeout(onSuperLike, 250);
    } else if (ox > 130) {
      setSwiping('right');
      setTimeout(onLike, 250);
    } else if (ox < -130) {
      setSwiping('left');
      setTimeout(onPass, 250);
    }
  }, [onLike, onPass, onSuperLike]);

  const isTop = stackIndex === 0;

  if (!isTop) {
    return (
      <div
        className="absolute inset-0"
        style={{ zIndex: 10 - stackIndex }}
      >
        <ProfileCard
          profile={profile}
          onLike={onLike}
          onPass={onPass}
          onSuperLike={onSuperLike}
          onOpenProfile={onOpenProfile}
          onOpenMenu={onOpenMenu}
          isTop={false}
          stackIndex={stackIndex}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, zIndex: 20 }}
      drag
      dragConstraints={{ top: -600, bottom: 200, left: -600, right: 600 }}
      dragElastic={0.75}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={
        swiping === 'right'
          ? { x: 900, opacity: 0, rotate: 30, transition: { duration: 0.35 } }
          : swiping === 'left'
          ? { x: -900, opacity: 0, rotate: -30, transition: { duration: 0.35 } }
          : swiping === 'up'
          ? { y: -900, opacity: 0, transition: { duration: 0.35 } }
          : {}
      }
    >
      {/* LIKE indicator */}
      <motion.div
        className="absolute top-10 left-5 z-30 pointer-events-none"
        style={{ opacity: likeOpacity, rotate: -20 }}
      >
        <div className="border-4 border-pink-400 rounded-xl px-4 py-2"
          style={{ background: 'rgba(236,72,153,0.15)' }}>
          <span className="text-pink-400 font-black text-2xl tracking-widest">LIKE ❤️</span>
        </div>
      </motion.div>

      {/* PASS indicator */}
      <motion.div
        className="absolute top-10 right-5 z-30 pointer-events-none"
        style={{ opacity: passOpacity, rotate: 20 }}
      >
        <div className="border-4 border-white/50 rounded-xl px-4 py-2"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <span className="text-white/80 font-black text-2xl tracking-widest">PASS ✕</span>
        </div>
      </motion.div>

      {/* SUPER LIKE indicator */}
      <motion.div
        className="absolute top-16 left-1/2 z-30 pointer-events-none"
        style={{ opacity: superLikeOpacity, x: '-50%' }}
      >
        <div className="border-4 border-yellow-400 rounded-xl px-4 py-2"
          style={{ background: 'rgba(251,191,36,0.15)' }}>
          <span className="text-yellow-400 font-black text-2xl tracking-widest">SUPER ★</span>
        </div>
      </motion.div>

      <ProfileCard
        profile={profile}
        onLike={onLike}
        onPass={onPass}
        onSuperLike={onSuperLike}
        onOpenProfile={onOpenProfile}
        onOpenMenu={onOpenMenu}
        isTop={true}
        stackIndex={0}
      />
    </motion.div>
  );
}

export default function SwipeStack({
  profiles,
  loading,
  exhausted,
  onLike,
  onPass,
  onSuperLike,
  onOpenProfile,
  onOpenMenu,
  onRefresh,
}: SwipeStackProps) {
  const visibleProfiles = profiles.slice(0, 3);
  const topProfile = visibleProfiles[0];

  if (loading && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full animate-pulse"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(236,72,153,0.4))' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={32} className="text-white/60 animate-pulse" />
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Finding your matches...</p>
          <p className="text-white/40 text-sm mt-1">Loading amazing profiles for you</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0 && exhausted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center max-w-xs mx-auto">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))', border: '1px solid rgba(255,255,255,0.1)' }}>
          💜
        </div>
        <div>
          <h3 className="font-bold text-white text-2xl mb-2">That&apos;s everyone for now</h3>
          <p className="text-white/50 text-sm leading-relaxed">
            New connections are arriving all the time. Check back soon or adjust your preferences.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
          >
            <RefreshCw size={16} />
            Refresh Discovery
          </button>
          <a
            href="/settings"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Settings size={16} />
            Edit Preferences
          </a>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full animate-pulse"
          style={{ background: 'rgba(124,58,237,0.3)' }} />
        <p className="text-white/50 text-sm">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Card stack */}
      <div
        className="relative w-[340px] sm:w-[380px] lg:w-[420px]"
        style={{ height: '580px' }}
      >
        <AnimatePresence>
          {visibleProfiles.map((profile, i) => (
            <DraggableCard
              key={profile.id}
              profile={profile}
              onLike={() => onLike(profile)}
              onPass={() => onPass(profile)}
              onSuperLike={() => onSuperLike(profile)}
              onOpenProfile={() => onOpenProfile(profile)}
              onOpenMenu={() => onOpenMenu(profile)}
              stackIndex={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      {topProfile && (
        <div className="flex items-center gap-5">
          <button
            onClick={() => onPass(topProfile)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            aria-label={`Pass ${topProfile.first_name}`}
          >
            <X size={26} className="text-white/70" />
          </button>

          <button
            onClick={() => onSuperLike(topProfile)}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FBBF24, #D4AF37)',
              boxShadow: '0 0 25px rgba(251,191,36,0.5), 0 8px 32px rgba(0,0,0,0.3)',
            }}
            aria-label={`Super Like ${topProfile.first_name}`}
          >
            <Star size={22} className="text-black fill-black" />
          </button>

          <button
            onClick={() => onLike(topProfile)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #EC4899, #f43f5e)',
              boxShadow: '0 0 30px rgba(236,72,153,0.6), 0 8px 32px rgba(0,0,0,0.3)',
            }}
            aria-label={`Like ${topProfile.first_name}`}
          >
            <Heart size={26} className="text-white fill-white" />
          </button>
        </div>
      )}

      {/* Swipe hint */}
      <p className="text-white/25 text-xs text-center">
        ← Pass &nbsp;·&nbsp; ↑ Super Like &nbsp;·&nbsp; → Like
      </p>
    </div>
  );
}
