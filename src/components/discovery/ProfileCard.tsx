'use client';
import React, { useState, useCallback } from 'react';

import { X, Star, Heart, MapPin, Shield, MoreVertical, Info } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import { getPhotoUrl } from '@/hooks/useDiscovery';
import AppImage from '@/components/ui/AppImage';

interface ProfileCardProps {
  profile: DiscoveryProfile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  isTop: boolean;
  stackIndex: number;
}

export default function ProfileCard({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onOpenProfile,
  onOpenMenu,
  isTop,
  stackIndex,
}: ProfileCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const photos = profile.photos.sort((a, b) => a.display_order - b.display_order);
  const currentPhoto = photos[photoIndex];
  const photoUrl = currentPhoto && !imgError[photoIndex]
    ? getPhotoUrl(currentPhoto.storage_path)
    : '/assets/images/no_image.png';

  const nextPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(i => Math.min(i + 1, photos.length - 1));
  }, [photos.length]);

  const prevPhoto = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(i => Math.max(i - 1, 0));
  }, []);

  const stackOffset = stackIndex * 10;
  const stackScale = 1 - stackIndex * 0.04;
  const stackOpacity = 1 - stackIndex * 0.15;

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{
          transform: `translateY(${stackOffset}px) scale(${stackScale})`,
          opacity: stackOpacity,
          zIndex: 10 - stackIndex,
          pointerEvents: 'none',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <AppImage
          src={photos[0] ? getPhotoUrl(photos[0].storage_path) : '/assets/images/no_image.png'}
          alt={`${profile.first_name}'s photo`}
          fill
          className="object-cover"
          sizes="420px"
        />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,5,30,0.85) 0%, transparent 55%)' }} />
        <div className="absolute bottom-5 left-5">
          <p className="text-white font-bold text-xl">{profile.first_name}, {profile.age}</p>
          {profile.city && (
            <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
              <MapPin size={12} />{profile.city}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 rounded-3xl overflow-hidden select-none"
      style={{
        zIndex: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* Photo */}
      <div className="absolute inset-0">
        <AppImage
          src={photoUrl}
          alt={`${profile.first_name}'s photo`}
          fill
          className="object-cover"
          priority
          sizes="420px"
          onError={() => setImgError(prev => ({ ...prev, [photoIndex]: true }))}
        />
      </div>

      {/* Photo progress indicators */}
      {photos.length > 1 && (
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {photos.map((_, i) => (
            <div
              key={`prog-${profile.id}-${i}`}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i === photoIndex
                  ? 'rgba(255,255,255,0.95)'
                  : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Photo tap zones */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prevPhoto}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Previous photo"
            style={{ opacity: 0 }}
          />
          <button
            onClick={nextPhoto}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            aria-label="Next photo"
            style={{ opacity: 0 }}
          />
        </>
      )}

      {/* Top-right badges */}
      <div className="absolute top-10 right-3 flex flex-col gap-1.5 z-10">
        {profile.is_online && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(74,222,128,0.4)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-medium">Online</span>
          </div>
        )}
        {profile.is_verified && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(212,175,55,0.4)' }}>
            <Shield size={11} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">Verified</span>
          </div>
        )}
      </div>

      {/* Menu button */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpenMenu(); }}
        className="absolute top-10 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
        aria-label={`Open menu for ${profile.first_name}`}
      >
        <MoreVertical size={16} className="text-white/80" />
      </button>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,5,30,0.95) 0%, rgba(10,5,30,0.5) 35%, transparent 60%)' }} />

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <div className="flex items-end justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-white font-bold text-2xl leading-tight">
                {profile.first_name}, {profile.age}
              </h2>
              {profile.is_verified && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FBBF24, #D4AF37)' }}>
                  <span className="text-black text-xs font-black">✓</span>
                </div>
              )}
            </div>
            {(profile.city || profile.country) && (
              <div className="flex items-center gap-1 text-white/70 text-sm mb-1">
                <MapPin size={12} />
                <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenProfile(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label={`Open ${profile.first_name}'s full profile`}
          >
            <Info size={16} className="text-white/80" />
          </button>
        </div>

        {profile.bio && (
          <p className="text-white/75 text-sm leading-relaxed line-clamp-2 mb-3">{profile.bio}</p>
        )}

        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={`int-${profile.id}-${interest}`}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(124,58,237,0.35)',
                  border: '1px solid rgba(124,58,237,0.5)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {interest}
              </span>
            ))}
            {profile.interests.length > 4 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                +{profile.interests.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 pb-4 pt-20 z-20"
        style={{ background: 'linear-gradient(to top, rgba(10,5,30,0.7) 0%, transparent 100%)' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onPass(); }}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          aria-label={`Pass ${profile.first_name}`}
        >
          <X size={22} className="text-white/80" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #D4AF37)', boxShadow: '0 0 20px rgba(251,191,36,0.5)' }}
          aria-label={`Super Like ${profile.first_name}`}
        >
          <Star size={18} className="text-black fill-black" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #EC4899, #f43f5e)', boxShadow: '0 0 25px rgba(236,72,153,0.6)' }}
          aria-label={`Like ${profile.first_name}`}
        >
          <Heart size={22} className="text-white fill-white" />
        </button>
      </div>
    </div>
  );
}
