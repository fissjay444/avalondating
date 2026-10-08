import React from 'react';
import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="py-20 px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-10 lg:p-16 text-center"
          style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #5B21B6 100%)', boxShadow: '0 0 80px rgba(124,58,237,0.4)' }}>
          {/* Background glow orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)' }} />

          <div className="relative z-10">
            <p className="font-script text-white/80 text-xl mb-2">Your story is waiting</p>
            <h2 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight mb-4">
              Find Your <span className="text-gold">Perfect Match</span> Today
            </h2>
            <p className="text-white/70 text-base lg:text-lg max-w-2xl mx-auto mb-8">
              Join 2.4 million real singles who found meaningful connections on Avalon Dating. Your next great love story starts with a single swipe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-gold px-12 py-4 text-lg font-bold inline-block">
                Join Free — It Takes 2 Minutes
              </Link>
              <Link href="/discover" className="btn-outline-white px-10 py-4 text-base font-semibold inline-block">
                Browse Profiles First
              </Link>
            </div>
            <p className="text-white/40 text-xs mt-6">No credit card required · Cancel anytime · 100% free to start</p>
          </div>
        </div>
      </div>
    </section>
  );
}