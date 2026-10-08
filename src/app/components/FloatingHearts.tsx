'use client';
import React from 'react';

const hearts = [
  { size: 52, top: '12%', left: '3%', delay: '0s', className: 'floating-heart', opacity: 0.9 },
  { size: 36, top: '25%', left: '7%', delay: '1.2s', className: 'floating-heart-2', opacity: 0.7 },
  { size: 64, top: '8%', left: '14%', delay: '0.5s', className: 'floating-heart-3', opacity: 0.85 },
  { size: 28, top: '40%', left: '2%', delay: '2s', className: 'floating-heart', opacity: 0.6 },
  { size: 44, top: '15%', right: '8%', delay: '0.8s', className: 'floating-heart-2', opacity: 0.9 },
  { size: 32, top: '35%', right: '3%', delay: '1.5s', className: 'floating-heart-3', opacity: 0.7 },
  { size: 56, top: '20%', right: '16%', delay: '0.3s', className: 'floating-heart', opacity: 0.8 },
  { size: 22, top: '50%', right: '6%', delay: '2.5s', className: 'floating-heart-2', opacity: 0.5 },
];

function HeartSVG({ size, color = '#EC4899' }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <radialGradient id={`hg-${size}-${color.replace('#','')}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#9333ea" />
        </radialGradient>
      </defs>
      <path
        d="M20 35 C20 35 4 24 4 13 C4 8 8 4 13 4 C16 4 19 6 20 9 C21 6 24 4 27 4 C32 4 36 8 36 13 C36 24 20 35 20 35Z"
        fill={`url(#hg-${size}-${color.replace('#','')})`}
      />
      <path d="M14 10 C12 11 11 13 11 15" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function FloatingHearts() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h, i) => (
        <div
          key={`heart-float-${i}`}
          className={h.className}
          style={{
            position: 'absolute',
            top: h.top,
            left: (h as Record<string, unknown>).left as string | undefined,
            right: (h as Record<string, unknown>).right as string | undefined,
            opacity: h.opacity,
            animationDelay: h.delay,
          }}
        >
          <HeartSVG size={h.size} />
        </div>
      ))}
    </div>
  );
}