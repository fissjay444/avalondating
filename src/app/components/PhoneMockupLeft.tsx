import React from 'react';
import AppImage from '@/components/ui/AppImage';

export default function PhoneMockupLeft() {
  return (
    <div className="phone-frame w-[200px] sm:w-[220px] lg:w-[240px] h-[400px] sm:h-[440px] lg:h-[480px] flex flex-col relative">
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-1 z-10 relative">
        <div className="phone-notch" />
      </div>

      {/* Phone top bar */}
      <div className="flex items-center justify-between px-4 py-2 z-10">
        <div className="w-6 h-1 bg-white/30 rounded" />
        <div className="flex items-center gap-1">
          <span className="text-gold text-xs font-bold">Z+</span>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/70 text-xs">★</span>
          </div>
          <div className="relative w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/70 text-xs">🔔</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full" />
          </div>
        </div>
      </div>

      {/* Profile photo — fills the phone */}
      <div className="flex-1 relative overflow-hidden mx-2 rounded-2xl">
        <AppImage
          src="https://img.rocket.new/generatedImages/rocket_gen_img_1d78fa8e6-1773508582787.png"
          alt="Amy, 26, smiling young woman with curly hair in natural sunlight"
          fill
          className="object-cover"
          sizes="240px" />
        
        {/* Online indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1 glass rounded-full px-2 py-1">
          <div className="online-dot" />
          <span className="text-white text-xs font-medium">Online</span>
        </div>

        {/* Photo progress dots */}
        <div className="absolute top-3 right-3 flex gap-1">
          {['dot-1', 'dot-2', 'dot-3']?.map((d, i) =>
          <div key={d} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-white' : 'w-2 bg-white/40'}`} />
          )}
        </div>

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-white font-bold text-base">Amy, 26</p>
            <div className="verified-badge ml-1">
              <span className="text-background text-xs">✓</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-xs">
            <span>📍</span>
            <span>New York, USA</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 py-3 px-4">
        <button className="w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-xl hover:scale-110 transition-transform">
          🙂
        </button>
        <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"
        style={{ background: 'linear-gradient(135deg, #EC4899, #f43f5e)', boxShadow: '0 0 20px rgba(236,72,153,0.5)' }}>
          ❤️
        </button>
      </div>
    </div>);

}