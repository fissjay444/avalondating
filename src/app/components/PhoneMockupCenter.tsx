import React from 'react';
import AppImage from '@/components/ui/AppImage';

const profiles = [
{ id: 'p-nancy', name: 'Nancy', age: 25, city: 'New York, USA', src: "https://images.unsplash.com/photo-1633600317049-0aea268b8aa2", alt: 'Nancy, 25, woman with glasses smiling warmly' },
{ id: 'p-helen', name: 'Helen', age: 24, city: 'Los Angeles, USA', src: "https://img.rocket.new/generatedImages/rocket_gen_img_1d78fa8e6-1773508582787.png", alt: 'Helen, 24, woman with curly hair outdoors' },
{ id: 'p-sofia', name: 'Sofia', age: 24, city: 'Chicago, USA', src: "https://img.rocket.new/generatedImages/rocket_gen_img_1afbed7af-1772227444596.png", alt: 'Sofia, 24, blonde woman with natural smile' },
{ id: 'p-david', name: 'David', age: 32, city: 'Miami, USA', src: "https://img.rocket.new/generatedImages/rocket_gen_img_11b6588a3-1772086957620.png", alt: 'David, 32, man with friendly smile outdoors' }];


export default function PhoneMockupCenter() {
  return (
    <div className="phone-frame w-[200px] sm:w-[220px] lg:w-[240px] h-[440px] sm:h-[480px] lg:h-[520px] flex flex-col">
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="phone-notch" />
      </div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
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

      {/* Profile grid */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 grid grid-cols-2 gap-2 content-start">
        {profiles?.map((p) =>
        <div key={p?.id} className="relative rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="relative h-24">
              <AppImage
              src={p?.src}
              alt={p?.alt}
              fill
              className="object-cover"
              sizes="100px" />
            
              <div className="absolute top-1.5 right-1.5 online-dot" />
            </div>
            <div className="p-1.5">
              <button className="w-full py-1 rounded-lg text-white text-xs font-semibold mb-1 flex items-center justify-center gap-1"
            style={{ background: 'linear-gradient(135deg, #EC4899, #7C3AED)', fontSize: '10px' }}>
                <span>🙂</span> Send message
              </button>
              <p className="text-white font-semibold text-xs">{p?.name}, {p?.age}</p>
              <div className="flex items-center gap-0.5 text-white/60" style={{ fontSize: '9px' }}>
                <span>📍</span>
                <span className="truncate">{p?.city}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);

}