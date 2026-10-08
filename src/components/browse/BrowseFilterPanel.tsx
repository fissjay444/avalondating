'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Search } from 'lucide-react';
import type { BrowseFilters } from '@/hooks/useBrowse';
import { DEFAULT_FILTERS } from '@/hooks/useBrowse';
import { createClient } from '@/lib/supabase/client';

interface BrowseFilterPanelProps {
  filters: BrowseFilters;
  onApply: (filters: BrowseFilters) => void;
  onClose: () => void;
  isOpen: boolean;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'non-binary', label: 'Non-binary' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'newest', label: 'Newest Profiles' },
];

const INTENTION_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'casual', label: 'Casual Dating' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'marriage', label: 'Marriage' },
];

export default function BrowseFilterPanel({ filters, onApply, onClose, isOpen }: BrowseFilterPanelProps) {
  const [local, setLocal] = useState<BrowseFilters>(filters);
  const [allInterests, setAllInterests] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  useEffect(() => {
    supabase
      .from('interests')
      .select('name')
      .order('name')
      .then(({ data }) => {
        if (data) setAllInterests(data.map(i => i.name));
      });
  }, [supabase]);

  const toggleInterest = (name: string) => {
    setLocal(prev => ({
      ...prev,
      interests: prev.interests.includes(name)
        ? prev.interests.filter(i => i !== name)
        : [...prev.interests, name],
    }));
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const hasActiveFilters = (
    local.gender !== DEFAULT_FILTERS.gender ||
    local.minAge !== DEFAULT_FILTERS.minAge ||
    local.maxAge !== DEFAULT_FILTERS.maxAge ||
    local.verifiedOnly ||
    local.onlineOnly ||
    local.interests.length > 0 ||
    local.relationshipIntention !== DEFAULT_FILTERS.relationshipIntention
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — slides in from right on desktop, bottom on mobile */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-[70] w-full sm:w-96 overflow-y-auto"
            style={{
              background: 'linear-gradient(180deg, #1a0a3e 0%, #0d0520 100%)',
              borderLeft: '1px solid rgba(124,58,237,0.3)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{ background: 'rgba(26,10,62,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-purple-400" />
                <h2 className="text-white font-semibold text-base">Filter Profiles</h2>
                {hasActiveFilters && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', color: 'white' }}
                  >
                    Active
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-6">
              {/* Sort */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">Sort By</label>
                <div className="flex flex-col gap-2">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLocal(prev => ({ ...prev, sort: opt.value as BrowseFilters['sort'] }))}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                      style={{
                        background: local.sort === opt.value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        border: local.sort === opt.value ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                        color: local.sort === opt.value ? 'white' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {opt.label}
                      {local.sort === opt.value && <span className="text-purple-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">Show Me</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLocal(prev => ({ ...prev, gender: opt.value }))}
                      className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: local.gender === opt.value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        border: local.gender === opt.value ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                        color: local.gender === opt.value ? 'white' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">
                  Age Range: <span className="text-white">{local.minAge} – {local.maxAge}</span>
                </label>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Min age: {local.minAge}</span>
                      <span>18 – 80</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={80}
                      value={local.minAge}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setLocal(prev => ({ ...prev, minAge: Math.min(val, prev.maxAge - 1) }));
                      }}
                      className="w-full accent-purple-500"
                      aria-label="Minimum age"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>Max age: {local.maxAge}</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={80}
                      value={local.maxAge}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setLocal(prev => ({ ...prev, maxAge: Math.max(val, prev.minAge + 1) }));
                      }}
                      className="w-full accent-purple-500"
                      aria-label="Maximum age"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block">Quick Filters</label>
                {[
                  { key: 'verifiedOnly' as const, label: 'Verified profiles only', icon: '✓' },
                  { key: 'onlineOnly' as const, label: 'Online now only', icon: '🟢' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setLocal(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                    style={{
                      background: local[key] ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                      border: local[key] ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                    aria-pressed={local[key]}
                  >
                    <span className="flex items-center gap-2 text-white/80">
                      <span>{icon}</span>
                      {label}
                    </span>
                    <div
                      className="w-10 h-5 rounded-full relative transition-all flex-shrink-0"
                      style={{ background: local[key] ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'rgba(255,255,255,0.15)' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: local[key] ? '22px' : '2px' }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Relationship Intention */}
              <div>
                <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">Looking For</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTENTION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLocal(prev => ({ ...prev, relationshipIntention: opt.value }))}
                      className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: local.relationshipIntention === opt.value ? 'rgba(236,72,153,0.25)' : 'rgba(255,255,255,0.05)',
                        border: local.relationshipIntention === opt.value ? '1px solid rgba(236,72,153,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        color: local.relationshipIntention === opt.value ? 'white' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              {allInterests.length > 0 && (
                <div>
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-3">
                    Interests {local.interests.length > 0 && <span className="text-purple-400">({local.interests.length} selected)</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allInterests.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                        style={{
                          background: local.interests.includes(interest)
                            ? 'linear-gradient(135deg, #EC4899, #7C3AED)'
                            : 'rgba(124,58,237,0.15)',
                          border: local.interests.includes(interest)
                            ? '1px solid transparent' :'1px solid rgba(124,58,237,0.3)',
                          color: local.interests.includes(interest) ? 'white' : 'rgba(255,255,255,0.7)',
                        }}
                        aria-pressed={local.interests.includes(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div
              className="sticky bottom-0 p-5 flex gap-3"
              style={{ background: 'rgba(13,5,32,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Search bar component
interface BrowseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function BrowseSearchBar({ value, onChange, onSubmit }: BrowseSearchBarProps) {
  return (
    <div className="relative flex-1 max-w-xs">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder="Search by name or city…"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
        aria-label="Search profiles by name or city"
      />
    </div>
  );
}
