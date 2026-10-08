'use client';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Heart } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import { getPhotoUrl } from '@/hooks/useDiscovery';
import AppImage from '@/components/ui/AppImage';


interface MatchModalProps {
  matchedProfile: DiscoveryProfile;
  currentUserName: string;
  currentUserInitial: string;
  currentUserPhotoUrl?: string | null;
  matchId?: string | null;
  onSendMessage: () => void;
  onKeepDiscovering: () => void;
}

const CONFETTI_COLORS = ['#7C3AED', '#EC4899', '#FBBF24', '#F472B6', '#D4AF37', '#9333EA', '#ffffff', '#a78bfa'];

function ConfettiPiece({ index }: { index: number }) {
  const left = (index * 7.3 + 3) % 100;
  const delay = (index * 0.11) % 1.8;
  const size = 5 + (index % 5) * 3;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const isCircle = index % 3 === 0;
  const xDrift = index % 2 === 0 ? 50 + (index % 30) : -(50 + (index % 30));

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: '-12px',
        width: size,
        height: isCircle ? size : size * 0.55,
        borderRadius: isCircle ? '50%' : '2px',
        background: color,
      }}
      animate={{
        y: ['0vh', '115vh'],
        x: [0, xDrift],
        rotate: [0, index % 2 === 0 ? 540 : -540],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 2.8 + (index % 4) * 0.4,
        delay,
        ease: 'easeIn',
        repeat: Infinity,
        repeatDelay: 0.3,
      }}
    />
  );
}

export default function MatchModal({
  matchedProfile,
  currentUserName,
  currentUserInitial,
  currentUserPhotoUrl,
  matchId,
  onSendMessage,
  onKeepDiscovering,
}: MatchModalProps) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const primaryPhoto = matchedProfile.photos
    .sort((a, b) => a.display_order - b.display_order)[0];
  const matchedPhotoUrl = primaryPhoto ? getPhotoUrl(primaryPhoto.storage_path) : '/assets/images/no_image.png';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(124,58,237,0.7) 0%, rgba(10,5,30,0.97) 70%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <ConfettiPiece key={`confetti-${i}`} index={i} />
        ))}
      </div>

      {/* Pink glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.25) 0%, transparent 65%)' }} />

      {/* Close button */}
      <button
        onClick={onKeepDiscovering}
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        aria-label="Close match modal"
      >
        <X size={20} className="text-white/70" />
      </button>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-sm w-full"
        initial={{ scale: 0.6, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
      >
        {/* Animated hearts */}
        <div className="flex justify-center gap-3 mb-5">
          {(['💜', '💗', '💜'] as const).map((emoji, i) => (
            <motion.span
              key={`heart-${i}`}
              className={i === 1 ? 'text-5xl' : 'text-4xl'}
              animate={{ scale: [1, 1.35, 1], rotate: i === 1 ? [10, -10, 10] : [-10, 10, -10] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.2 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Heading */}
        <motion.h2
          className="font-bold text-5xl mb-2 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FBBF24 0%, #ffffff 50%, #F472B6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={{ scale: [0.85, 1.05, 1] }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          IT&apos;S A MATCH!
        </motion.h2>
        <p className="text-white/70 text-base mb-7">You and {matchedProfile.first_name} liked each other ❤️</p>

        {/* Tinder-style profile merge / heart bubble */}
        <div className="relative flex items-center justify-center h-32 mb-4">
          <motion.div
            className="absolute left-1/2 -translate-x-[92px] w-24 h-24 rounded-full overflow-hidden border-4 z-10"
            style={{ borderColor: '#7C3AED', boxShadow: '0 0 28px rgba(124,58,237,0.65)' }}
            initial={{ x: -70, scale: 0.72, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.25 }}
          >
            {currentUserPhotoUrl ? (
              <AppImage src={currentUserPhotoUrl} alt={`${currentUserName}'s photo`} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #7C3AED, #4C1D95)' }}>{currentUserInitial}</div>
            )}
          </motion.div>

          <motion.div
            className="absolute z-30 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #EC4899, #7C3AED)', boxShadow: '0 0 34px rgba(236,72,153,0.75)', border: '3px solid rgba(255,255,255,0.9)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.35, 1], opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.62 }}
          >
            <Heart size={28} fill="white" strokeWidth={2.5} className="text-white" />
          </motion.div>

          <motion.div
            className="absolute left-1/2 translate-x-[4px] w-24 h-24 rounded-full overflow-hidden border-4 z-10"
            style={{ borderColor: '#EC4899', boxShadow: '0 0 28px rgba(236,72,153,0.65)' }}
            initial={{ x: 70, scale: 0.72, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.25 }}
          >
            <AppImage src={matchedPhotoUrl} alt={`${matchedProfile.first_name}'s photo`} width={96} height={96} className="object-cover w-full h-full" />
          </motion.div>

          {[0,1,2,3,4,5].map(i => (
            <motion.span
              key={`mini-heart-${i}`}
              className="absolute text-pink-300 text-sm pointer-events-none"
              style={{ left: `${28 + i * 9}%`, top: `${12 + (i % 3) * 20}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.7], y: [8, -12, -28] }}
              transition={{ duration: 1.8, delay: 0.8 + i * 0.12, repeat: Infinity, repeatDelay: 0.8 }}
            >♥</motion.span>
          ))}
        </div>

        {/* Profile photos */}
        <div className="hidden">
          {/* Current user avatar */}
          <motion.div
            className="relative"
            animate={{ x: [25, 0] }}
            transition={{ type: 'spring', stiffness: 180, delay: 0.3 }}
          >
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 flex items-center justify-center"
              style={{
                borderColor: '#7C3AED',
                background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                boxShadow: '0 0 25px rgba(124,58,237,0.6)',
              }}
            >
              {currentUserPhotoUrl ? (
                <AppImage
                  src={currentUserPhotoUrl}
                  alt={`${currentUserName}'s photo`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-white text-3xl font-bold">{currentUserInitial}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
          </motion.div>

          {/* Heart divider */}
          <motion.div
            animate={{ scale: [0, 1.4, 1] }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            <span className="text-3xl">❤️</span>
          </motion.div>

          {/* Match's avatar */}
          <motion.div
            className="relative"
            animate={{ x: [-25, 0] }}
            transition={{ type: 'spring', stiffness: 180, delay: 0.3 }}
          >
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4"
              style={{
                borderColor: '#EC4899',
                boxShadow: '0 0 25px rgba(236,72,153,0.6)',
              }}
            >
              <AppImage
                src={matchedPhotoUrl}
                alt={`${matchedProfile.first_name}'s photo`}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            {matchedProfile.is_online && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
            )}
          </motion.div>
        </div>

        {/* Names */}
        <p className="text-white font-bold text-xl mb-1">
          {currentUserName} &amp; {matchedProfile.first_name}
        </p>
        {(matchedProfile.city || matchedProfile.country) && (
          <p className="text-white/40 text-sm mb-8">
            {[matchedProfile.city, matchedProfile.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSendMessage}
            className="py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
            }}
          >
            <MessageCircle size={18} />
            Send a Message
          </button>
          <button
            onClick={onKeepDiscovering}
            className="py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-white/70 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Heart size={16} />
            Keep Discovering
          </button>
        </div>

        <p className="text-white/25 text-sm mt-5 italic">Love is closer than you think ♡</p>
      </motion.div>
    </motion.div>
  );
}
