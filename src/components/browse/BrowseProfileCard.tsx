'use client';
import React, { useState, useCallback } from 'react';
import { MapPin, Heart, X, Star, MoreVertical, Eye } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import { getPhotoUrl } from '@/hooks/useBrowse';
import AppImage from '@/components/ui/AppImage';

interface BrowseProfileCardProps {
  profile: DiscoveryProfile;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onOpenProfile: () => void;
  onOpenMenu: () => void;
  isMatched?: boolean;
  onMessage?: () => void;
}

function getActivityLabel(lastSeenAt: string | null, isOnline: boolean): string | null {
  if (isOnline) return null; // shown via badge
  if (!lastSeenAt) return null;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return 'Active recently';
  if (hours < 24) return `Active ${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 3) return `Active ${days}d ago`;
  return null;
}

export default function BrowseProfileCard({
  profile,
  onLike,
  onPass,
  onSuperLike,
  onOpenProfile,
  onOpenMenu,
  isMatched = false,
  onMessage,
}: BrowseProfileCardProps) {
  const [imgError, setImgError] = useState(false);

  const photos = profile.photos.sort((a, b) => a.display_order - b.display_order);
  const primaryPhoto = photos.find(p => p.is_primary) || photos[0];
  const photoUrl = primaryPhoto && !imgError
    ? getPhotoUrl(primaryPhoto.storage_path)
    : '/assets/images/no_image.png';

  const activityLabel = getActivityLabel(profile.last_seen_at, profile.is_online);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't open profile if clicking action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onOpenProfile();
  }, [onOpenProfile]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(180deg, #1a0a3e 0%, #0d0520 100%)',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={handleCardClick}
      role="article"
      aria-label={`${profile.first_name}'s profile`}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <AppImage
          src={photoUrl}
          alt={`${profile.first_name}, ${profile.age} — profile photo`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImgError(true)}
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(10,5,30,0.95) 0%, rgba(10,5,30,0.3) 50%, transparent 75%)' }}
        />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10">
          <div className="flex flex-col gap-1">
            {profile.is_online && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(74,222,128,0.4)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-white text-xs font-medium">Online</span>
              </div>
            )}
            {!profile.is_online && activityLabel && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-white/60 text-xs">{activityLabel}</span>
              </div>
            )}
          </div>

          {/* Menu button */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenMenu(); }}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            aria-label={`Open options for ${profile.first_name}`}
          >
            <MoreVertical size={13} className="text-white/80" />
          </button>
        </div>

        {/* Photo count indicator */}
        {photos.length > 1 && (
          <div
            className="absolute top-2.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-10"
          >
            {photos.slice(0, 6).map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        )}

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <h3 className="text-white font-bold text-base leading-tight">
              {profile.first_name}, {profile.age}
            </h3>
            {profile.is_verified && (
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FBBF24, #D4AF37)' }}
              >
                <span className="text-black text-[9px] font-black">✓</span>
              </div>
            )}
          </div>

          {(profile.city || profile.country) && (
            <div className="flex items-center gap-1 text-white/60 text-xs mb-1.5">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 2).map((interest) => (
                <span
                  key={`browse-int-${profile.id}-${interest}`}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124,58,237,0.4)',
                    border: '1px solid rgba(124,58,237,0.5)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 2 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  +{profile.interests.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 p-2.5">
        {isMatched && onMessage ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenProfile(); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-white/70 hover:text-white transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label={`View ${profile.first_name}'s profile`}
            >
              <Eye size={12} />
              View
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMessage(); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}
              aria-label={`Message ${profile.first_name}`}
            >
              💬 Message
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPass(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              aria-label={`Pass ${profile.first_name}`}
            >
              <X size={15} className="text-white/60" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
              aria-label={`Super Like ${profile.first_name}`}
            >
              <Star size={14} className="text-yellow-400" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 12px rgba(124,58,237,0.3)' }}
              aria-label={`Like ${profile.first_name}`}
            >
              <Heart size={12} className="text-white" />
              <span className="text-white">Like</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
