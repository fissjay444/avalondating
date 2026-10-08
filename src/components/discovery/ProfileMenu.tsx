'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Flag, ShieldOff, AlertTriangle } from 'lucide-react';
import type { DiscoveryProfile } from '@/hooks/useDiscovery';

interface ProfileMenuProps {
  profile: DiscoveryProfile;
  onClose: () => void;
  onBlock: () => Promise<void>;
  onReport: (reason: string, description?: string) => Promise<void>;
}

const REPORT_REASONS = [
  'Fake profile',
  'Inappropriate photos',
  'Harassment or abuse',
  'Spam or scam',
  'Underage user',
  'Other',
];

type MenuView = 'main' | 'report' | 'block-confirm';

export default function ProfileMenu({ profile, onClose, onBlock, onReport }: ProfileMenuProps) {
  const [view, setView] = useState<MenuView>('main');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async () => {
    if (!selectedReason) return;
    setLoading(true);
    setError(null);
    try {
      await onReport(selectedReason, description || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    setError(null);
    try {
      await onBlock();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a0a3e 0%, #0d0520 100%)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-base">
            {view === 'main' && `Options for ${profile.first_name}`}
            {view === 'report' && `Report ${profile.first_name}`}
            {view === 'block-confirm' && `Block ${profile.first_name}?`}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-red-400 text-sm flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {view === 'main' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView('report')}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white/80 hover:text-white transition-all text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Flag size={16} className="text-yellow-400" />
                Report Profile
              </button>
              <button
                onClick={() => setView('block-confirm')}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:text-red-300 transition-all text-sm font-medium"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <ShieldOff size={16} />
                Block User
              </button>
            </div>
          )}

          {view === 'report' && (
            <div className="flex flex-col gap-3">
              <p className="text-white/50 text-sm">Select a reason for reporting:</p>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      background: selectedReason === reason
                        ? 'rgba(124,58,237,0.3)'
                        : 'rgba(255,255,255,0.05)',
                      border: selectedReason === reason
                        ? '1px solid rgba(124,58,237,0.6)'
                        : '1px solid rgba(255,255,255,0.08)',
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
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
              )}
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setView('main')}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Back
                </button>
                <button
                  onClick={handleReport}
                  disabled={!selectedReason || loading}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          )}

          {view === 'block-confirm' && (
            <div className="flex flex-col gap-4">
              <p className="text-white/70 text-sm leading-relaxed">
                Blocking <strong className="text-white">{profile.first_name}</strong> will remove them from your discovery and prevent any future contact. This action cannot be undone easily.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setView('main')}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {loading ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
