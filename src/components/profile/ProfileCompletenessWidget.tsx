'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';

interface ProfileCompletenessProps {
  compact?: boolean;
  onRefresh?: () => void;
}

export default function ProfileCompletenessWidget({ compact = false, onRefresh }: ProfileCompletenessProps) {
  const { data, loading, error, refetch } = useProfileCompleteness(true);
  const prevScoreRef = useRef<number | null>(null);

  // Auto-refresh when parent signals a change
  useEffect(() => {
    if (onRefresh) refetch();
  }, [onRefresh, refetch]);

  // Track score changes
  useEffect(() => {
    if (data?.score !== undefined) {
      prevScoreRef.current = data.score;
    }
  }, [data?.score]);

  if (loading) {
    return (
      <div className="glass rounded-3xl p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded-full w-1/2 mb-4" />
        <div className="h-3 bg-white/10 rounded-full w-full mb-2" />
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { score, items } = data;
  const incompleteItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  // Circular progress values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? '#FBBF24' :
    score >= 50 ? '#7C3AED': '#EC4899';

  if (compact) {
    return (
      <div className="glass rounded-2xl p-4 flex items-center gap-4">
        {/* Mini circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="56" height="56" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
            {score}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Profile {score}% Complete</p>
          {incompleteItems.length > 0 ? (
            <p className="text-white/60 text-xs mt-0.5 truncate">
              {incompleteItems[0].label} →
            </p>
          ) : (
            <p className="text-gold text-xs mt-0.5">✨ Profile complete!</p>
          )}
        </div>
        <Link href="/profile" className="text-white/40 hover:text-white transition-colors flex-shrink-0">
          <ChevronRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            {/* Background track */}
            <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">{score}%</span>
            <span className="text-white/50 text-xs mt-0.5">done</span>
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 pt-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-gold" />
            <h3 className="text-white font-bold text-lg">
              Your Profile is {score}% Complete
            </h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            {score === 100
              ? '✨ Amazing! Your profile is fully complete.'
              : 'Complete your profile to help people discover the real you.'}
          </p>

          {/* Horizontal progress bar */}
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${score}%`,
                background: `linear-gradient(90deg, #EC4899, #7C3AED, #FBBF24)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Incomplete items */}
      {incompleteItems.length > 0 && (
        <div className="mb-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Complete these to boost your profile
          </p>
          <div className="space-y-2">
            {incompleteItems.map(item => (
              <Link
                key={item.key}
                href={item.action_href}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 transition-all group"
              >
                <Circle size={18} className="text-white/30 flex-shrink-0" />
                <span className="text-white/80 text-sm flex-1">{item.label}</span>
                <span className="text-white/30 text-xs">{item.weight}%</span>
                <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed items */}
      {completedItems.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">
            Completed
          </p>
          <div className="space-y-2">
            {completedItems.map(item => (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-2xl bg-green-500/5 border border-green-500/20"
              >
                <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                <span className="text-white/60 text-sm flex-1 line-through decoration-white/20">{item.label}</span>
                <span className="text-green-400/60 text-xs">+{item.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
