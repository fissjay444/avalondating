'use client';
import React from 'react';
import Link from 'next/link';
import FloatingHearts from './FloatingHearts';
import PhoneMockupLeft from './PhoneMockupLeft';
import PhoneMockupCenter from './PhoneMockupCenter';
import PhoneMockupRight from './PhoneMockupRight';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center pt-24 pb-16 overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.35) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(236,72,153,0.18) 0%, transparent 70%)' }} />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
      </div>

      <FloatingHearts />

      {/* Real People Real Love bubble — top right */}
      <div className="absolute top-28 right-6 lg:right-16 xl:right-24 z-10 hidden sm:block">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, #4C1D95 100%)', boxShadow: '0 0 30px rgba(124,58,237,0.6)' }} />
          <div className="relative text-center z-10 px-2">
            <p className="font-script text-white text-sm leading-tight">Real People</p>
            <p className="font-script text-white text-sm leading-tight">Real Love</p>
            <span className="text-accent text-lg">♡</span>
          </div>
        </div>
      </div>

      {/* Logo + Brand */}
      <div className="relative z-10 text-center mb-4">
        {/* Sparkle dots */}
        <div className="flex justify-center gap-2 mb-2">
          <span className="sparkle text-gold text-lg" style={{ animationDelay: '0s' }}>✦</span>
          <span className="sparkle text-accent text-sm" style={{ animationDelay: '0.4s' }}>✦</span>
          <span className="sparkle text-gold text-xs" style={{ animationDelay: '0.8s' }}>✦</span>
        </div>

        {/* Big brand logo area */}
        <div className="flex items-center justify-center gap-3 mb-3">
          {/* Heart icon */}
          <div className="relative w-16 h-16 lg:w-20 lg:h-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-2xl" fill="none">
                <defs>
                  <radialGradient id="heartGrad" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="60%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#4C1D95" />
                  </radialGradient>
                  <radialGradient id="goldRingGrad" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </radialGradient>
                </defs>
                {/* Purple heart */}
                <path d="M40 68 C40 68 8 48 8 26 C8 16 16 8 26 8 C32 8 38 12 40 18 C42 12 48 8 54 8 C64 8 72 16 72 26 C72 48 40 68 40 68Z" fill="url(#heartGrad)" />
                {/* Gold ring overlay */}
                <path d="M40 62 C40 62 12 44 12 26 C12 18 18 12 26 12 C31 12 36 15 38 20" stroke="url(#goldRingGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M42 20 C44 15 49 12 54 12 C62 12 68 18 68 26 C68 44 40 62 40 62" stroke="url(#goldRingGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                {/* Sparkle at top */}
                <circle cx="40" cy="10" r="2.5" fill="#FBBF24" opacity="0.9" />
                <circle cx="36" cy="8" r="1.2" fill="#FBBF24" opacity="0.6" />
                <circle cx="44" cy="8" r="1.2" fill="#FBBF24" opacity="0.6" />
              </svg>
            </div>
          </div>

          <div className="text-left">
            <div className="font-display font-bold leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', background: 'linear-gradient(135deg, #c084fc 0%, #a855f7 40%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: 'none' }}>
              Avalon
            </div>
            <div className="font-display font-bold leading-none"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', background: 'linear-gradient(135deg, #FBBF24 0%, #D4AF37 50%, #FBBF24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: 'none' }}>
              Dating
            </div>
          </div>
        </div>

        {/* Tagline dots */}
        <div className="flex items-center justify-center gap-3 text-white/70 text-xs tracking-[0.25em] uppercase font-medium mb-3">
          <span>Real People</span>
          <span className="text-gold">•</span>
          <span>Real Connections</span>
          <span className="text-gold">•</span>
          <span>A Brighter Tomorrow</span>
        </div>

        {/* Script tagline */}
        <p className="font-script text-white text-xl lg:text-2xl opacity-90 flex items-center justify-center gap-2">
          Love is closer than you think
          <span className="text-accent">♡</span>
        </p>
      </div>

      {/* Three Phone Mockups */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row items-end justify-center gap-6 xl:gap-10">
          {/* Left phone */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center">
              <p className="text-white text-xl lg:text-2xl font-semibold leading-tight">
                Find your <span className="text-2xl">🙂</span>
              </p>
              <p className="text-white text-2xl lg:text-3xl font-extrabold leading-tight text-accent">PERFECT MATCH</p>
              <p className="font-script text-white/80 text-base mt-1">Love is closer than you think <span className="text-accent">💗</span></p>
            </div>
            <PhoneMockupLeft />
          </div>

          {/* Center phone — tallest */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-up lg:-mb-8" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <p className="text-white text-xl lg:text-2xl font-semibold leading-tight">Discover</p>
              <p className="text-white text-2xl lg:text-3xl font-extrabold leading-tight">
                <span className="text-gold">10,000+</span> Verified
              </p>
              <p className="text-white/80 text-base font-medium">real profiles</p>
            </div>
            <PhoneMockupCenter />
          </div>

          {/* Right phone */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <p className="text-white text-xl lg:text-2xl font-extrabold leading-tight flex items-center justify-center gap-2">
                <span className="text-2xl">💬</span> <span className="text-gold shimmer-text">CHAT</span>
              </p>
              <p className="text-white text-2xl lg:text-3xl font-bold leading-tight">with Singles</p>
              <p className="text-white/60 text-xs tracking-wider mt-1">Real People • Real Conversations • Real Connections</p>
            </div>
            <PhoneMockupRight />
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <Link href="/signup" className="btn-primary px-10 py-4 text-lg font-bold text-center">
          Find Your Match ❤️
        </Link>
        <Link href="/discover" className="btn-outline-white px-10 py-4 text-lg font-semibold text-center">
          Browse Profiles
        </Link>
      </div>
    </section>
  );
}