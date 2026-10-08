'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Shield, Wifi, ChevronLeft, ChevronRight, Heart, Star, Flag, ShieldOff, AlertTriangle } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';
import { getPhotoUrl } from '@/hooks/useBrowse';
import AppImage from '@/components/ui/AppImage';

interface BrowseProfileDetailProps {
  profile: DiscoveryProfile;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
  onSuperLike: () => void;
  onBlock: () => Promise<void>;
  onReport: (reason: string, description?: string) => Promise<void>;
  isMatched?: boolean;
  onMessage?: () => void;
}

const REPORT_REASONS = [
  'Fake profile',
  'Inappropriate photos',
  'Harassment or abuse',
  'Spam or scam',
  'Underage user',
  'Other',
];

type DetailView = 'profile' | 'report' | 'block-confirm';

export default function BrowseProfileDetail({
  profile,
  onClose,
  onLike,
  onPass,
  onSuperLike,
  onBlock,
  onReport,
  isMatched = false,
  onMessage,
}: BrowseProfileDetailProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [view, setView] = useState<DetailView>('profile');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const photos = profile.photos.sort((a, b) => a.display_order - b.display_order);
  const currentPhoto = photos[photoIndex];
  const photoUrl = currentPhoto && !imgError[photoIndex]
    ? getPhotoUrl(currentPhoto.storage_path)
    : '/assets/images/no_image.png';

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleReport = async () => {
    if (!selectedReason) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await onReport(selectedReason, description || undefined);
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await onBlock();
      onClose();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />

      <motion.div
        className="relative w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #1a0a3e 0%, #0d0520 100%)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 -20px 80px rgba(0,0,0,0.6)',
        }}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {view === 'profile' && (
          <>
            {/* Photo section */}
            <div className="relative h-80 sm:h-96 flex-shrink-0">
              <AppImage
                src={photoUrl}
                alt={`${profile.first_name}, ${profile.age} — photo ${photoIndex + 1}`}
                fill
                className="object-cover rounded-t-3xl"
                sizes="600px"
                priority
                onError={() => setImgError(prev => ({ ...prev, [photoIndex]: true }))}
              />

              {/* Photo indicators */}
              {photos.length > 1 && (
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                  {photos.map((_, i) => (
                    <button
                      key={`detail-prog-${i}`}
                      onClick={() => setPhotoIndex(i)}
                      className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i === photoIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' }}
                      aria-label={`View photo ${i + 1} of ${profile.first_name}`}
                    />
                  ))}
                </div>
              )}

              {/* Photo nav */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex(i => Math.max(i - 1, 0))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    aria-label="Previous photo"
                    disabled={photoIndex === 0}
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex(i => Math.min(i + 1, photos.length - 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    aria-label="Next photo"
                    disabled={photoIndex === photos.length - 1}
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                </>
              )}

              {/* Gradient */}
              <div className="absolute inset-0 pointer-events-none rounded-t-3xl"
                style={{ background: 'linear-gradient(to top, rgba(26,10,62,1) 0%, transparent 50%)' }} />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                aria-label="Close profile"
              >
                <X size={18} className="text-white" />
              </button>

              {/* Report/Block menu */}
              <button
                onClick={() => setView('report')}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                aria-label={`Report or block ${profile.first_name}`}
              >
                <Flag size={15} className="text-white/70" />
              </button>

              {/* Name overlay */}
              <div className="absolute bottom-4 left-5 right-5 z-10">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-white font-bold text-2xl">{profile.first_name}, {profile.age}</h2>
                  {profile.is_verified && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FBBF24, #D4AF37)' }}>
                      <span className="text-black text-xs font-black">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {(profile.city || profile.country) && (
                    <span className="flex items-center gap-1 text-white/70 text-sm">
                      <MapPin size={12} />
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.is_online && (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <Wifi size={12} />
                      Online now
                    </span>
                  )}
                  {profile.is_verified && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Shield size={12} />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex flex-col gap-5">
              {/* Bio */}
              {profile.bio && (
                <div>
                  <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">About</h3>
                  <p className="text-white/85 text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Interests */}
              {profile.interests.length > 0 && (
                <div>
                  <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={`detail-int-${interest}`}
                        className="text-sm px-3 py-1.5 rounded-full font-medium"
                        style={{
                          background: 'rgba(124,58,237,0.3)',
                          border: '1px solid rgba(124,58,237,0.5)',
                          color: 'rgba(255,255,255,0.9)',
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photo grid */}
              {photos.length > 1 && (
                <div>
                  <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                    Photos ({photos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, i) => (
                      <button
                        key={`grid-photo-${photo.id}`}
                        onClick={() => setPhotoIndex(i)}
                        className="aspect-square rounded-xl overflow-hidden relative"
                        style={{ border: i === photoIndex ? '2px solid #7C3AED' : '2px solid transparent' }}
                        aria-label={`View photo ${i + 1} of ${profile.first_name}`}
                      >
                        <AppImage
                          src={getPhotoUrl(photo.storage_path)}
                          alt={`${profile.first_name} photo ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2 pb-safe">
                {isMatched && onMessage ? (
                  <>
                    <button
                      onClick={onPass}
                      className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 text-white/70 hover:text-white transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                      <X size={16} />
                      Pass
                    </button>
                    <button
                      onClick={onMessage}
                      className="flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                    >
                      💬 Message {profile.first_name}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onPass}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                      aria-label={`Pass ${profile.first_name}`}
                    >
                      <X size={18} className="text-white/60" />
                    </button>
                    <button
                      onClick={onSuperLike}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}
                      aria-label={`Super Like ${profile.first_name}`}
                    >
                      <Star size={17} className="text-yellow-400" />
                    </button>
                    <button
                      onClick={onLike}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                      aria-label={`Like ${profile.first_name}`}
                    >
                      <Heart size={16} className="text-white" />
                      Like {profile.first_name}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Report view */}
        {view === 'report' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base">Report {profile.first_name}</h3>
              <button onClick={() => setView('profile')} className="text-white/50 hover:text-white" aria-label="Back to profile">
                <X size={18} />
              </button>
            </div>
            {actionError && (
              <div className="mb-4 p-3 rounded-xl text-red-400 text-sm flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} />
                {actionError}
              </div>
            )}
            <p className="text-white/50 text-sm mb-3">Select a reason:</p>
            <div className="flex flex-col gap-2 mb-4">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className="px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                  style={{
                    background: selectedReason === reason ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                    border: selectedReason === reason ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    color: selectedReason === reason ? 'white' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            {selectedReason && (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Additional details (optional)"
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none mb-4"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            )}
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setView('profile')}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!selectedReason || actionLoading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
              >
                {actionLoading ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
            <button
              onClick={() => setView('block-confirm')}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-red-400 hover:text-red-300 transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <ShieldOff size={14} className="inline mr-2" />
              Block {profile.first_name}
            </button>
          </div>
        )}

        {/* Block confirm view */}
        {view === 'block-confirm' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base">Block {profile.first_name}?</h3>
              <button onClick={() => setView('profile')} className="text-white/50 hover:text-white" aria-label="Back to profile">
                <X size={18} />
              </button>
            </div>
            {actionError && (
              <div className="mb-4 p-3 rounded-xl text-red-400 text-sm flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={14} />
                {actionError}
              </div>
            )}
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Blocking <strong className="text-white">{profile.first_name}</strong> will remove them from your Browse and prevent any future contact.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setView('profile')}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {actionLoading ? 'Blocking…' : 'Block User'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
